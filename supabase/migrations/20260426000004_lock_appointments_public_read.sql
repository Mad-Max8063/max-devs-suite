-- Closes legacy public-read access to appointments now that availability and
-- cancellation use privacy-preserving SECURITY DEFINER RPCs.
--
-- Public users may still create bookings, read schedules/services/blocked dates,
-- and call get_busy_slots/get_appointment_for_cancellation/cancel_appointment_by_token.
-- They must not SELECT customer PII from public.appointments.

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read" ON public.appointments;
DROP POLICY IF EXISTS "Lectura pública de turnos para disponibilidad" ON public.appointments;
DROP POLICY IF EXISTS "Lectura publica de turnos para disponibilidad" ON public.appointments;
DROP POLICY IF EXISTS "Public insert" ON public.appointments;
DROP POLICY IF EXISTS "Inserción pública de turnos" ON public.appointments;
DROP POLICY IF EXISTS "Insercion publica de turnos" ON public.appointments;
DROP POLICY IF EXISTS "Permitir insercion solo si el modulo appointments esta activo" ON public.appointments;
DROP POLICY IF EXISTS "Permitir inserción solo si el modulo appointments esta activo" ON public.appointments;

REVOKE SELECT ON public.appointments FROM anon;
REVOKE SELECT ON public.appointments FROM PUBLIC;
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
