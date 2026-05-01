-- ============================================
-- Migration: Private beta gating for Gestor de Turnos
-- 2026-05-01
-- ============================================

-- New public/business-created profiles start as card-only. Appointments are
-- enabled deliberately from the admin CRM during the private beta.
ALTER TABLE public.businesses
ALTER COLUMN active_modules SET DEFAULT ARRAY['card']::TEXT[];

UPDATE public.businesses
   SET active_modules = ARRAY['card']::TEXT[]
 WHERE active_modules @> ARRAY['appointments', 'card']::TEXT[]
   AND active_modules <@ ARRAY['appointments', 'card']::TEXT[]
   AND COALESCE(booking_url, '') = ''
   AND NOT EXISTS (
        SELECT 1
          FROM public.appointments a
         WHERE a.business_id = businesses.id
   );

-- Normalize legacy text status values if an earlier build wrote "trialing".
UPDATE public.businesses
   SET subscription_status = 'trial'
 WHERE subscription_status::TEXT = 'trialing';

-- The client edit-token flow may edit card content, but it must not activate
-- appointments. Admin/super-admin updates remain available through businesses.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public'
           AND p.proname = 'update_active_modules_secure'
    ) THEN
        REVOKE ALL ON FUNCTION public.update_active_modules_secure(UUID, TEXT, TEXT[])
        FROM PUBLIC, anon, authenticated;
    END IF;
END;
$$;

-- Owners of beta-enabled businesses can operate appointment lifecycle.
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

GRANT UPDATE (estado) ON public.appointments TO authenticated;
GRANT DELETE ON public.appointments TO authenticated;

DROP POLICY IF EXISTS "Owners can update appointments when module is active" ON public.appointments;
CREATE POLICY "Owners can update appointments when module is active"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
      FROM public.businesses b
     WHERE b.id = appointments.business_id
       AND b.user_id = auth.uid()
       AND 'appointments' = ANY(b.active_modules)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
      FROM public.businesses b
     WHERE b.id = appointments.business_id
       AND b.user_id = auth.uid()
       AND 'appointments' = ANY(b.active_modules)
  )
);

DROP POLICY IF EXISTS "Owners can delete appointments when module is active" ON public.appointments;
CREATE POLICY "Owners can delete appointments when module is active"
ON public.appointments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
      FROM public.businesses b
     WHERE b.id = appointments.business_id
       AND b.user_id = auth.uid()
       AND 'appointments' = ANY(b.active_modules)
  )
);

-- Public booking needs read-only configuration, but only for beta-enabled
-- businesses. Owners can manage configuration for their own enabled module.
DO $$
BEGIN
    IF to_regclass('public.schedules') IS NOT NULL THEN
        ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
        REVOKE ALL ON public.schedules FROM anon, authenticated, PUBLIC;
        GRANT SELECT ON public.schedules TO anon, authenticated;
        GRANT INSERT, UPDATE, DELETE ON public.schedules TO authenticated;

        DROP POLICY IF EXISTS "Public can read schedules for active appointments module" ON public.schedules;
        CREATE POLICY "Public can read schedules for active appointments module"
        ON public.schedules
        FOR SELECT
        TO anon, authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.businesses b
             WHERE b.id = schedules.business_id
               AND 'appointments' = ANY(b.active_modules)
          )
        );

        DROP POLICY IF EXISTS "Owners can manage schedules for active appointments module" ON public.schedules;
        CREATE POLICY "Owners can manage schedules for active appointments module"
        ON public.schedules
        FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.businesses b
             WHERE b.id = schedules.business_id
               AND b.user_id = auth.uid()
               AND 'appointments' = ANY(b.active_modules)
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.businesses b
             WHERE b.id = schedules.business_id
               AND b.user_id = auth.uid()
               AND 'appointments' = ANY(b.active_modules)
          )
        );
    END IF;
END;
$$;

DO $$
BEGIN
    IF to_regclass('public.services') IS NOT NULL THEN
        ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
        REVOKE ALL ON public.services FROM anon, authenticated, PUBLIC;
        GRANT SELECT ON public.services TO anon, authenticated;
        GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;

        DROP POLICY IF EXISTS "Public can read services for active appointments module" ON public.services;
        CREATE POLICY "Public can read services for active appointments module"
        ON public.services
        FOR SELECT
        TO anon, authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.businesses b
             WHERE b.id = services.business_id
               AND 'appointments' = ANY(b.active_modules)
          )
        );

        DROP POLICY IF EXISTS "Owners can manage services for active appointments module" ON public.services;
        CREATE POLICY "Owners can manage services for active appointments module"
        ON public.services
        FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.businesses b
             WHERE b.id = services.business_id
               AND b.user_id = auth.uid()
               AND 'appointments' = ANY(b.active_modules)
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.businesses b
             WHERE b.id = services.business_id
               AND b.user_id = auth.uid()
               AND 'appointments' = ANY(b.active_modules)
          )
        );
    END IF;
END;
$$;

DO $$
BEGIN
    IF to_regclass('public.blocked_dates') IS NOT NULL THEN
        ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
        REVOKE ALL ON public.blocked_dates FROM anon, authenticated, PUBLIC;
        GRANT SELECT ON public.blocked_dates TO anon, authenticated;
        GRANT INSERT, UPDATE, DELETE ON public.blocked_dates TO authenticated;

        DROP POLICY IF EXISTS "Public can read blocked dates for active appointments module" ON public.blocked_dates;
        CREATE POLICY "Public can read blocked dates for active appointments module"
        ON public.blocked_dates
        FOR SELECT
        TO anon, authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.businesses b
             WHERE b.id = blocked_dates.business_id
               AND 'appointments' = ANY(b.active_modules)
          )
        );

        DROP POLICY IF EXISTS "Owners can manage blocked dates for active appointments module" ON public.blocked_dates;
        CREATE POLICY "Owners can manage blocked dates for active appointments module"
        ON public.blocked_dates
        FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.businesses b
             WHERE b.id = blocked_dates.business_id
               AND b.user_id = auth.uid()
               AND 'appointments' = ANY(b.active_modules)
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.businesses b
             WHERE b.id = blocked_dates.business_id
               AND b.user_id = auth.uid()
               AND 'appointments' = ANY(b.active_modules)
          )
        );
    END IF;
END;
$$;
