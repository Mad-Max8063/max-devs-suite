-- ============================================
-- Migration: Add p_disable_share + p_font_scale to update_business_profile_secure RPC
-- 2026-04-30
-- ============================================

-- Drop all overloads
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT p.oid::regprocedure::text AS full_sig
          FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public'
           AND p.proname = 'update_business_profile_secure'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.full_sig || ' CASCADE';
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_business_profile_secure(
    p_card_id        UUID,
    p_edit_token     TEXT,
    p_nombre_negocio TEXT DEFAULT NULL,
    p_profession     TEXT DEFAULT NULL,
    p_description    TEXT DEFAULT NULL,
    p_telefono       TEXT DEFAULT NULL,
    p_email          TEXT DEFAULT NULL,
    p_location       TEXT DEFAULT NULL,
    p_foto_url       TEXT DEFAULT NULL,
    p_cover_url      TEXT DEFAULT NULL,
    p_instagram      TEXT DEFAULT NULL,
    p_facebook       TEXT DEFAULT NULL,
    p_linkedin       TEXT DEFAULT NULL,
    p_website        TEXT DEFAULT NULL,
    p_booking_url    TEXT DEFAULT NULL,
    p_whatsapp_message TEXT DEFAULT NULL,
    p_font_family    TEXT DEFAULT NULL,
    p_social_color   TEXT DEFAULT NULL,
    p_card_theme     TEXT DEFAULT NULL,
    p_custom_css     TEXT DEFAULT NULL,
    p_disable_share  BOOLEAN DEFAULT NULL,
    p_font_scale     NUMERIC DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_business_id UUID;
BEGIN
    SELECT id INTO v_business_id
      FROM public.businesses
     WHERE id = p_card_id
       AND edit_token = p_edit_token;

    IF v_business_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_TOKEN: Token de edición no válido para este negocio.';
    END IF;

    UPDATE public.businesses
       SET nombre_negocio = COALESCE(p_nombre_negocio, nombre_negocio),
           profession     = COALESCE(p_profession,     profession),
           description    = COALESCE(p_description,    description),
           telefono       = COALESCE(p_telefono,       telefono),
           email          = COALESCE(p_email,          email),
           location       = COALESCE(p_location,       location),
           foto_url       = COALESCE(p_foto_url,       foto_url),
           cover_url      = COALESCE(p_cover_url,      cover_url),
           instagram      = COALESCE(p_instagram,      instagram),
           facebook       = COALESCE(p_facebook,       facebook),
           linkedin       = COALESCE(p_linkedin,       linkedin),
           website        = COALESCE(p_website,        website),
           booking_url    = COALESCE(p_booking_url,    booking_url),
           whatsapp_message = COALESCE(p_whatsapp_message, whatsapp_message),
           font_family    = COALESCE(p_font_family,    font_family),
           social_color   = COALESCE(p_social_color,   social_color),
           card_theme     = COALESCE(p_card_theme,     card_theme),
           custom_css     = COALESCE(p_custom_css,     custom_css),
           disable_share  = COALESCE(p_disable_share,  disable_share),
           font_scale     = COALESCE(p_font_scale,     font_scale),
           updated_at     = now()
     WHERE id = v_business_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_business_profile_secure(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, NUMERIC
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_business_profile_secure(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, NUMERIC
) TO anon, authenticated;
