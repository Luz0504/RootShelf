-- Incremental migration for Mercado Pago monthly subscriptions in RootShelf
-- Safe to run multiple times (idempotent). Does NOT drop tables, truncate data,
-- or alter existing RLS policies / triggers on user_subscriptions or subscription_plan_limits.

-- 1. Add Mercado Pago tracking columns to public.user_subscriptions
ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS mp_preapproval_id TEXT,
  ADD COLUMN IF NOT EXISTS mp_external_reference TEXT,
  ADD COLUMN IF NOT EXISTS mp_status TEXT,
  ADD COLUMN IF NOT EXISTS mp_payer_email TEXT,
  ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS next_payment_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;

-- 2. Add unique partial indexes for fast, conflict-safe lookups from webhooks
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_mp_preapproval_id
  ON public.user_subscriptions (mp_preapproval_id)
  WHERE mp_preapproval_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_mp_external_reference
  ON public.user_subscriptions (mp_external_reference)
  WHERE mp_external_reference IS NOT NULL;

-- 3. Create idempotency log table for Mercado Pago webhooks
CREATE TABLE IF NOT EXISTS public.subscription_webhook_events (
  event_key TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'mercadopago',
  event_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  preapproval_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payload JSONB,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS with no public policies so only server-side service_role can read/write
ALTER TABLE public.subscription_webhook_events ENABLE ROW LEVEL SECURITY;

-- Optional defensive indexes for auditing events by preapproval or user
CREATE INDEX IF NOT EXISTS idx_subscription_webhook_events_preapproval
  ON public.subscription_webhook_events (preapproval_id);

CREATE INDEX IF NOT EXISTS idx_subscription_webhook_events_user_id
  ON public.subscription_webhook_events (user_id);
