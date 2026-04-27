-- Adds customer self-service cancellation by opaque token.
-- Tokens are capability URLs: clients can cancel without reading or updating
-- appointments directly through public table permissions.

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
