import { NextResponse } from 'next/server';
import { getAuthenticatedUserFromRequest, getSupabaseAdmin } from '../../../../src/lib/supabaseAdmin';
import {
  extractUserIdFromExternalReference,
  getMercadoPagoPreapproval,
  reconcileMercadoPagoSubscription,
} from '../../../../src/lib/mercadopago';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { user, error: authError } = await getAuthenticatedUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: authError || 'No autenticado.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const requestedPreapprovalId =
      body?.preapprovalId && typeof body.preapprovalId === 'string'
        ? body.preapprovalId.trim()
        : null;

    const supabaseAdmin = getSupabaseAdmin();

    const { data: existingSub, error: subReadErr } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (subReadErr) {
      console.error('Error reading user_subscriptions in verify:', subReadErr);
      return NextResponse.json(
        { error: 'No se pudo consultar tu suscripción en Supabase.' },
        { status: 500 }
      );
    }

    const targetPreapprovalId = existingSub?.mp_preapproval_id || requestedPreapprovalId;
    if (!targetPreapprovalId) {
      return NextResponse.json({
        verified: false,
        hasMercadoPagoSubscription: false,
        pendingVerification: false,
        isActivePremium:
          existingSub?.plan_tier === 'premium' && existingSub?.status === 'active',
        subscription: existingSub || null,
      });
    }

    // If caller passed a specific preapprovalId that differs from DB, strictly verify ownership via external_reference
    const preapprovalToVerify = requestedPreapprovalId || targetPreapprovalId;
    const mpPreapproval = await getMercadoPagoPreapproval(preapprovalToVerify);

    const extUserId = extractUserIdFromExternalReference(mpPreapproval?.external_reference);
    const ownsByDb =
      existingSub?.mp_preapproval_id &&
      existingSub.mp_preapproval_id === String(mpPreapproval.id);

    if (extUserId && extUserId !== user.id) {
      return NextResponse.json(
        { error: 'La suscripción consultada no pertenece a esta cuenta.' },
        { status: 403 }
      );
    }
    if (!extUserId && !ownsByDb) {
      return NextResponse.json(
        { error: 'No se pudo verificar la titularidad de la suscripción.' },
        { status: 403 }
      );
    }

    const updatedSub = await reconcileMercadoPagoSubscription({
      supabaseAdmin,
      preapproval: mpPreapproval,
      expectedUserId: user.id,
    });

    const mpStatus = String(mpPreapproval.status || '').toLowerCase();

    return NextResponse.json({
      verified: true,
      hasMercadoPagoSubscription: true,
      pendingVerification: mpStatus === 'pending',
      isActivePremium: updatedSub?.plan_tier === 'premium' && updatedSub?.status === 'active',
      mpStatus,
      subscription: updatedSub,
    });
  } catch (err) {
    console.error('Error in POST /api/subscriptions/verify:', err);
    const status = err?.status && err.status >= 400 && err.status < 600 ? err.status : 500;
    return NextResponse.json(
      { error: err?.message || 'Error al verificar la suscripción con Mercado Pago.' },
      { status }
    );
  }
}
