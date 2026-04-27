-- Migración para añadir mensaje predefinido de WhatsApp
-- 1. Agregar columna a la tabla businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS whatsapp_message TEXT;

-- 2. Actualizar el RPC update_business_profile_secure para incluir el nuevo campo
DROP FUNCTION IF EXISTS public.update_business_profile_secure(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

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
    p_whatsapp_message TEXT DEFAULT NULL
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
           foto_url       = COALESCE(p_foto_url,       foto_url),
           cover_url      = COALESCE(p_cover_url,      cover_url),
           instagram      = COALESCE(p_instagram,      instagram),
           facebook       = COALESCE(p_facebook,       facebook),
           linkedin       = COALESCE(p_linkedin,       linkedin),
           website        = COALESCE(p_website,        website),
           booking_url    = COALESCE(p_booking_url,    booking_url),
           whatsapp_message = COALESCE(p_whatsapp_message, whatsapp_message),
           updated_at     = NOW()
     WHERE id = p_card_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_business_profile_secure(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO anon, authenticated;
