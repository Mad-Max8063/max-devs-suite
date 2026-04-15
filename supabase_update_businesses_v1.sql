-- Migración para añadir columnas necesarias a la tabla businesses (v2)
-- Requerido para el sistema de autogestión y perfiles automáticos

-- 1. Aseguramos que existan las columnas de imágenes y meta-datos
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS edit_token TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS cover_url TEXT; -- ← ESTA FALTABA
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS color_primario TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]';

-- 2. Creamos índices para optimizar la búsqueda
CREATE INDEX IF NOT EXISTS idx_businesses_edit_token ON public.businesses(edit_token);

-- =====================================================================
-- 3. RPCs SECURITY DEFINER para autogestión sin login (edit_token)
--    y onboarding post-signup (claim_business).
-- =====================================================================

-- 3.1 claim_business: el cliente recién registrado reclama un negocio
--     creado por admin (user_id IS NULL) cuyo slug matchea y cuyo
--     edit_token coincide con el token que trae el link de onboarding.
DROP FUNCTION IF EXISTS public.claim_business(TEXT);
DROP FUNCTION IF EXISTS public.claim_business(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.claim_business(business_slug TEXT, p_edit_token TEXT)
RETURNS public.businesses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid    UUID := auth.uid();
    v_token  TEXT;
    v_row    public.businesses;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'auth_required' USING ERRCODE = '28000';
    END IF;

    IF p_edit_token IS NULL OR length(p_edit_token) = 0 THEN
        RAISE EXCEPTION 'token_required' USING ERRCODE = '28000';
    END IF;

    SELECT edit_token INTO v_token
      FROM public.businesses
     WHERE slug = business_slug;

    IF v_token IS NULL OR v_token <> p_edit_token THEN
        RAISE EXCEPTION 'invalid_claim_token' USING ERRCODE = '28000';
    END IF;

    UPDATE public.businesses
       SET user_id = v_uid
     WHERE slug = business_slug
       AND user_id IS NULL
       AND edit_token = p_edit_token
    RETURNING * INTO v_row;

    IF v_row.id IS NULL THEN
        RAISE EXCEPTION 'business_not_claimable' USING ERRCODE = 'P0002';
    END IF;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_business(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_business(TEXT, TEXT) TO authenticated;

-- 3.2 update_business_profile_secure: edición del perfil de la tarjeta
--     validando estrictamente el edit_token.
DROP FUNCTION IF EXISTS public.update_business_profile_secure(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_business_profile_secure(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.update_business_profile_secure(
    p_card_id        UUID,
    p_edit_token     TEXT,
    p_nombre_negocio TEXT DEFAULT NULL,
    p_profession     TEXT DEFAULT NULL,
    p_description    TEXT DEFAULT NULL,
    p_telefono       TEXT DEFAULT NULL,
    p_email          TEXT DEFAULT NULL,
    p_location       TEXT DEFAULT NULL,
    p_instagram      TEXT DEFAULT NULL,
    p_facebook       TEXT DEFAULT NULL,
    p_linkedin       TEXT DEFAULT NULL,
    p_website        TEXT DEFAULT NULL,
    p_booking_url    TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_token TEXT;
BEGIN
    SELECT edit_token INTO v_token
      FROM public.businesses
     WHERE id = p_card_id;

    IF v_token IS NULL OR p_edit_token IS NULL OR v_token <> p_edit_token THEN
        RAISE EXCEPTION 'invalid_edit_token' USING ERRCODE = '28000';
    END IF;

    UPDATE public.businesses
       SET nombre_negocio = COALESCE(p_nombre_negocio, nombre_negocio),
           profession     = COALESCE(p_profession,     profession),
           description    = COALESCE(p_description,    description),
           telefono       = COALESCE(p_telefono,       telefono),
           email          = COALESCE(p_email,          email),
           location       = COALESCE(p_location,       location),
           instagram      = COALESCE(p_instagram,      instagram),
           facebook       = COALESCE(p_facebook,       facebook),
           linkedin       = COALESCE(p_linkedin,       linkedin),
           website        = COALESCE(p_website,        website),
           booking_url    = COALESCE(p_booking_url,    booking_url),
           updated_at     = NOW()
     WHERE id = p_card_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_business_profile_secure(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_business_profile_secure(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO anon, authenticated;

-- 3.3 add_gallery_image_secure: alta en tabla gallery_images bypassando RLS
--     tras verificar edit_token del negocio dueño.
DROP FUNCTION IF EXISTS public.add_gallery_image_secure(UUID, TEXT, TEXT, TEXT, INT);
CREATE OR REPLACE FUNCTION public.add_gallery_image_secure(
    p_card_id    UUID,
    p_edit_token TEXT,
    p_image_url  TEXT,
    p_caption    TEXT DEFAULT '',
    p_sort_order INT  DEFAULT 0
)
RETURNS public.gallery_images
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_token TEXT;
    v_row   public.gallery_images;
BEGIN
    SELECT edit_token INTO v_token
      FROM public.businesses
     WHERE id = p_card_id;

    IF v_token IS NULL OR p_edit_token IS NULL OR v_token <> p_edit_token THEN
        RAISE EXCEPTION 'invalid_edit_token' USING ERRCODE = '28000';
    END IF;

    IF p_image_url IS NULL OR length(p_image_url) = 0 THEN
        RAISE EXCEPTION 'image_url_required' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.gallery_images (card_id, image_url, caption, sort_order)
    VALUES (p_card_id, p_image_url, COALESCE(p_caption, ''), COALESCE(p_sort_order, 0))
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.add_gallery_image_secure(UUID, TEXT, TEXT, TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_gallery_image_secure(UUID, TEXT, TEXT, TEXT, INT) TO anon, authenticated;

-- 3.4 delete_gallery_image_secure
DROP FUNCTION IF EXISTS public.delete_gallery_image_secure(UUID, UUID, TEXT);
CREATE OR REPLACE FUNCTION public.delete_gallery_image_secure(
    p_image_id   UUID,
    p_card_id    UUID,
    p_edit_token TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_token TEXT;
BEGIN
    SELECT edit_token INTO v_token
      FROM public.businesses
     WHERE id = p_card_id;

    IF v_token IS NULL OR p_edit_token IS NULL OR v_token <> p_edit_token THEN
        RAISE EXCEPTION 'invalid_edit_token' USING ERRCODE = '28000';
    END IF;

    DELETE FROM public.gallery_images
     WHERE id = p_image_id
       AND card_id = p_card_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_gallery_image_secure(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_gallery_image_secure(UUID, UUID, TEXT) TO anon, authenticated;

-- 3.5 update_gallery_caption_secure
DROP FUNCTION IF EXISTS public.update_gallery_caption_secure(UUID, UUID, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.update_gallery_caption_secure(
    p_image_id   UUID,
    p_card_id    UUID,
    p_edit_token TEXT,
    p_caption    TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_token TEXT;
BEGIN
    SELECT edit_token INTO v_token
      FROM public.businesses
     WHERE id = p_card_id;

    IF v_token IS NULL OR p_edit_token IS NULL OR v_token <> p_edit_token THEN
        RAISE EXCEPTION 'invalid_edit_token' USING ERRCODE = '28000';
    END IF;

    UPDATE public.gallery_images
       SET caption = COALESCE(p_caption, '')
     WHERE id = p_image_id
       AND card_id = p_card_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_gallery_caption_secure(UUID, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_gallery_caption_secure(UUID, UUID, TEXT, TEXT) TO anon, authenticated;
