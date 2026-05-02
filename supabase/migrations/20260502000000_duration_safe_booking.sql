-- ============================================
-- Migration: Duration-aware booking guard
-- 2026-05-02
-- ============================================

-- Store the duration used at booking time. Existing bookings are treated as
-- the previous default duration so availability remains conservative.
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS duracion_minutos INTEGER DEFAULT 60 NOT NULL;

UPDATE public.appointments
   SET duracion_minutos = 60
 WHERE duracion_minutos IS NULL;

ALTER TABLE public.appointments
ADD CONSTRAINT appointments_duracion_minutos_valid
CHECK (duracion_minutos BETWEEN 5 AND 720)
NOT VALID;

ALTER TABLE public.appointments
VALIDATE CONSTRAINT appointments_duracion_minutos_valid;

CREATE INDEX IF NOT EXISTS idx_appointments_busy_intervals
ON public.appointments (business_id, fecha, estado, hora, duracion_minutos);

-- Availability callers need busy intervals, not customer PII.
DROP FUNCTION IF EXISTS public.get_busy_intervals(UUID, DATE);

CREATE OR REPLACE FUNCTION public.get_busy_intervals(
    p_business_id UUID,
    p_date DATE
)
RETURNS TABLE (
    hora TEXT,
    duracion_minutos INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT
        to_char(a.hora::time, 'HH24:MI') AS hora,
        COALESCE(a.duracion_minutos, 60) AS duracion_minutos
    FROM public.appointments AS a
    WHERE a.business_id = p_business_id
      AND a.fecha = p_date
      AND COALESCE(a.estado, '') <> 'Cancelado'
    ORDER BY a.hora::time;
$$;

REVOKE ALL ON FUNCTION public.get_busy_intervals(UUID, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_busy_intervals(UUID, DATE) TO anon, authenticated;

-- Public-safe creation path. It serializes bookings per business/date and
-- checks schedule, blocked dates, module gate, and duration-aware overlaps
-- in one database transaction.
DROP FUNCTION IF EXISTS public.create_appointment_secure(
    UUID, DATE, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC
);

CREATE OR REPLACE FUNCTION public.create_appointment_secure(
    p_business_id UUID,
    p_fecha DATE,
    p_hora TEXT,
    p_duracion_minutos INTEGER,
    p_nombre_cliente TEXT,
    p_telefono_cliente TEXT,
    p_email_cliente TEXT DEFAULT '',
    p_servicio TEXT DEFAULT '',
    p_precio_total NUMERIC DEFAULT 0,
    p_monto_sena NUMERIC DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_appointment_id UUID;
    v_hora TIME;
    v_start_min INTEGER;
    v_duration INTEGER := COALESCE(NULLIF(p_duracion_minutos, 0), 60);
    v_schedule RECORD;
    v_conflict_exists BOOLEAN;
BEGIN
    BEGIN
        v_hora := p_hora::time;
    EXCEPTION WHEN others THEN
        RAISE EXCEPTION 'invalid_time' USING ERRCODE = '22007';
    END;

    IF v_duration < 5 OR v_duration > 720 THEN
        RAISE EXCEPTION 'invalid_duration' USING ERRCODE = '22023';
    END IF;

    IF COALESCE(trim(p_nombre_cliente), '') = '' OR COALESCE(trim(p_telefono_cliente), '') = '' THEN
        RAISE EXCEPTION 'missing_customer_data' USING ERRCODE = '23502';
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM public.businesses b
         WHERE b.id = p_business_id
           AND 'appointments' = ANY(b.active_modules)
    ) THEN
        RAISE EXCEPTION 'appointments_module_inactive' USING ERRCODE = '42501';
    END IF;

    SELECT s.horarios, s.duracion_turno
      INTO v_schedule
      FROM public.schedules s
     WHERE s.business_id = p_business_id
       AND s.dia_semana = EXTRACT(DOW FROM p_fecha)::INTEGER
     LIMIT 1;

    IF v_schedule.horarios IS NULL
       OR NOT (to_char(v_hora, 'HH24:MI') = ANY(v_schedule.horarios)) THEN
        RAISE EXCEPTION 'slot_not_available' USING ERRCODE = '23514';
    END IF;

    IF EXISTS (
        SELECT 1
          FROM public.blocked_dates bd
         WHERE bd.business_id = p_business_id
           AND bd.fecha = p_fecha
    ) THEN
        RAISE EXCEPTION 'date_blocked' USING ERRCODE = '23514';
    END IF;

    -- Serialize only the affected business/day so parallel clients cannot both
    -- pass the overlap check before inserting.
    PERFORM pg_advisory_xact_lock(hashtextextended(p_business_id::TEXT || ':' || p_fecha::TEXT, 0));

    v_start_min := EXTRACT(HOUR FROM v_hora)::INTEGER * 60
                 + EXTRACT(MINUTE FROM v_hora)::INTEGER;

    SELECT EXISTS (
        SELECT 1
          FROM public.appointments a
         WHERE a.business_id = p_business_id
           AND a.fecha = p_fecha
           AND COALESCE(a.estado, '') <> 'Cancelado'
           AND v_start_min < (
                EXTRACT(HOUR FROM a.hora::time)::INTEGER * 60
              + EXTRACT(MINUTE FROM a.hora::time)::INTEGER
              + COALESCE(a.duracion_minutos, 60)
           )
           AND (
                EXTRACT(HOUR FROM a.hora::time)::INTEGER * 60
              + EXTRACT(MINUTE FROM a.hora::time)::INTEGER
           ) < v_start_min + v_duration
    ) INTO v_conflict_exists;

    IF v_conflict_exists THEN
        RAISE EXCEPTION 'slot_conflict' USING ERRCODE = '23505';
    END IF;

    INSERT INTO public.appointments (
        business_id,
        fecha,
        hora,
        duracion_minutos,
        nombre_cliente,
        telefono_cliente,
        email_cliente,
        servicio,
        precio_total,
        monto_sena
    )
    VALUES (
        p_business_id,
        p_fecha,
        to_char(v_hora, 'HH24:MI'),
        v_duration,
        trim(p_nombre_cliente),
        trim(p_telefono_cliente),
        COALESCE(trim(p_email_cliente), ''),
        COALESCE(trim(p_servicio), ''),
        COALESCE(p_precio_total, 0),
        COALESCE(p_monto_sena, 0)
    )
    RETURNING id INTO v_appointment_id;

    RETURN v_appointment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_appointment_secure(
    UUID, DATE, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_appointment_secure(
    UUID, DATE, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC
) TO anon, authenticated;
