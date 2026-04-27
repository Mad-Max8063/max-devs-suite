-- Locks sensitive business columns now that public card/booking reads use an
-- explicit safe column list. Capability tokens must never be returned to anon.

CREATE TABLE IF NOT EXISTS public.super_admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION public.is_super_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.super_admins
    WHERE user_id = uid
  );
$$;

ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS free_until TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Remove broad grants first. Public access is re-added only per safe columns.
REVOKE ALL ON public.businesses FROM anon;
REVOKE ALL ON public.businesses FROM PUBLIC;
REVOKE ALL ON public.businesses FROM authenticated;

-- Drop legacy policies that allowed full-row public reads. These names exist in
-- older one-off scripts and can otherwise keep edit_token visible to logged-in
-- users when combined with authenticated table grants.
DROP POLICY IF EXISTS "Public can view business profiles" ON public.businesses;
DROP POLICY IF EXISTS "Lectura pública de negocios" ON public.businesses;
DROP POLICY IF EXISTS "Lectura publica de negocios" ON public.businesses;
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

-- Public card/booking metadata. Deliberately excludes user_id, edit_token,
-- notes, transfer_email, mp_preapproval_id, and other owner/admin fields.
GRANT SELECT (
    id,
    slug,
    nombre_negocio,
    telefono,
    email,
    valor_sena,
    alias_mp,
    link_pago,
    qr_image_url,
    modo_sandbox,
    foto_url,
    color_primario,
    notificaciones_email,
    recordatorios_activos,
    fecha_vencimiento,
    is_premium,
    profession,
    description,
    location,
    facebook,
    instagram,
    linkedin,
    website,
    booking_url,
    whatsapp_message,
    cover_url,
    gallery_images,
    active_modules,
    subscription_status,
    trial_ends_at,
    locked_price,
    price_lock_ends_at,
    free_until,
    font_family,
    social_color,
    card_theme,
    custom_css,
    created_at,
    updated_at
) ON public.businesses TO anon;

-- Logged-in users need the same public profile surface, plus user_id so owner
-- RLS and owner lookups can still resolve without exposing capability tokens.
GRANT SELECT (
    id,
    user_id,
    slug,
    nombre_negocio,
    telefono,
    email,
    valor_sena,
    alias_mp,
    link_pago,
    qr_image_url,
    modo_sandbox,
    foto_url,
    color_primario,
    notificaciones_email,
    recordatorios_activos,
    fecha_vencimiento,
    is_premium,
    profession,
    description,
    location,
    facebook,
    instagram,
    linkedin,
    website,
    booking_url,
    whatsapp_message,
    cover_url,
    gallery_images,
    active_modules,
    subscription_status,
    trial_ends_at,
    locked_price,
    price_lock_ends_at,
    free_until,
    font_family,
    social_color,
    card_theme,
    custom_css,
    created_at,
    updated_at
) ON public.businesses TO authenticated;

-- Inserts remain available so anonymous card creation and authenticated tenant
-- onboarding keep working. Mutations for logged-in owners are still constrained
-- by RLS; anonymous updates must use SECURITY DEFINER RPCs with edit_token.
GRANT INSERT ON public.businesses TO anon, authenticated;
GRANT UPDATE, DELETE ON public.businesses TO authenticated;

CREATE POLICY "Public can view business profiles"
ON public.businesses
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Owners can view their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Solo dueños editan su negocio" ON public.businesses;
DROP POLICY IF EXISTS "Solo duenos editan su negocio" ON public.businesses;
DROP POLICY IF EXISTS "Dueños y Admins gestionan negocios" ON public.businesses;
DROP POLICY IF EXISTS "Duenos y Admins gestionan negocios" ON public.businesses;
DROP POLICY IF EXISTS "businesses_update_owner_or_super_admin" ON public.businesses;
DROP POLICY IF EXISTS "businesses_delete_owner_or_super_admin" ON public.businesses;
DROP POLICY IF EXISTS "Solo usuarios autenticados crean negocios" ON public.businesses;
DROP POLICY IF EXISTS "Public can create card business profiles" ON public.businesses;
DROP POLICY IF EXISTS "Authenticated users can create own business profiles" ON public.businesses;
DROP POLICY IF EXISTS "Owners and super admins can manage business profiles" ON public.businesses;
DROP POLICY IF EXISTS "Owners and super admins can delete business profiles" ON public.businesses;

CREATE POLICY "Public can create card business profiles"
ON public.businesses
FOR INSERT
TO anon, authenticated
WITH CHECK (
  user_id IS NULL
  AND (
    active_modules IS NULL
    OR 'card' = ANY(active_modules)
  )
);

CREATE POLICY "Authenticated users can create own business profiles"
ON public.businesses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

CREATE POLICY "Owners and super admins can manage business profiles"
ON public.businesses
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()))
WITH CHECK (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

CREATE POLICY "Owners and super admins can delete business profiles"
ON public.businesses
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

-- Public updates must go through update_business_profile_secure RPC which validates edit_token.
-- This ensures that even if a user finds the edit_token somehow, they can't use standard UPDATE.
DROP POLICY IF EXISTS "Public cannot update directly" ON public.businesses;
CREATE POLICY "Public cannot update directly"
ON public.businesses
FOR UPDATE
TO anon
USING (false);
