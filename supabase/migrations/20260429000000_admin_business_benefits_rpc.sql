-- Admin-only RPC for benefit/monetization changes from the Suito dashboard.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
          AND t.typname = 'subscription_status_enum'
    ) THEN
        GRANT USAGE ON TYPE public.subscription_status_enum TO authenticated;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_business_benefits(
    p_business_id UUID,
    p_is_premium BOOLEAN DEFAULT NULL,
    p_subscription_status TEXT DEFAULT NULL,
    p_trial_ends_at TIMESTAMPTZ DEFAULT NULL,
    p_free_until TIMESTAMPTZ DEFAULT NULL,
    p_clear_trial_ends_at BOOLEAN DEFAULT FALSE,
    p_clear_free_until BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_status_udt TEXT;
    v_status_expr TEXT;
    v_rows INTEGER;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_super_admin(auth.uid()) THEN
        RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
    END IF;

    IF p_subscription_status IS NOT NULL
       AND p_subscription_status NOT IN ('basic', 'trial', 'active', 'expired') THEN
        RAISE EXCEPTION 'invalid_subscription_status' USING ERRCODE = '22023';
    END IF;

    SELECT udt_name
      INTO v_status_udt
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'businesses'
       AND column_name = 'subscription_status';

    v_status_expr := CASE
        WHEN v_status_udt = 'subscription_status_enum'
            THEN '$2::public.subscription_status_enum'
        ELSE '$2'
    END;

    EXECUTE format(
        'UPDATE public.businesses
            SET is_premium = COALESCE($1, is_premium),
                subscription_status = CASE WHEN $2 IS NULL THEN subscription_status ELSE %s END,
                trial_ends_at = CASE
                    WHEN $3 THEN NULL
                    WHEN $4 IS NOT NULL THEN $4
                    ELSE trial_ends_at
                END,
                free_until = CASE
                    WHEN $5 THEN NULL
                    WHEN $6 IS NOT NULL THEN $6
                    ELSE free_until
                END
          WHERE id = $7',
        v_status_expr
    )
    USING
        p_is_premium,
        p_subscription_status,
        p_clear_trial_ends_at,
        p_trial_ends_at,
        p_clear_free_until,
        p_free_until,
        p_business_id;

    GET DIAGNOSTICS v_rows = ROW_COUNT;

    IF v_rows = 0 THEN
        RAISE EXCEPTION 'business_not_found' USING ERRCODE = 'P0002';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_business_benefits(
    UUID, BOOLEAN, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN, BOOLEAN
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_update_business_benefits(
    UUID, BOOLEAN, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN, BOOLEAN
) TO authenticated;
