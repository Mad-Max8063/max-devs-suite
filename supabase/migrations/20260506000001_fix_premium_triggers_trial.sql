-- ============================================
-- Migration: Fix premium triggers for free/trial flow
-- 2026-05-06
-- ============================================
-- Problems fixed:
-- 1. Trigger blocked initial photo/cover setup (NULL → value) for free users
-- 2. Gallery trigger blocked ALL operations for free users (should allow up to 3)
-- 3. Gallery trigger didn't respect free_until for trial users
-- 4. card_trial_used not exposed via SELECT grants
-- 5. No RPC for anonymous trial activation (edit_token auth)
-- ============================================

-- 1. Fix fn_enforce_premium_features: allow initial photo/cover setup
CREATE OR REPLACE FUNCTION public.fn_enforce_premium_features()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (NEW.is_premium IS DISTINCT FROM OLD.is_premium OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status) THEN
        IF auth.uid() IS NOT NULL THEN
            IF NOT public.is_super_admin(auth.uid()) THEN
                RAISE EXCEPTION 'UNAUTHORIZED: Solo los administradores pueden modificar el estado de la suscripcion.' USING ERRCODE = '42501';
            END IF;
        END IF;
    END IF;

    -- Block photo/cover CHANGES (not initial setup from NULL/empty)
    IF (
        (NEW.foto_url IS DISTINCT FROM OLD.foto_url AND OLD.foto_url IS NOT NULL AND OLD.foto_url != '')
        OR
        (NEW.cover_url IS DISTINCT FROM OLD.cover_url AND OLD.cover_url IS NOT NULL AND OLD.cover_url != '')
    ) THEN
        IF (OLD.is_premium = false
            AND (OLD.subscription_status IS NULL OR OLD.subscription_status != 'active')
            AND (OLD.free_until IS NULL OR OLD.free_until <= NOW())
        ) THEN
            RAISE EXCEPTION 'PREMIUM_REQUIRED: Se requiere plan Premium para modificar foto o portada de la tarjeta.' USING ERRCODE = '28000';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- 2. Fix fn_enforce_premium_gallery: respect free_until + allow free limit (3)
CREATE OR REPLACE FUNCTION public.fn_enforce_premium_gallery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_business RECORD;
    v_count INTEGER;
BEGIN
    SELECT is_premium, subscription_status, free_until
    INTO v_business
    FROM public.businesses
    WHERE id = NEW.card_id;

    IF v_business IS NULL THEN
        RETURN NEW;
    END IF;

    -- Premium/active/trial users: unlimited (up to UI limit)
    IF (v_business.is_premium = true
        OR v_business.subscription_status = 'active'
        OR (v_business.free_until IS NOT NULL AND v_business.free_until > NOW())
    ) THEN
        RETURN NEW;
    END IF;

    -- Free users: allow up to 3 gallery images
    IF TG_OP = 'INSERT' THEN
        SELECT COUNT(*) INTO v_count
        FROM public.gallery_images
        WHERE card_id = NEW.card_id;

        IF v_count >= 3 THEN
            RAISE EXCEPTION 'GALLERY_LIMIT: Limite de galeria alcanzado (3). Proba Premium para subir hasta 12.' USING ERRCODE = '28000';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- 3. Grant SELECT on card_trial_used for both roles
GRANT SELECT (card_trial_used) ON public.businesses TO anon;
GRANT SELECT (card_trial_used) ON public.businesses TO authenticated;

-- 4. RPC for anonymous trial activation via edit_token
CREATE OR REPLACE FUNCTION public.activate_card_premium_trial_by_token(p_card_id UUID, p_edit_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_business RECORD;
BEGIN
    SELECT id, card_trial_used, free_until
    INTO v_business
    FROM public.businesses
    WHERE id = p_card_id AND edit_token = p_edit_token
    FOR UPDATE;

    IF v_business IS NULL THEN
        RAISE EXCEPTION 'invalid_token' USING ERRCODE = 'P0002';
    END IF;

    IF v_business.card_trial_used = true THEN
        RAISE EXCEPTION 'trial_already_used' USING ERRCODE = '23505';
    END IF;

    UPDATE public.businesses
    SET card_trial_used = true,
        free_until = GREATEST(NOW() + INTERVAL '3 days', COALESCE(free_until, NOW()))
    WHERE id = p_card_id;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_card_premium_trial_by_token(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_card_premium_trial_by_token(UUID, TEXT) TO anon, authenticated;
