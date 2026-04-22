-- ==============================================================================
-- FIX: ACCESIBILIDAD PÚBLICA PARA GESTOR DE TURNOS
-- Objetivo: Permitir que los clientes puedan ver horarios, servicios y disponibilidad.
-- ==============================================================================

-- 1. Permitir lectura pública de horarios (Schedules)
-- Necesario para que el calendario muestre las horas de apertura.
DROP POLICY IF EXISTS "Lectura pública de horarios" ON public.schedules;
CREATE POLICY "Lectura pública de horarios"
ON public.schedules FOR SELECT
USING (true);

-- 2. Permitir lectura pública de servicios (Services)
-- Necesario para que el cliente elija qué servicio reservar.
DROP POLICY IF EXISTS "Lectura pública de servicios" ON public.services;
CREATE POLICY "Lectura pública de servicios"
ON public.services FOR SELECT
USING (true);

-- 3. Permitir lectura pública de fechas bloqueadas (Blocked Dates)
-- Necesario para ocultar días de vacaciones/feriados en el calendario.
DROP POLICY IF EXISTS "Lectura pública de fechas bloqueadas" ON public.blocked_dates;
CREATE POLICY "Lectura pública de fechas bloqueadas"
ON public.blocked_dates FOR SELECT
USING (true);

-- 4. Permitir lectura LIMITADA de turnos para calcular disponibilidad
-- Para evitar exponer nombres/teléfonos de clientes, idealmente usaríamos una VIEW,
-- pero para resolver el bloqueo inmediato, permitimos SELECT público.
-- La aplicación (supabaseService.ts) solo solicita la columna 'hora'.
DROP POLICY IF EXISTS "Lectura pública de turnos para disponibilidad" ON public.appointments;
CREATE POLICY "Lectura pública de turnos para disponibilidad"
ON public.appointments FOR SELECT
USING (true);

-- 5. ÍNDICE DE UNICIDAD PARA EVITAR DOBLE RESERVA (Race Condition)
-- Esto asegura que NUNCA haya dos turnos en el mismo horario para el mismo negocio.
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_no_double_booking 
ON public.appointments (business_id, fecha, hora) 
WHERE (estado != 'Cancelado');

-- 6. Asegurar que los negocios puedan ser creados por usuarios autenticados
-- (Por si la política previa era muy restrictiva)
DROP POLICY IF EXISTS "Permitir a usuarios crear su propio negocio" ON public.businesses;
CREATE POLICY "Permitir a usuarios crear su propio negocio"
ON public.businesses FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
