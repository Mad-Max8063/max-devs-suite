-- ==============================================================================
-- SUITO — HOTFIX VISIBILIDAD CLIENTES ADMIN
-- Ejecutar en Supabase SQL Editor si el panel admin quedo sin clientes
-- despues de endurecer grants/RLS.
--
-- Objetivo:
-- - anon mantiene solo lectura publica por columnas seguras.
-- - authenticated recupera SELECT * para el admin, pero RLS limita filas a:
--   negocio propio o super_admin.
-- - edit_token no queda expuesto al rol anon.
-- ==============================================================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.businesses FROM anon;
REVOKE ALL ON public.businesses FROM PUBLIC;
REVOKE ALL ON public.businesses FROM authenticated;

GRANT SELECT (
    id, slug, nombre_negocio, telefono, email, valor_sena, alias_mp,
    link_pago, qr_image_url, modo_sandbox, foto_url, color_primario,
    notificaciones_email, recordatorios_activos, fecha_vencimiento,
    is_premium, profession, description, location, facebook, instagram,
    linkedin, website, booking_url, whatsapp_message, cover_url,
    gallery_images, active_modules, subscription_status, trial_ends_at,
    locked_price, price_lock_ends_at, free_until, font_family,
    social_color, card_theme, custom_css, created_at, updated_at
) ON public.businesses TO anon;

GRANT SELECT ON public.businesses TO authenticated;
GRANT INSERT ON public.businesses TO anon, authenticated;
GRANT UPDATE, DELETE ON public.businesses TO authenticated;

DROP POLICY IF EXISTS "Public can view business profiles" ON public.businesses;
DROP POLICY IF EXISTS "Lectura publica de negocios" ON public.businesses;
DROP POLICY IF EXISTS "Lectura pública de negocios" ON public.businesses;
DROP POLICY IF EXISTS "Permitir lectura publica a negocios (tarjeta virtual)" ON public.businesses;
DROP POLICY IF EXISTS "Permitir lectura pública a negocios (tarjeta virtual)" ON public.businesses;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'businesses'
          AND cmd = 'SELECT'
          AND replace(COALESCE(qual, ''), ' ', '') IN ('true', '(true)')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.businesses', r.policyname);
    END LOOP;
END;
$$;

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

-- Auditoria rapida:
-- 1) El admin logueado como super_admin deberia ver filas aca.
SELECT id, slug, nombre_negocio, plan, status
FROM public.businesses
ORDER BY created_at DESC
LIMIT 20;

-- 2) anon no debe tener permisos peligrosos.
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'businesses'
  AND grantee IN ('anon', 'PUBLIC')
  AND privilege_type IN ('UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER');
