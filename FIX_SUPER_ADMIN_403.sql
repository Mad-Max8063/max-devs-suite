-- =============================================================================
-- FIX: 403 en Panel Admin al otorgar Premium/Vitalicio
-- =============================================================================
-- Ejecutar en Supabase SQL Editor.
--
-- Causa habitual:
-- - El panel hace UPDATE sobre public.businesses como usuario autenticado.
-- - RLS + el trigger premium solo permiten cambiar is_premium/subscription_status
--   si auth.uid() existe en public.super_admins.
-- - Si el usuario no es super_admin, Supabase responde 403.
--
-- Ajustar ADMIN_EMAIL si tu cuenta admin usa otro email.
-- =============================================================================

DO $$
DECLARE
    admin_email TEXT := 'hola@suito.pro';
    fallback_admin_id UUID := '1aca93a8-6f2e-4801-bb0a-d8167e7e190c';
    resolved_admin_id UUID;
BEGIN
    CREATE TABLE IF NOT EXISTS public.super_admins (
        user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
    );

    CREATE OR REPLACE FUNCTION public.is_super_admin(uid UUID)
    RETURNS BOOLEAN
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $fn$
      SELECT EXISTS (
        SELECT 1
        FROM public.super_admins
        WHERE user_id = uid
      );
    $fn$;

    SELECT id
      INTO resolved_admin_id
      FROM auth.users
     WHERE email = admin_email
     LIMIT 1;

    resolved_admin_id := COALESCE(resolved_admin_id, fallback_admin_id);

    INSERT INTO public.super_admins (user_id)
    VALUES (resolved_admin_id)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO anon;

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Si subscription_status usa un enum, PostgREST necesita USAGE sobre el tipo
-- para castear valores como 'active' desde el cliente.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
          AND t.typname = 'subscription_status_enum'
    ) THEN
        GRANT USAGE ON TYPE public.subscription_status_enum TO authenticated;
    END IF;
END;
$$;

-- El admin usa select('*') para el CRM. RLS limita las filas a owner/super_admin.
GRANT SELECT ON public.businesses TO authenticated;
GRANT UPDATE, DELETE ON public.businesses TO authenticated;

-- Evita que una policy publica vieja tambien aplique a authenticated.
DROP POLICY IF EXISTS "Public can view business profiles" ON public.businesses;
DROP POLICY IF EXISTS "Lectura publica de negocios" ON public.businesses;
DROP POLICY IF EXISTS "Lectura pública de negocios" ON public.businesses;
DROP POLICY IF EXISTS "Permitir lectura publica a negocios (tarjeta virtual)" ON public.businesses;
DROP POLICY IF EXISTS "Permitir lectura pública a negocios (tarjeta virtual)" ON public.businesses;

CREATE POLICY "Public can view business profiles"
ON public.businesses
FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "Authenticated owners and super admins can view business profiles" ON public.businesses;
CREATE POLICY "Authenticated owners and super admins can view business profiles"
ON public.businesses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Owners and super admins can manage business profiles" ON public.businesses;
CREATE POLICY "Owners and super admins can manage business profiles"
ON public.businesses
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()))
WITH CHECK (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Owners and super admins can delete business profiles" ON public.businesses;
CREATE POLICY "Owners and super admins can delete business profiles"
ON public.businesses
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

-- RPC admin para beneficios. Evita depender de UPDATE directo desde PostgREST
-- para cambios de monetizacion.
CREATE OR REPLACE FUNCTION public.admin_update_business_benefits(
    p_business_id UUID,
    p_is_premium BOOLEAN DEFAULT NULL,
    p_subscription_status TEXT DEFAULT NULL,
    p_trial_ends_at TIMESTAMPTZ DEFAULT NULL,
    p_free_until TIMESTAMPTZ DEFAULT NULL,
    p_clear_trial_ends_at BOOLEAN DEFAULT FALSE,
    p_clear_free_until BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_status_udt TEXT;
    v_status_expr TEXT;
    v_rows INTEGER;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_super_admin(auth.uid()) THEN
        RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
    END IF;

    IF p_subscription_status IS NOT NULL
       AND p_subscription_status NOT IN ('basic', 'trial', 'active', 'expired') THEN
        RAISE EXCEPTION 'invalid_subscription_status' USING ERRCODE = '22023';
    END IF;

    SELECT udt_name
      INTO v_status_udt
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'businesses'
       AND column_name = 'subscription_status';

    v_status_expr := CASE
        WHEN v_status_udt = 'subscription_status_enum'
            THEN '$2::public.subscription_status_enum'
        ELSE '$2'
    END;

    EXECUTE format(
        'UPDATE public.businesses
            SET is_premium = COALESCE($1, is_premium),
                subscription_status = CASE WHEN $2 IS NULL THEN subscription_status ELSE %s END,
                trial_ends_at = CASE
                    WHEN $3 THEN NULL
                    WHEN $4 IS NOT NULL THEN $4
                    ELSE trial_ends_at
                END,
                free_until = CASE
                    WHEN $5 THEN NULL
                    WHEN $6 IS NOT NULL THEN $6
                    ELSE free_until
                END
          WHERE id = $7',
        v_status_expr
    )
    USING
        p_is_premium,
        p_subscription_status,
        p_clear_trial_ends_at,
        p_trial_ends_at,
        p_clear_free_until,
        p_free_until,
        p_business_id;

    GET DIAGNOSTICS v_rows = ROW_COUNT;

    IF v_rows = 0 THEN
        RAISE EXCEPTION 'business_not_found' USING ERRCODE = 'P0002';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_business_benefits(
    UUID, BOOLEAN, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN, BOOLEAN
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_update_business_benefits(
    UUID, BOOLEAN, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN, BOOLEAN
) TO authenticated;

-- Verificacion: debe devolver true para el admin.
SELECT
    u.id AS user_id,
    u.email,
    public.is_super_admin(u.id) AS es_super_admin
FROM auth.users u
WHERE u.email = 'hola@suito.pro'
   OR u.id = '1aca93a8-6f2e-4801-bb0a-d8167e7e190c'::uuid;
