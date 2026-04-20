-- ============================================
-- RPC: resolve_access_priority(business_id)
-- 4-tier access resolution mirroring frontend logic
-- ============================================

CREATE OR REPLACE FUNCTION public.resolve_access_priority(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  biz RECORD;
BEGIN
  SELECT is_premium, free_until, subscription_status, trial_ends_at
  INTO biz
  FROM public.businesses
  WHERE id = p_business_id;

  IF biz IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Tier 1: Permanent override (admin/legacy)
  IF biz.is_premium = true THEN
    RETURN TRUE;
  END IF;

  -- Tier 2: Temporary bonification
  IF biz.free_until IS NOT NULL AND biz.free_until > NOW() THEN
    RETURN TRUE;
  END IF;

  -- Tier 3: Paid subscription
  IF biz.subscription_status = 'active' THEN
    RETURN TRUE;
  END IF;

  -- Tier 4: Active trial
  IF biz.subscription_status = 'trial' AND biz.trial_ends_at IS NOT NULL AND biz.trial_ends_at > NOW() THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;
