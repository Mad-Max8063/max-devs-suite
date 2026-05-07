-- ============================================
-- Migration: Prueba Premium 3 dias para Tarjeta Virtual
-- 2026-05-06
-- ============================================

-- 1. Columna para rastrear si la prueba ya fue utilizada
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS card_trial_used BOOLEAN DEFAULT FALSE;

-- 2. Actualizar trigger fn_enforce_premium_features para respetar free_until
--    Ahora permite uploads de foto/portada si free_until > NOW()
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

    IF (NEW.foto_url IS DISTINCT FROM OLD.foto_url OR NEW.cover_url IS DISTINCT FROM OLD.cover_url) THEN
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

-- 3. RPC para activar la prueba Premium de 3 dias
CREATE OR REPLACE FUNCTION public.activate_card_premium_trial(p_business_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_business RECORD;
BEGIN
    SELECT id, user_id, card_trial_used, free_until
    INTO v_business
    FROM public.businesses
    WHERE id = p_business_id
    FOR UPDATE;

    IF v_business IS NULL THEN
        RAISE EXCEPTION 'business_not_found' USING ERRCODE = 'P0002';
    END IF;

    IF v_business.user_id != auth.uid() THEN
        RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
    END IF;

    IF v_business.card_trial_used = true THEN
        RAISE EXCEPTION 'trial_already_used' USING ERRCODE = '23505';
    END IF;

    UPDATE public.businesses
    SET card_trial_used = true,
        free_until = GREATEST(NOW() + INTERVAL '3 days', COALESCE(free_until, NOW()))
    WHERE id = p_business_id;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_card_premium_trial(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_card_premium_trial(UUID) TO authenticated;
