-- ==========================================================
-- NOTIFICATIONS INFRASTRUCTURE SCHEMA (Supabase/PostgreSQL)
-- ==========================================================
-- Autor: Senior Full-Stack Architect
-- Propósito: Implementar cola de notificaciones asíncrona con triggers.
-- ==========================================================

-- 1. Definición del tipo de estado para la notificación
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status') THEN
        CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'canceled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('confirmation', 'reminder', 'cancellation');
    END IF;
END $$;

-- 2. Creación de la tabla de cola de notificaciones
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    recipient_phone TEXT NOT NULL,
    recipient_email TEXT,
    message TEXT NOT NULL,
    status notification_status DEFAULT 'pending',
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para optimización de worker de envío
CREATE INDEX IF NOT EXISTS idx_notification_pending_scheduled ON notification_queue (status, scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notification_appointment_id ON notification_queue (appointment_id);

-- 3. Función de Trigger para poblar la cola automáticamente
CREATE OR REPLACE FUNCTION fn_trigger_enqueue_appointment_notifications()
RETURNS TRIGGER AS $$
DECLARE
    v_business_name TEXT;
    v_business_phone TEXT;
    v_recordatorios_activos BOOLEAN;
    v_appointment_timestamp TIMESTAMP;
    v_message_confirm TEXT;
    v_message_reminder TEXT;
BEGIN
    -- Obtener metadatos del negocio
    SELECT nombre_negocio, telefono, recordatorios_activos 
    INTO v_business_name, v_business_phone, v_recordatorios_activos
    FROM businesses 
    WHERE id = NEW.business_id;

    -- Construir timestamp del turno (Fecha y Hora vienen como strings en el esquema actual)
    v_appointment_timestamp := (NEW.fecha || ' ' || NEW.hora)::TIMESTAMP;

    -- A. Notificación de Confirmación Inmediata
    v_message_confirm := format(
        '¡Hola %s! Confirmamos tu turno de %s para el %s a las %s en %s. ¡Te esperamos!',
        NEW.nombre_cliente,
        NEW.servicio,
        to_char(NEW.fecha::DATE, 'DD/MM'),
        NEW.hora,
        v_business_name
    );

    INSERT INTO notification_queue (
        appointment_id, 
        business_id, 
        type, 
        recipient_phone, 
        recipient_email, 
        message, 
        scheduled_at
    ) VALUES (
        NEW.id,
        NEW.business_id,
        'confirmation',
        NEW.telefono_cliente,
        NEW.email_cliente,
        v_message_confirm,
        now() -- Envío inmediato
    );

    -- B. Recordatorio (24 horas antes)
    -- Solo si el negocio tiene recordatorios activos y falta más de 24hs para el turno
    IF v_recordatorios_activos AND (v_appointment_timestamp - INTERVAL '24 hours') > now() THEN
        v_message_reminder := format(
            'Recordatorio: Mañana tenés un turno de %s a las %s en %s. ¡Nos vemos!',
            NEW.servicio,
            NEW.hora,
            v_business_name
        );

        INSERT INTO notification_queue (
            appointment_id, 
            business_id, 
            type, 
            recipient_phone, 
            recipient_email, 
            message, 
            scheduled_at
        ) VALUES (
            NEW.id,
            NEW.business_id,
            'reminder',
            NEW.telefono_cliente,
            NEW.email_cliente,
            v_message_reminder,
            v_appointment_timestamp - INTERVAL '24 hours'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Creación del TRIGGER
DROP TRIGGER IF EXISTS tr_enqueue_notifications ON appointments;
CREATE TRIGGER tr_enqueue_notifications
AFTER INSERT ON appointments
FOR EACH ROW
EXECUTE FUNCTION fn_trigger_enqueue_appointment_notifications();

-- Comentario de advertencia JIT para el usuario:
-- NOTA: Se asume que las tablas 'appointments' y 'businesses' ya existen con los campos:
-- appointments: id, business_id, fecha, hora, nombre_cliente, telefono_cliente, email_cliente, servicio.
-- businesses: id, nombre_negocio, telefono, recordatorios_activos.
