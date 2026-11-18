import { NextResponse } from 'next/server';
import { getAuthenticatedUserFromRequest, getSupabaseAdmin } from '../../../../src/lib/supabaseAdmin';
import {
  buildExternalReference,
  createMercadoPagoPreapproval,
  getAppBaseUrl,
  getMercadoPagoConfig,
} from '../../../../src/lib/mercadopago';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { user, error: authError } = await getAuthenticatedUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: authError || 'No autenticado.' }, { status: 401 });
    }

    const mpConfig = getMercadoPagoConfig();
    const supabaseAdmin = getSupabaseAdmin();

    // Check current subscription in Supabase
    const { data: existingSub, error: subReadErr } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (subReadErr) {
      console.error('Error reading user_subscriptions in create:', subReadErr);
      return NextResponse.json(
        { error: 'No se pudo consultar el estado actual de tu suscripción.' },
        { status: 500 }
      );
    }

    if (existingSub?.plan_tier === 'premium' && existingSub?.status === 'active') {
      return NextResponse.json(
        { error: 'Tu cuenta ya tiene una suscripción RootShelf Premium activa.' },
        { status: 409 }
      );
    }

    const baseUrl = getAppBaseUrl(req);
    const externalReference = buildExternalReference(user.id);
    const backUrl = `${baseUrl}/premium?mp_return=1`;
    const notificationUrl = `${baseUrl}/api/webhooks/mercadopago`;

    const { preapproval, payerEmailUsed } = await createMercadoPagoPreapproval({
      userEmail: user.email,
      externalReference,
      backUrl,
      notificationUrl,
    });

    const initPoint = preapproval?.init_point || preapproval?.sandbox_init_point;
    if (!preapproval?.id || !initPoint) {
      return NextResponse.json(
        { error: 'Mercado Pago no devolvió una URL de pago válida.' },
        { status: 502 }
      );
    }

    const nowIso = new Date().toISOString();

    // Persist pending checkout metadata WITHOUT activating Premium
    const upsertPayload = {
      user_id: user.id,
      plan_tier: 'free',
      status: existingSub?.status === 'past_due' ? 'past_due' : 'active',
      started_at: existingSub?.started_at || nowIso,
      updated_at: nowIso,
      provider: 'mercadopago',
      mp_preapproval_id: String(preapproval.id),
      mp_external_reference: externalReference,
      mp_status: String(preapproval.status || 'pending').toLowerCase(),
      mp_payer_email: payerEmailUsed,
    };

    const { error: saveErr } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert(upsertPayload, { onConflict: 'user_id' });

    if (saveErr) {
      console.error('Error saving Mercado Pago preapproval reference:', saveErr);
      if (saveErr.code === '42703') {
        return NextResponse.json(
          {
            error:
              'Falta ejecutar la migración SQL de Mercado Pago en Supabase (columnas mp_* en user_subscriptions).',
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: 'No se pudo registrar la suscripción pendiente en la base de datos.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      init_point: initPoint,
      preapproval_id: String(preapproval.id),
      status: preapproval.status || 'pending',
      environment: mpConfig.environment,
      amount: mpConfig.amount,
      currency: mpConfig.currency,
    });
  } catch (err) {
    const status = err?.status && err.status >= 400 && err.status < 600 ? err.status : 500;
    if (status >= 500) {
      console.error('Error in POST /api/subscriptions/create:', err);
    } else {
      console.warn('Validation error in POST /api/subscriptions/create:', err?.message);
    }
    return NextResponse.json(
      { error: err?.message || 'Error al iniciar la suscripción con Mercado Pago.' },
      { status }
    );
  }
}
