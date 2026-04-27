-- Adds a privacy-preserving RPC for public slot availability checks.
-- Public clients can learn which times are unavailable without reading
-- appointment customer names, phones, emails, or payment details.

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
