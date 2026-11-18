import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../src/lib/supabaseAdmin';
import {
  extractUserIdFromExternalReference,
  getMercadoPagoAuthorizedPayment,
  getMercadoPagoPayment,
  getMercadoPagoPreapproval,
  reconcileMercadoPagoSubscription,
  verifyMercadoPagoWebhookSignature,
} from '../../../../src/lib/mercadopago';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    provider: 'mercadopago',
    webhook: 'ready',
  });
}

export async function POST(req) {
  try {
    const rawBody = await req.json().catch(() => ({}));
    const url = new URL(req.url);

    // 1. Validate Mercado Pago HMAC-SHA256 signature
    const sigCheck = verifyMercadoPagoWebhookSignature(req, rawBody?.data?.id);
    if (!sigCheck.valid) {
      if (sigCheck.reason === 'missing_webhook_secret') {
        console.error('Mercado Pago webhook rejected: MP_WEBHOOK_SECRET not configured');
        return NextResponse.json(
          { error: 'MP_WEBHOOK_SECRET no configurado en el servidor.' },
          { status: 500 }
        );
      }

      console.warn('Mercado Pago webhook invalid signature:', sigCheck.reason);
      return NextResponse.json(
        { error: 'Firma de webhook inválida.', reason: sigCheck.reason },
        { status: 401 }
      );
    }

    const type = String(
      rawBody?.type ||
        rawBody?.topic ||
        url.searchParams.get('type') ||
        url.searchParams.get('topic') ||
        ''
    )
      .trim()
      .toLowerCase();
    const action = String(rawBody?.action || '').trim().toLowerCase();
    const resourceId = String(
      rawBody?.data?.id ||
        url.searchParams.get('data.id') ||
        url.searchParams.get('id') ||
        ''
    ).trim();

    if (!type || !resourceId) {
      return NextResponse.json({ ok: true, ignored: true, reason: 'missing_type_or_id' });
    }

    const notificationId = rawBody?.id ? String(rawBody.id) : '';
    const eventKey = notificationId
      ? `mp_notif:${notificationId}`
      : action
      ? `${type}:${action}:${resourceId}`
      : `${type}:${resourceId}:${req.headers.get('x-request-id') || 'noreq'}`;

    const supabaseAdmin = getSupabaseAdmin();

    // 2. Idempotency check in subscription_webhook_events
    let webhookTableAvailable = true;
    const { data: existingEvent, error: eventLookupErr } = await supabaseAdmin
      .from('subscription_webhook_events')
      .select('event_key')
      .eq('event_key', eventKey)
      .maybeSingle();

    if (eventLookupErr) {
      if (eventLookupErr.code === '42P01') {
        webhookTableAvailable = false;
        console.warn(
          'Table public.subscription_webhook_events not found yet. Run the Mercado Pago SQL migration.'
        );
      } else {
        console.error('Error checking webhook idempotency:', eventLookupErr);
        return NextResponse.json({ error: 'Database error checking webhook event.' }, { status: 500 });
      }
    } else if (existingEvent) {
      return NextResponse.json({ ok: true, duplicate: true, eventKey });
    }

    // 3. Query Mercado Pago API directly as authoritative source (never trust webhook payload state)
    let preapproval = null;
    let paymentEvent = null;

    if (type === 'subscription_preapproval' || type === 'preapproval') {
      preapproval = await getMercadoPagoPreapproval(resourceId);
    } else if (
      type === 'subscription_authorized_payment' ||
      type === 'authorized_payments'
    ) {
      const authorizedPayment = await getMercadoPagoAuthorizedPayment(resourceId);
      const linkedPreapprovalId =
        authorizedPayment?.preapproval_id || authorizedPayment?.subscription_id;
      if (!linkedPreapprovalId) {
        return NextResponse.json({
          ok: true,
          ignored: true,
          reason: 'authorized_payment_without_preapproval_id',
        });
      }
      preapproval = await getMercadoPagoPreapproval(linkedPreapprovalId);
      paymentEvent = {
        id: authorizedPayment?.payment?.id || authorizedPayment?.id || resourceId,
        status: authorizedPayment?.payment?.status || authorizedPayment?.status || null,
        date: authorizedPayment?.date_created || authorizedPayment?.last_modified || null,
      };
    } else if (type === 'payment') {
      const payment = await getMercadoPagoPayment(resourceId);
      const metaPreapprovalId =
        payment?.metadata?.preapproval_id || payment?.point_of_interaction?.transaction_data?.subscription_id;
      let resolvedPreapprovalId = metaPreapprovalId ? String(metaPreapprovalId) : null;

      if (!resolvedPreapprovalId && payment?.external_reference) {
        const { data: matchedSub } = await supabaseAdmin
          .from('user_subscriptions')
          .select('mp_preapproval_id')
          .eq('mp_external_reference', String(payment.external_reference))
          .maybeSingle();
        if (matchedSub?.mp_preapproval_id) {
          resolvedPreapprovalId = matchedSub.mp_preapproval_id;
        }
      }

      if (!resolvedPreapprovalId) {
        return NextResponse.json({
          ok: true,
          ignored: true,
          reason: 'payment_not_linked_to_subscription',
        });
      }

      preapproval = await getMercadoPagoPreapproval(resolvedPreapprovalId);
      paymentEvent = {
        id: payment?.id || resourceId,
        status: payment?.status || null,
        date: payment?.date_approved || payment?.date_created || null,
      };
    } else {
      return NextResponse.json({ ok: true, ignored: true, type });
    }

    if (!preapproval?.id) {
      return NextResponse.json({ ok: true, ignored: true, reason: 'preapproval_not_found' });
    }

    // Verify ownership/origin before reconciling
    const extUserId = extractUserIdFromExternalReference(preapproval.external_reference);
    if (!extUserId) {
      const { data: existingByPreapproval } = await supabaseAdmin
        .from('user_subscriptions')
        .select('user_id')
        .eq('mp_preapproval_id', String(preapproval.id))
        .maybeSingle();

      if (!existingByPreapproval?.user_id) {
        return NextResponse.json({
          ok: true,
          ignored: true,
          reason: 'unrecognized_external_subscription',
        });
      }
    }

    const updatedSub = await reconcileMercadoPagoSubscription({
      supabaseAdmin,
      preapproval,
      expectedUserId: extUserId || null,
      paymentEvent,
    });

    // 4. Record idempotency event
    if (webhookTableAvailable) {
      const { error: insertEventErr } = await supabaseAdmin
        .from('subscription_webhook_events')
        .upsert(
          {
            event_key: eventKey,
            provider: 'mercadopago',
            event_type: type,
            resource_id: resourceId,
            preapproval_id: String(preapproval.id),
            user_id: updatedSub?.user_id || extUserId || null,
            payload: {
              action: action || null,
              mp_status: preapproval.status || null,
              payment_status: paymentEvent?.status || null,
            },
          },
          { onConflict: 'event_key', ignoreDuplicates: true }
        );

      if (insertEventErr && insertEventErr.code !== '23505') {
        console.error('Error recording webhook idempotency event:', insertEventErr);
      }
    }

    return NextResponse.json({
      ok: true,
      processed: true,
      eventKey,
      preapprovalId: String(preapproval.id),
      userId: updatedSub?.user_id || null,
      planTier: updatedSub?.plan_tier || null,
      status: updatedSub?.status || null,
    });
  } catch (err) {
    console.error('Error in POST /api/webhooks/mercadopago:', err);
    return NextResponse.json(
      { error: err?.message || 'Error procesando webhook de Mercado Pago.' },
      { status: 500 }
    );
  }
}
