-- ==============================================================================
-- SUITO — DEPLOY CONSOLIDADO DE MIGRACIONES
-- Copiar y pegar en: https://supabase.com/dashboard/project/bfsttdiokdqyvwjuvcbp/sql
-- Seguro para ejecución repetida (todas las sentencias son idempotentes).
-- ==============================================================================

-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ 1/7  20260425_rpcs_consolidated — Columnas + 6 RPCs de negocio          ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

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
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS whatsapp_message TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS font_family     TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS social_color    TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS card_theme      TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS custom_css      TEXT;

CREATE INDEX IF NOT EXISTS idx_businesses_edit_token ON public.businesses(edit_token);

-- RPC 1: claim_business
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

-- RPC 2: update_business_profile_secure
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
    p_whatsapp_message TEXT DEFAULT NULL,
    p_font_family    TEXT DEFAULT NULL,
    p_social_color   TEXT DEFAULT NULL,
    p_card_theme     TEXT DEFAULT NULL,
    p_custom_css     TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_business_id UUID;
BEGIN
    SELECT id INTO v_business_id
      FROM public.businesses
     WHERE id = p_card_id
       AND edit_token = p_edit_token;

    IF v_business_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_TOKEN: Token de edición no válido para este negocio.';
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
           font_family    = COALESCE(p_font_family,    font_family),
           social_color   = COALESCE(p_social_color,   social_color),
           card_theme     = COALESCE(p_card_theme,     card_theme),
           custom_css     = COALESCE(p_custom_css,     custom_css),
           updated_at     = now()
     WHERE id = v_business_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_business_profile_secure(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_business_profile_secure(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO anon, authenticated;

-- RPC 3: add_gallery_image_secure
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

-- RPC 4: delete_gallery_image_secure
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

-- RPC 5: update_gallery_caption_secure
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

-- RPC 6: update_active_modules_secure
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


-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ 2/7  20260426000000 — Columna whatsapp_message                          ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS whatsapp_message TEXT DEFAULT '';


-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ 3/7  20260426000001 — Columna frecuencia_turnos en schedules            ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.schedules
ADD COLUMN IF NOT EXISTS frecuencia_turnos INTEGER DEFAULT 30 NOT NULL;


-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ 4/7  20260426000002 — RPC get_busy_slots (disponibilidad sin PII)       ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

CREATE INDEX IF NOT EXISTS idx_appointments_busy_slots
ON public.appointments (business_id, fecha, estado, hora);

DROP FUNCTION IF EXISTS public.get_busy_slots(UUID, DATE);

CREATE OR REPLACE FUNCTION public.get_busy_slots(
    p_business_id UUID,
    p_date DATE
)
RETURNS TEXT[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT COALESCE(
        array_agg(DISTINCT to_char(a.hora::time, 'HH24:MI') ORDER BY to_char(a.hora::time, 'HH24:MI')),
        ARRAY[]::TEXT[]
    )
    FROM public.appointments AS a
    WHERE a.business_id = p_business_id
      AND a.fecha = p_date
      AND COALESCE(a.estado, '') <> 'Cancelado';
$$;

REVOKE ALL ON FUNCTION public.get_busy_slots(UUID, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_busy_slots(UUID, DATE) TO anon, authenticated;


-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ 5/7  20260426000003 — Cancellation token + RPCs de cancelación          ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS cancellation_token UUID;

UPDATE public.appointments
SET cancellation_token = gen_random_uuid()
WHERE cancellation_token IS NULL;

ALTER TABLE public.appointments
ALTER COLUMN cancellation_token SET DEFAULT gen_random_uuid(),
ALTER COLUMN cancellation_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_cancellation_token
ON public.appointments (cancellation_token);

DROP FUNCTION IF EXISTS public.get_appointment_for_cancellation(TEXT, UUID);
DROP FUNCTION IF EXISTS public.cancel_appointment_by_token(TEXT, UUID);

CREATE OR REPLACE FUNCTION public.get_appointment_for_cancellation(
    p_slug TEXT,
    p_token UUID
)
RETURNS TABLE (
    appointment_id UUID,
    business_slug TEXT,
    business_name TEXT,
    fecha DATE,
    hora TEXT,
    servicio TEXT,
    estado TEXT,
    can_cancel BOOLEAN,
    reason TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT
        a.id AS appointment_id,
        b.slug AS business_slug,
        COALESCE(b.nombre_negocio, b.slug) AS business_name,
        a.fecha,
        to_char(a.hora::time, 'HH24:MI') AS hora,
        COALESCE(a.servicio, '') AS servicio,
        a.estado,
        (
            COALESCE(a.estado, '') <> 'Cancelado'
            AND (a.fecha::timestamp + a.hora::time) >= (
                timezone('America/Argentina/Buenos_Aires', now()) + interval '2 hours'
            )
        ) AS can_cancel,
        CASE
            WHEN COALESCE(a.estado, '') = 'Cancelado' THEN 'already_cancelled'
            WHEN (a.fecha::timestamp + a.hora::time) < (
                timezone('America/Argentina/Buenos_Aires', now()) + interval '2 hours'
            ) THEN 'too_late'
            ELSE 'ok'
        END AS reason
    FROM public.appointments AS a
    JOIN public.businesses AS b ON b.id = a.business_id
    WHERE b.slug = p_slug
      AND a.cancellation_token = p_token
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.cancel_appointment_by_token(
    p_slug TEXT,
    p_token UUID
)
RETURNS TABLE (
    appointment_id UUID,
    result TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_appointment RECORD;
BEGIN
    SELECT
        a.id,
        a.estado,
        a.fecha,
        a.hora
    INTO v_appointment
    FROM public.appointments AS a
    JOIN public.businesses AS b ON b.id = a.business_id
    WHERE b.slug = p_slug
      AND a.cancellation_token = p_token
    FOR UPDATE OF a;

    IF v_appointment.id IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, 'not_found'::TEXT;
        RETURN;
    END IF;

    IF COALESCE(v_appointment.estado, '') = 'Cancelado' THEN
        RETURN QUERY SELECT v_appointment.id::UUID, 'already_cancelled'::TEXT;
        RETURN;
    END IF;

    IF (v_appointment.fecha::timestamp + v_appointment.hora::time) < (
        timezone('America/Argentina/Buenos_Aires', now()) + interval '2 hours'
    ) THEN
        RETURN QUERY SELECT v_appointment.id::UUID, 'too_late'::TEXT;
        RETURN;
    END IF;

    UPDATE public.appointments
    SET estado = 'Cancelado'
    WHERE id = v_appointment.id;

    RETURN QUERY SELECT v_appointment.id::UUID, 'cancelled'::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.get_appointment_for_cancellation(TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_appointment_by_token(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_appointment_for_cancellation(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_appointment_by_token(TEXT, UUID) TO anon, authenticated;


-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ 6/7  20260426000004 — RLS appointments + índice anti-doble-reserva      ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read" ON public.appointments;
DROP POLICY IF EXISTS "Lectura pública de turnos para disponibilidad" ON public.appointments;
DROP POLICY IF EXISTS "Lectura publica de turnos para disponibilidad" ON public.appointments;
DROP POLICY IF EXISTS "Public insert" ON public.appointments;
DROP POLICY IF EXISTS "Inserción pública de turnos" ON public.appointments;
DROP POLICY IF EXISTS "Insercion publica de turnos" ON public.appointments;
DROP POLICY IF EXISTS "Permitir insercion solo si el modulo appointments esta activo" ON public.appointments;
DROP POLICY IF EXISTS "Permitir inserción solo si el modulo appointments esta activo" ON public.appointments;

REVOKE ALL ON public.appointments FROM anon;
REVOKE ALL ON public.appointments FROM PUBLIC;
REVOKE ALL ON public.appointments FROM authenticated;
GRANT SELECT ON public.appointments TO authenticated;
GRANT INSERT ON public.appointments TO anon, authenticated;

DROP POLICY IF EXISTS "Public insert only if appointments module is active" ON public.appointments;
CREATE POLICY "Public insert only if appointments module is active"
ON public.appointments
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.businesses AS b
    WHERE b.id = appointments.business_id
      AND 'appointments' = ANY(b.active_modules)
  )
);

DROP POLICY IF EXISTS "Duenos pueden ver turnos solo si tienen modulo activo" ON public.appointments;
CREATE POLICY "Duenos pueden ver turnos solo si tienen modulo activo"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.businesses AS b
    WHERE b.id = appointments.business_id
      AND b.user_id = auth.uid()
      AND 'appointments' = ANY(b.active_modules)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_no_double_booking
ON public.appointments (business_id, fecha, hora)
WHERE (estado IS DISTINCT FROM 'Cancelado');


-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ 7/7  20260426000005 — Column-level grants en businesses + super_admins  ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

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

REVOKE ALL ON public.businesses FROM anon;
REVOKE ALL ON public.businesses FROM PUBLIC;
REVOKE ALL ON public.businesses FROM authenticated;

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

GRANT SELECT (
    id, user_id, slug, nombre_negocio, telefono, email, valor_sena,
    alias_mp, link_pago, qr_image_url, modo_sandbox, foto_url,
    color_primario, notificaciones_email, recordatorios_activos,
    fecha_vencimiento, is_premium, profession, description, location,
    facebook, instagram, linkedin, website, booking_url, whatsapp_message,
    cover_url, gallery_images, active_modules, subscription_status,
    trial_ends_at, locked_price, price_lock_ends_at, free_until,
    font_family, social_color, card_theme, custom_css, created_at,
    updated_at
) ON public.businesses TO authenticated;

-- Authenticated users need table-level SELECT for the admin panel's select('*').
-- RLS below restricts this to own rows or super_admin rows, so sensitive columns
-- like edit_token are not exposed through the public anon profile policy.
GRANT SELECT ON public.businesses TO authenticated;

GRANT INSERT ON public.businesses TO anon, authenticated;
GRANT UPDATE, DELETE ON public.businesses TO authenticated;

CREATE POLICY "Public can view business profiles"
ON public.businesses
FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "Owners can view their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Authenticated owners and super admins can view business profiles" ON public.businesses;
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

CREATE POLICY "Authenticated owners and super admins can view business profiles"
ON public.businesses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

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

DROP POLICY IF EXISTS "Public cannot update directly" ON public.businesses;
CREATE POLICY "Public cannot update directly"
ON public.businesses
FOR UPDATE
TO anon
USING (false);


-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║ 8/8  Pricing dinámico — Admin conectado con landing                     ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.pricing (
    id          TEXT PRIMARY KEY,
    monthly     NUMERIC NOT NULL,
    quarterly   NUMERIC NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.pricing (id, monthly, quarterly) VALUES
    ('tarjeta', 4900,  12500),
    ('turnos',  9900,  25000),
    ('combo',   12900, 33000)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.pricing FROM anon;
REVOKE ALL ON public.pricing FROM PUBLIC;
REVOKE ALL ON public.pricing FROM authenticated;

GRANT SELECT ON public.pricing TO anon;
GRANT SELECT ON public.pricing TO authenticated;
GRANT UPDATE ON public.pricing TO authenticated;

DROP POLICY IF EXISTS "pricing_read_all" ON public.pricing;
CREATE POLICY "pricing_read_all" ON public.pricing
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "pricing_update_auth" ON public.pricing;
DROP POLICY IF EXISTS "pricing_update_super_admin" ON public.pricing;
CREATE POLICY "pricing_update_super_admin" ON public.pricing
FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.update_pricing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pricing_updated_at ON public.pricing;
CREATE TRIGGER trg_pricing_updated_at
    BEFORE UPDATE ON public.pricing
    FOR EACH ROW
    EXECUTE FUNCTION public.update_pricing_timestamp();


-- ╔════════════════════════════════════════════════════════════════════════════╗
-- ║  AUDITORÍA — Ejecutar para verificar que todo se aplicó correctamente    ║
-- ╚════════════════════════════════════════════════════════════════════════════╝

-- A) RPCs creadas (esperado: 8+ filas)
SELECT proname, prokind FROM pg_proc
WHERE proname IN (
  'get_busy_slots','get_appointment_for_cancellation',
  'cancel_appointment_by_token','claim_business',
  'update_business_profile_secure','add_gallery_image_secure',
  'delete_gallery_image_secure','update_gallery_caption_secure',
  'update_active_modules_secure','is_super_admin'
)
ORDER BY proname;

-- B) RLS policies en appointments (esperado: 2 policies — INSERT + SELECT)
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'appointments'
ORDER BY cmd;

-- C) Grants en appointments (esperado: anon=INSERT, authenticated=INSERT+SELECT)
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'appointments' AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- D) anon NO puede SELECT en appointments (esperado: 0 filas)
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'appointments' AND table_schema = 'public'
  AND grantee = 'anon' AND privilege_type = 'SELECT';

-- E) edit_token NO expuesto a nadie (esperado: 0 filas)
SELECT column_name, grantee, privilege_type
FROM information_schema.column_privileges
WHERE table_name = 'businesses' AND column_name = 'edit_token';

-- F) Índice anti-doble-reserva existe (esperado: 1 fila)
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'appointments'
  AND indexname = 'idx_appointments_no_double_booking';

-- G) Pricing conectado a landing/admin (esperado: 3 filas + anon SELECT + authenticated UPDATE)
SELECT id, monthly, quarterly
FROM public.pricing
ORDER BY id;

SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'pricing'
ORDER BY grantee, privilege_type;

-- H) Ningún privilegio peligroso para anon/PUBLIC en tablas sensibles (esperado: 0 filas)
SELECT table_name, grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN ('pricing', 'appointments', 'businesses')
  AND grantee IN ('anon', 'PUBLIC')
  AND privilege_type IN ('UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER');
