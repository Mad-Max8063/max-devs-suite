-- ==============================================================================
-- PATCH: update_business_profile_secure — Agregar foto_url y cover_url
-- ==============================================================================
-- IDEMPOTENTE: Usa CREATE OR REPLACE, seguro para ejecución repetida.
-- EJECUTAR EN: Supabase SQL Editor → Copy/Paste → Run
-- ==============================================================================

-- PASO 1: Eliminar TODAS las sobrecargas de la función (dinámico — sin importar cuántas existan)
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

-- PASO 2: Crear la función limpia con los parámetros de imagen
CREATE OR REPLACE FUNCTION public.update_business_profile_secure(
    p_card_id      UUID,
    p_edit_token   TEXT,
    p_nombre_negocio TEXT DEFAULT NULL,
    p_profession     TEXT DEFAULT NULL,
    p_description    TEXT DEFAULT NULL,
    p_telefono       TEXT DEFAULT NULL,
    p_email          TEXT DEFAULT NULL,
    p_location       TEXT DEFAULT NULL,
    p_foto_url       TEXT DEFAULT NULL,    -- ✅ NUEVO: URL de foto de perfil
    p_cover_url      TEXT DEFAULT NULL,    -- ✅ NUEVO: URL de portada
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
    WHERE id = p_card_id AND edit_token = p_edit_token;

    IF v_business_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_TOKEN: Token de edición no válido para este negocio.';
    END IF;

    -- Actualizar solo los campos que no son NULL (preservar valores existentes)
    UPDATE public.businesses
    SET
        nombre_negocio = COALESCE(p_nombre_negocio, nombre_negocio),
        profession     = COALESCE(p_profession, profession),
        description    = COALESCE(p_description, description),
        telefono       = COALESCE(p_telefono, telefono),
        email          = COALESCE(p_email, email),
        location       = COALESCE(p_location, location),
        foto_url       = COALESCE(p_foto_url, foto_url),       -- ✅ NUEVO
        cover_url      = COALESCE(p_cover_url, cover_url),     -- ✅ NUEVO
        instagram      = COALESCE(p_instagram, instagram),
        facebook       = COALESCE(p_facebook, facebook),
        linkedin       = COALESCE(p_linkedin, linkedin),
        website        = COALESCE(p_website, website),
        booking_url    = COALESCE(p_booking_url, booking_url),
        updated_at     = now()
    WHERE id = v_business_id;
END;
$$;

-- PASO 3: Asegurar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.update_business_profile_secure TO anon, authenticated;

-- ==============================================================================
-- VERIFICACIÓN: Confirmar que la función tiene los nuevos parámetros
-- ==============================================================================
SELECT proname, proargnames
FROM pg_proc
WHERE proname = 'update_business_profile_secure';

-- Resultado esperado en proargnames:
-- {p_card_id,p_edit_token,p_nombre_negocio,p_profession,p_description,
--  p_telefono,p_email,p_location,p_foto_url,p_cover_url,
--  p_instagram,p_facebook,p_linkedin,p_website,p_booking_url}

-- ==============================================================================
-- NOTA SOBRE TRIGGER trg_enforce_premium_features:
-- ==============================================================================
-- Si existe un trigger que valida is_premium antes de permitir cambios en
-- foto_url/cover_url, los usuarios Free recibirán el error PREMIUM_REQUIRED.
-- El frontend ya captura ese error y muestra un mensaje amigable en la UI.
-- NO modificar el trigger — es la lógica de negocio correcta.
-- ==============================================================================
