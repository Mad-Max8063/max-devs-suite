-- ==============================================================================
-- SUITO — RPCs CONSOLIDADAS (IDEMPOTENTE)
-- Ejecutar en: Supabase SQL Editor → Copy/Paste → Run
-- Incluye las 6 RPCs en sus versiones definitivas y sus permisos.
-- Seguro para ejecución repetida (CREATE OR REPLACE + DROP IF EXISTS).
-- ==============================================================================

-- ==============================================================================
-- 0. COLUMNAS REQUERIDAS (idempotente)
-- ==============================================================================
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS edit_token      TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS profession      TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS description     TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS location        TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS instagram       TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS facebook        TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS linkedin        TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS website         TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS foto_url        TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS cover_url       TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS color_primario  TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS gallery_images  JSONB DEFAULT '[]';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS booking_url     TEXT;

CREATE INDEX IF NOT EXISTS idx_businesses_edit_token ON public.businesses(edit_token);

-- ==============================================================================
-- RPC 1: claim_business(TEXT, TEXT)
-- Usado por: RegisterPage.tsx (onboarding turnos)
-- El usuario recién registrado reclama un negocio pre-creado por admin.
-- ==============================================================================
DROP FUNCTION IF EXISTS public.claim_business(TEXT);
DROP FUNCTION IF EXISTS public.claim_business(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.claim_business(
    business_slug TEXT,
    p_edit_token  TEXT
)
RETURNS public.businesses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid   UUID := auth.uid();
    v_token TEXT;
    v_row   public.businesses;
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
GRANT  EXECUTE ON FUNCTION public.claim_business(TEXT, TEXT) TO authenticated;

-- ==============================================================================
-- RPC 2: update_business_profile_secure — versión DEFINITIVA con foto_url y cover_url
-- Usado por: supabase-v2029.js:367
-- IMPORTANTE: Esta versión (PATCH_RPC_IMAGE_URLS.sql) reemplaza la de
--             supabase_update_businesses_v1.sql que NO tenía foto_url/cover_url.
-- ==============================================================================

-- Paso 2a: Eliminar TODAS las sobrecargas existentes (dinámico)
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

-- Paso 2b: Crear función limpia con todos los parámetros de imagen
CREATE OR REPLACE FUNCTION public.update_business_profile_secure(
    p_card_id        UUID,
    p_edit_token     TEXT,
    p_nombre_negocio TEXT DEFAULT NULL,
    p_profession     TEXT DEFAULT NULL,
    p_description    TEXT DEFAULT NULL,
    p_telefono       TEXT DEFAULT NULL,
    p_email          TEXT DEFAULT NULL,
    p_location       TEXT DEFAULT NULL,
    p_foto_url       TEXT DEFAULT NULL,   -- URL de foto de perfil
    p_cover_url      TEXT DEFAULT NULL,   -- URL de portada
    p_instagram      TEXT DEFAULT NULL,
    p_facebook       TEXT DEFAULT NULL,
    p_linkedin       TEXT DEFAULT NULL,
    p_website        TEXT DEFAULT NULL,
    p_booking_url    TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_business_id UUID;
BEGIN
    -- Validar token de edición
    SELECT id INTO v_business_id
      FROM public.businesses
     WHERE id = p_card_id
       AND edit_token = p_edit_token;

    IF v_business_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_TOKEN: Token de edición no válido para este negocio.';
    END IF;

    -- Actualizar solo campos no-NULL (preservar valores existentes)
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
           updated_at     = now()
     WHERE id = v_business_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_business_profile_secure(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_business_profile_secure(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO anon, authenticated;

-- ==============================================================================
-- RPC 3: add_gallery_image_secure(UUID, TEXT, TEXT, TEXT, INT)
-- Usado por: supabase-v2029.js:333
-- Requiere tabla public.gallery_images — se crea si no existe.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.gallery_images (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id    UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    image_url  TEXT NOT NULL,
    caption    TEXT DEFAULT '',
    sort_order INT  DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

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
GRANT  EXECUTE ON FUNCTION public.add_gallery_image_secure(UUID, TEXT, TEXT, TEXT, INT) TO anon, authenticated;

-- ==============================================================================
-- RPC 4: delete_gallery_image_secure(UUID, UUID, TEXT)
-- Usado por: supabase-v2029.js:346
-- ==============================================================================
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
GRANT  EXECUTE ON FUNCTION public.delete_gallery_image_secure(UUID, UUID, TEXT) TO anon, authenticated;

-- ==============================================================================
-- RPC 5: update_gallery_caption_secure(UUID, UUID, TEXT, TEXT)
-- Usado por: supabase-v2029.js:356
-- ==============================================================================
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
GRANT  EXECUTE ON FUNCTION public.update_gallery_caption_secure(UUID, UUID, TEXT, TEXT) TO anon, authenticated;

-- ==============================================================================
-- RPC 6: update_active_modules_secure(UUID, TEXT, TEXT[])
-- Usado por: supabase-v2029.js:402
-- ==============================================================================
DROP FUNCTION IF EXISTS public.update_active_modules_secure(UUID, TEXT, TEXT[]);

CREATE OR REPLACE FUNCTION public.update_active_modules_secure(
    p_card_id        UUID,
    p_edit_token     TEXT,
    p_active_modules TEXT[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.businesses
       SET active_modules = p_active_modules
     WHERE id = p_card_id
       AND edit_token = p_edit_token;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'invalid_edit_token_or_business_not_found' USING ERRCODE = '28000';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.update_active_modules_secure(UUID, TEXT, TEXT[]) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.update_active_modules_secure(UUID, TEXT, TEXT[]) TO anon, authenticated;

-- ==============================================================================
-- VERIFICACIÓN FINAL — Ejecutar después del script para confirmar las 6 RPCs
-- ==============================================================================
SELECT proname, proargnames
FROM pg_proc
WHERE proname IN (
    'claim_business',
    'update_business_profile_secure',
    'add_gallery_image_secure',
    'delete_gallery_image_secure',
    'update_gallery_caption_secure',
    'update_active_modules_secure'
)
ORDER BY proname;
-- Esperado: 6 filas, una por cada función.
