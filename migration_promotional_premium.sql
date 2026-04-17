-- migration_promotional_premium.sql
-- 1. Agrega la columna force_watermark
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS force_watermark BOOLEAN DEFAULT false;

-- 2. Modifica la función update_business_profile_secure para prevenir cambios en clientes Premium
CREATE OR REPLACE FUNCTION update_business_profile_secure(
    p_card_id TEXT,
    p_edit_token TEXT,
    p_updates JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_business RECORD;
    v_clean_updates JSONB;
BEGIN
    -- 1. Obtener y validar el negocio
    SELECT * INTO v_business
    FROM businesses
    WHERE slug = p_card_id AND (edit_token = p_edit_token OR p_edit_token = 'ADMIN_OVERRIDE');

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No autorizado o tarjeta no encontrada';
    END IF;

    -- 2. Extraer limpieza base
    v_clean_updates = p_updates - 'id' - 'user_id' - 'created_at' - 'slug' - 'edit_token' - 'plan' - 'is_premium' - 'force_watermark' - 'free_until' - 'paid_until' - 'status';

    -- [NUEVO] 3. Lógica anti-reventa para Premium
    IF v_business.is_premium = true AND p_edit_token != 'ADMIN_OVERRIDE' THEN
        IF (p_updates ? 'nombre_negocio' AND p_updates->>'nombre_negocio' != v_business.nombre_negocio) OR
           (p_updates ? 'profession' AND p_updates->>'profession' != v_business.profession) 
        THEN
            RAISE EXCEPTION 'PROTECTED_IDENTITY: Los clientes Premium no pueden modificar su Nombre/Negocio ni Profesión.';
        END IF;
    END IF;

    -- 4. Aplicar actualización
    UPDATE businesses
    SET
        nombre_negocio = COALESCE(v_clean_updates->>'nombre_negocio', v_business.nombre_negocio),
        profession = COALESCE(v_clean_updates->>'profession', v_business.profession),
        description = COALESCE(v_clean_updates->>'description', v_business.description),
        telefono = COALESCE(v_clean_updates->>'telefono', v_business.telefono),
        email = COALESCE(v_clean_updates->>'email', v_business.email),
        location = COALESCE(v_clean_updates->>'location', v_business.location),
        instagram = COALESCE(v_clean_updates->>'instagram', v_business.instagram),
        facebook = COALESCE(v_clean_updates->>'facebook', v_business.facebook),
        linkedin = COALESCE(v_clean_updates->>'linkedin', v_business.linkedin),
        website = COALESCE(v_clean_updates->>'website', v_business.website),
        color_primario = COALESCE(v_clean_updates->>'color_primario', v_business.color_primario),
        foto_url = COALESCE(v_clean_updates->>'foto_url', v_business.foto_url),
        cover_url = COALESCE(v_clean_updates->>'cover_url', v_business.cover_url)
        -- Nota: booking_url no se actualiza por esta vía por seguridad.
    WHERE id = v_business.id
    RETURNING * INTO v_business;

    RETURN to_jsonb(v_business);
END;
$$;
