-- =============================================================================
-- FIX: super_admins esta vacio — insertar al admin correcto
-- =============================================================================
-- Ejecutar en Supabase SQL Editor.
--
-- Paso 1: Diagnostico — ver que emails hay en auth.users
-- Paso 2: Insertar al admin en super_admins
-- =============================================================================

-- 1) Ver todos los usuarios registrados en auth.users
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at;

-- 2) Ver estado actual de super_admins (deberia estar vacio)
SELECT * FROM public.super_admins;

-- 3) Insertar al admin usando su email real.
--    CAMBIA 'hola@suito.pro' por el email con el que te logeas en admin.suito.pro
--    si es diferente.
DO $$
DECLARE
    v_uid UUID;
BEGIN
    SELECT id INTO v_uid FROM auth.users WHERE email = 'hola@suito.pro' LIMIT 1;

    IF v_uid IS NULL THEN
        RAISE NOTICE '⚠ Email no encontrado en auth.users. Revisa el resultado del SELECT de arriba y usa el email correcto.';
        RETURN;
    END IF;

    INSERT INTO public.super_admins (user_id)
    VALUES (v_uid)
    ON CONFLICT (user_id) DO NOTHING;

    RAISE NOTICE '✅ Admin insertado: %', v_uid;
END;
$$;

-- 4) Verificacion final
SELECT
    sa.user_id,
    u.email,
    public.is_super_admin(sa.user_id) AS es_super_admin
FROM public.super_admins sa
JOIN auth.users u ON u.id = sa.user_id;
