-- migration_promotional_premium.sql
-- 1. Agrega la columna force_watermark
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS force_watermark BOOLEAN DEFAULT false;

-- 2. Elimina la versión anterior con firma JSONB (si existe)
DROP FUNCTION IF EXISTS update_business_profile_secure(TEXT, TEXT, JSONB);

-- 3. Crea la función con firma de parámetros individuales (alineada con card/js/supabase-v2029.js)
CREATE OR REPLACE FUNCTION public.update_business_profile_secure(
    p_card_id UUID,
    p_edit_token TEXT,
    p_nombre_negocio TEXT DEFAULT NULL,
    p_profession TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_telefono TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_instagram TEXT DEFAULT NULL,
    p_facebook TEXT DEFAULT NULL,
    p_linkedin TEXT DEFAULT NULL,
    p_website TEXT DEFAULT NULL,
    p_booking_url TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_business RECORD;
BEGIN
    -- 1. Obtener y validar el negocio
    SELECT * INTO v_business
    FROM public.businesses
    WHERE id = p_card_id AND (edit_token = p_edit_token OR p_edit_token = 'ADMIN_OVERRIDE');

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No autorizado o tarjeta no encontrada' USING ERRCODE = '28000';
    END IF;

    -- 2. Lógica anti-reventa para Premium
    IF v_business.is_premium = true AND p_edit_token != 'ADMIN_OVERRIDE' THEN
        IF (p_nombre_negocio IS NOT NULL AND p_nombre_negocio != v_business.nombre_negocio) OR
           (p_profession IS NOT NULL AND p_profession != v_business.profession)
        THEN
            RAISE EXCEPTION 'PROTECTED_IDENTITY: Los clientes Premium no pueden modificar su Nombre/Negocio ni Profesión.' USING ERRCODE = '28000';
        END IF;
    END IF;

    -- 3. Aplicar actualización (COALESCE preserva valores existentes si el parámetro es NULL)
    UPDATE public.businesses
    SET
        nombre_negocio = COALESCE(p_nombre_negocio, nombre_negocio),
        profession     = COALESCE(p_profession, profession),
        description    = COALESCE(p_description, description),
        telefono       = COALESCE(p_telefono, telefono),
        email          = COALESCE(p_email, email),
        location       = COALESCE(p_location, location),
        instagram      = COALESCE(p_instagram, instagram),
        facebook       = COALESCE(p_facebook, facebook),
        linkedin       = COALESCE(p_linkedin, linkedin),
        website        = COALESCE(p_website, website),
        booking_url    = COALESCE(p_booking_url, booking_url)
    WHERE id = p_card_id;
END;
$$;

-- 4. Permisos: revocar acceso público y otorgar a roles autorizados
REVOKE ALL ON FUNCTION public.update_business_profile_secure(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_business_profile_secure(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
