-- ============================================
-- Migration: Hybrid-Trial Monetization Columns
-- Adds subscription/trial/price-lock fields to businesses table
-- ============================================

-- 1. Create ENUM type (idempotent)
DO $$ BEGIN
  CREATE TYPE subscription_status_enum AS ENUM ('basic', 'trial', 'active', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add subscription_status column
DO $$ BEGIN
  ALTER TABLE public.businesses ADD COLUMN subscription_status subscription_status_enum DEFAULT 'basic';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 3. Add trial_ends_at column
DO $$ BEGIN
  ALTER TABLE public.businesses ADD COLUMN trial_ends_at TIMESTAMPTZ DEFAULT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 4. Add locked_price column (price frozen at subscription time)
DO $$ BEGIN
  ALTER TABLE public.businesses ADD COLUMN locked_price NUMERIC DEFAULT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 5. Add price_lock_ends_at column (90-day anti-inflation lock)
DO $$ BEGIN
  ALTER TABLE public.businesses ADD COLUMN price_lock_ends_at TIMESTAMPTZ DEFAULT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 6. Add mp_preapproval_id column (Mercado Pago subscription ID)
DO $$ BEGIN
  ALTER TABLE public.businesses ADD COLUMN mp_preapproval_id VARCHAR(255) DEFAULT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 7. Index for subscription_status queries
CREATE INDEX IF NOT EXISTS idx_businesses_sub_status ON public.businesses(subscription_status);

-- 8. Backfill: existing premium businesses get 'active' status
UPDATE public.businesses
SET subscription_status = 'active'
WHERE is_premium = true
  AND (subscription_status IS NULL OR subscription_status = 'basic');
