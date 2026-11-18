import crypto from 'crypto';
import { isUUID } from './supabase';

const MP_API_BASE = 'https://api.mercadopago.com';

export function getMercadoPagoConfig() {
  const accessToken = (process.env.MP_ACCESS_TOKEN || '').trim();
  const rawAmount = Number(process.env.MP_PREMIUM_MONTHLY_AMOUNT || 3500);
  const amount = Number.isFinite(rawAmount) && rawAmount > 0 ? rawAmount : 3500;
  const currency = (process.env.MP_CURRENCY || 'ARS').trim().toUpperCase();
  const environment = (process.env.MP_ENVIRONMENT || 'test').trim().toLowerCase();
  const webhookSecret = (process.env.MP_WEBHOOK_SECRET || '').trim();
  const testPayerEmail = (process.env.MP_TEST_PAYER_EMAIL || '').trim();

  if (!accessToken) {
    throw new Error('Falta configurar MP_ACCESS_TOKEN en el servidor.');
  }

  return {
    accessToken,
    amount,
    currency,
    environment,
    isTestMode: environment !== 'production',
    webhookSecret,
    testPayerEmail,
  };
}

export function getAppBaseUrl(req) {
  const configuredAppUrl = (process.env.APP_URL || '').trim();
  if (
    configuredAppUrl &&
    configuredAppUrl !== 'MY_APP_URL' &&
    configuredAppUrl.startsWith('http')
  ) {
    return configuredAppUrl.replace(/\/+$/, '');
  }

  const forwardedHost = req.headers.get('x-forwarded-host');
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, '');
  }

  const host = req.headers.get('host');
  if (host) {
    const proto = host.includes('localhost') || host.startsWith('127.') ? 'http' : 'https';
    return `${proto}://${host}`.replace(/\/+$/, '');
  }

  return new URL(req.url).origin.replace(/\/+$/, '');
}

export function buildExternalReference(userId) {
  return `rootshelf:${userId}:${crypto.randomUUID()}`;
}

export function extractUserIdFromExternalReference(externalRef) {
  if (!externalRef || typeof externalRef !== 'string') return null;
  const parts = externalRef.split(':');
  if (parts.length < 2 || parts[0] !== 'rootshelf') return null;
  const candidate = parts[1];
  return isUUID(candidate) ? candidate : null;
}

async function mpFetch(path, options = {}) {
  const { accessToken } = getMercadoPagoConfig();
  const res = await fetch(`${MP_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const detail =
      data?.message ||
      data?.error ||
      (Array.isArray(data?.cause) && data.cause[0]?.description) ||
      `HTTP ${res.status}`;
    const err = new Error(`Mercado Pago API error: ${detail}`);
    err.status = res.status;
    err.mpPayload = data;
    throw err;
  }

  return data;
}

export async function createMercadoPagoPreapproval({
  userEmail,
  externalReference,
  backUrl,
  notificationUrl,
}) {
  const { amount, currency, isTestMode, testPayerEmail } = getMercadoPagoConfig();

  const resolvedPayerEmail =
    isTestMode && testPayerEmail ? testPayerEmail : (userEmail || '').trim();

  if (!resolvedPayerEmail) {
    throw new Error('La cuenta de usuario no tiene un correo electrónico válido para Mercado Pago.');
  }

  const payload = {
    reason: 'RootShelf Premium',
    external_reference: externalReference,
    payer_email: resolvedPayerEmail,
    back_url: backUrl,
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: amount,
      currency_id: currency,
    },
    status: 'pending',
  };

  if (notificationUrl && notificationUrl.startsWith('https://')) {
    payload.notification_url = notificationUrl;
  }

  const data = await mpFetch('/preapproval', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return {
    preapproval: data,
    payerEmailUsed: resolvedPayerEmail,
  };
}

export async function getMercadoPagoPreapproval(preapprovalId) {
  if (!preapprovalId) throw new Error('Falta preapprovalId.');
  return mpFetch(`/preapproval/${encodeURIComponent(String(preapprovalId))}`, {
    method: 'GET',
  });
}

export async function cancelMercadoPagoPreapproval(preapprovalId) {
  if (!preapprovalId) throw new Error('Falta preapprovalId.');
  return mpFetch(`/preapproval/${encodeURIComponent(String(preapprovalId))}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'cancelled' }),
  });
}

export async function getMercadoPagoAuthorizedPayment(authorizedPaymentId) {
  if (!authorizedPaymentId) throw new Error('Falta authorizedPaymentId.');
  return mpFetch(`/authorized_payments/${encodeURIComponent(String(authorizedPaymentId))}`, {
    method: 'GET',
  });
}

export async function getMercadoPagoPayment(paymentId) {
  if (!paymentId) throw new Error('Falta paymentId.');
  return mpFetch(`/v1/payments/${encodeURIComponent(String(paymentId))}`, {
    method: 'GET',
  });
}

/**
 * Validates Mercado Pago Webhook HMAC-SHA256 signature from x-signature and x-request-id headers.
 * Official manifest template: id:[data.id];request-id:[x-request-id];ts:[ts];
 */
export function verifyMercadoPagoWebhookSignature(req, bodyDataId = null) {
  const webhookSecret = (process.env.MP_WEBHOOK_SECRET || '').trim();
  if (!webhookSecret || webhookSecret === 'YOUR_MERCADOPAGO_WEBHOOK_SECRET') {
    return {
      valid: false,
      reason: 'missing_webhook_secret',
    };
  }

  const xSignature = req.headers.get('x-signature');
  const xRequestId = req.headers.get('x-request-id');

  if (!xSignature || !xRequestId) {
    return {
      valid: false,
      reason: 'missing_signature_headers',
    };
  }

  const url = new URL(req.url);
  const queryDataId = url.searchParams.get('data.id') || url.searchParams.get('id');
  const rawDataId = queryDataId || (bodyDataId ? String(bodyDataId) : '');

  if (!rawDataId) {
    return {
      valid: false,
      reason: 'missing_data_id',
    };
  }

  let ts = '';
  let receivedHash = '';

  for (const part of xSignature.split(',')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key === 'ts') ts = value;
    if (key === 'v1') receivedHash = value;
  }

  if (!ts || !receivedHash) {
    return {
      valid: false,
      reason: 'malformed_x_signature',
    };
  }

  // Mercado Pago normalizes alphanumeric data.id to lowercase in manifest calculation
  const normalizedDataId = rawDataId.toLowerCase();
  const manifest = `id:${normalizedDataId};request-id:${xRequestId};ts:${ts};`;

  const calculatedHash = crypto
    .createHmac('sha256', webhookSecret)
    .update(manifest)
    .digest('hex');

  try {
    const receivedBuf = Buffer.from(receivedHash, 'hex');
    const calculatedBuf = Buffer.from(calculatedHash, 'hex');

    if (receivedBuf.length === 0 || receivedBuf.length !== calculatedBuf.length) {
      return { valid: false, reason: 'signature_length_mismatch' };
    }

    const isMatch = crypto.timingSafeEqual(receivedBuf, calculatedBuf);
    return { valid: isMatch, reason: isMatch ? 'ok' : 'signature_mismatch' };
  } catch {
    return { valid: false, reason: 'signature_parse_error' };
  }
}

function addOneMonthIso(fromDate = new Date()) {
  const d = new Date(fromDate);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

/**
 * Reconciles a verified Mercado Pago preapproval object (and optional recurring payment)
 * into public.user_subscriptions using server-side Supabase admin credentials.
 */
export async function reconcileMercadoPagoSubscription({
  supabaseAdmin,
  preapproval,
  expectedUserId = null,
  paymentEvent = null,
}) {
  if (!preapproval?.id) {
    throw new Error('Objeto de suscripción de Mercado Pago inválido.');
  }

  const nowIso = new Date().toISOString();
  const extUserId = extractUserIdFromExternalReference(preapproval.external_reference);

  // Locate existing row in user_subscriptions
  let existingRow = null;

  if (expectedUserId) {
    const { data } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', expectedUserId)
      .maybeSingle();
    existingRow = data || null;

    if (extUserId && extUserId !== expectedUserId) {
      const err = new Error('La referencia externa de la suscripción no coincide con el usuario.');
      err.status = 403;
      throw err;
    }
  } else if (extUserId) {
    const { data } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', extUserId)
      .maybeSingle();
    existingRow = data || null;
  }

  if (!existingRow) {
    const { data: byPreapproval } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('mp_preapproval_id', String(preapproval.id))
      .maybeSingle();
    if (byPreapproval) {
      existingRow = byPreapproval;
    }
  }

  if (!existingRow && preapproval.external_reference) {
    const { data: byRef } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('mp_external_reference', String(preapproval.external_reference))
      .maybeSingle();
    if (byRef) {
      existingRow = byRef;
    }
  }

  const targetUserId = expectedUserId || extUserId || existingRow?.user_id || null;
  if (!targetUserId || !isUUID(targetUserId)) {
    throw new Error('No se pudo asociar la suscripción de Mercado Pago a un usuario válido.');
  }

  // If expectedUserId was provided, verify ownership if row already has a different mp_preapproval_id?
  // Note: allow matching the user's current mp_preapproval_id or external_reference
  if (
    expectedUserId &&
    existingRow?.mp_preapproval_id &&
    existingRow.mp_preapproval_id !== String(preapproval.id) &&
    extUserId !== expectedUserId
  ) {
    const err = new Error('Esta suscripción no pertenece a la cuenta autenticada.');
    err.status = 403;
    throw err;
  }

  const mpStatus = String(preapproval.status || '').toLowerCase();
  const paymentStatus = paymentEvent?.status ? String(paymentEvent.status).toLowerCase() : null;
  const isPaymentFailed =
    paymentStatus &&
    ['rejected', 'cancelled', 'refunded', 'charged_back'].includes(paymentStatus);
  const isPaymentSucceeded =
    paymentStatus && ['approved', 'accredited', 'processed'].includes(paymentStatus);

  let nextPlanTier = 'free';
  let nextStatus = 'active';
  let nextStartedAt = existingRow?.started_at || nowIso;
  let nextPeriodEnd = existingRow?.current_period_end || null;
  let nextPaymentDate = preapproval.next_payment_date || existingRow?.next_payment_date || null;
  let nextCanceledAt = existingRow?.canceled_at || null;
  let nextLastPaymentAt = existingRow?.last_payment_at || null;
  let nextLastPaymentId = existingRow?.last_payment_id || null;

  if (isPaymentFailed) {
    // Recurring charge failed -> revoke active Premium access cleanly without deleting user content
    nextPlanTier = 'free';
    nextStatus = 'past_due';
    nextLastPaymentId = paymentEvent?.id ? String(paymentEvent.id) : nextLastPaymentId;
  } else if (mpStatus === 'authorized') {
    nextPlanTier = 'premium';
    nextStatus = 'active';
    nextStartedAt = existingRow?.plan_tier === 'premium' && existingRow?.started_at
      ? existingRow.started_at
      : preapproval.date_created || nowIso;
    nextPeriodEnd = preapproval.next_payment_date || addOneMonthIso(nowIso);
    nextCanceledAt = null;
    if (isPaymentSucceeded) {
      nextLastPaymentAt = paymentEvent?.date || nowIso;
      nextLastPaymentId = paymentEvent?.id ? String(paymentEvent.id) : nextLastPaymentId;
    }
  } else if (mpStatus === 'paused') {
    nextPlanTier = 'free';
    nextStatus = 'past_due';
  } else if (mpStatus === 'cancelled') {
    nextPlanTier = 'free';
    nextStatus = 'canceled';
    nextCanceledAt = existingRow?.canceled_at || nowIso;
  } else {
    // 'pending' or unknown state -> NEVER activate Premium provisionally
    const hasUnrelatedActiveManualPremium =
      existingRow?.provider === 'manual' &&
      existingRow?.plan_tier === 'premium' &&
      existingRow?.status === 'active';
    nextPlanTier = hasUnrelatedActiveManualPremium ? 'premium' : 'free';
    nextStatus = 'active';
  }

  const upsertPayload = {
    user_id: targetUserId,
    plan_tier: nextPlanTier,
    status: nextStatus,
    started_at: nextStartedAt,
    current_period_end: nextPeriodEnd,
    updated_at: nowIso,
    provider: 'mercadopago',
    mp_preapproval_id: String(preapproval.id),
    mp_external_reference:
      preapproval.external_reference || existingRow?.mp_external_reference || null,
    mp_status: mpStatus || null,
    mp_payer_email: preapproval.payer_email || existingRow?.mp_payer_email || null,
    last_payment_at: nextLastPaymentAt,
    last_payment_id: nextLastPaymentId,
    next_payment_date: nextPaymentDate,
    canceled_at: nextCanceledAt,
  };

  const { data: savedRow, error: saveError } = await supabaseAdmin
    .from('user_subscriptions')
    .upsert(upsertPayload, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (saveError) {
    throw saveError;
  }

  return savedRow;
}
