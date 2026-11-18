import { NextResponse } from 'next/server';
import { getAuthenticatedUserFromRequest, getSupabaseAdmin } from '../../../../src/lib/supabaseAdmin';
import {
  cancelMercadoPagoPreapproval,
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

    const supabaseAdmin = getSupabaseAdmin();

    const { data: existingSub, error: subReadErr } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (subReadErr) {
      console.error('Error reading user_subscriptions in cancel:', subReadErr);
      return NextResponse.json(
        { error: 'No se pudo consultar tu suscripción actual.' },
        { status: 500 }
      );
    }

    if (!existingSub?.mp_preapproval_id) {
      if (existingSub?.plan_tier === 'premium' && existingSub?.provider !== 'mercadopago') {
        return NextResponse.json(
          {
            error:
              'Tu suscripción Premium actual fue asignada manualmente y no se gestiona desde Mercado Pago.',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'No hay una suscripción de Mercado Pago activa para cancelar.' },
        { status: 400 }
      );
    }

    // Cancel in Mercado Pago first
    await cancelMercadoPagoPreapproval(existingSub.mp_preapproval_id);

    // Re-fetch authoritative status from Mercado Pago API to confirm cancellation
    const verifiedPreapproval = await getMercadoPagoPreapproval(existingSub.mp_preapproval_id);
    const confirmedStatus = String(verifiedPreapproval?.status || '').toLowerCase();

    if (confirmedStatus !== 'cancelled') {
      return NextResponse.json(
        {
          error: `Mercado Pago devolvió el estado "${confirmedStatus || 'desconocido'}" al intentar cancelar. Intentá nuevamente en unos segundos.`,
        },
        { status: 502 }
      );
    }

    // Reconcile database (sets plan_tier = 'free', status = 'canceled', preserves all user content)
    const updatedSub = await reconcileMercadoPagoSubscription({
      supabaseAdmin,
      preapproval: verifiedPreapproval,
      expectedUserId: user.id,
    });

    return NextResponse.json({
      success: true,
      mpStatus: confirmedStatus,
      subscription: updatedSub,
    });
  } catch (err) {
    console.error('Error in POST /api/subscriptions/cancel:', err);
    const status = err?.status && err.status >= 400 && err.status < 600 ? err.status : 500;
    return NextResponse.json(
      { error: err?.message || 'Error al cancelar la suscripción en Mercado Pago.' },
      { status }
    );
  }
}
