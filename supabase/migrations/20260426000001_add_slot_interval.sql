-- Adds configurable slot-grid frequency for appointment schedules.
-- Default 30 keeps existing businesses compatible with the previous fixed grid.
ALTER TABLE public.schedules
ADD COLUMN IF NOT EXISTS frecuencia_turnos INTEGER DEFAULT 30 NOT NULL;
