-- ==============================================================================
-- PRODUCT LAB: SECURITY HARDENING PARA SUITO
-- ==============================================================================
-- Objetivo: Evitar la inserción de turnos (appointments) o manipulación de datos
-- si el negocio (business) no tiene el módulo correspondiente activo.

-- 0. Asegurar que la columna 'active_modules' EXISTA en la tabla businesses
-- Por defecto le asignamos los dos módulos si no la tenías.
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS active_modules TEXT[] DEFAULT '{"appointments", "card"}';

-- 1. Habilitar RLS en la tabla public.appointments (si no estaba habilitado)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 2. Crear la nueva política estricta de Inserción
-- Esta política asegura que cualquiera (anon o autenticado) pueda crear un turno
-- SOLAMENTE si el business_id al que apunta tiene 'appointments' en su array de active_modules.
DROP POLICY IF EXISTS "Permitir inserción solo si el modulo appointments esta activo" ON public.appointments;
CREATE POLICY "Permitir inserción solo si el modulo appointments esta activo"
ON public.appointments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.businesses b 
    WHERE b.id = business_id 
    AND 'appointments' = ANY(b.active_modules)
  )
);


-- ==============================================================================
-- PROTECCIÓN DE VISIBILIDAD DE DATOS (OPCIONAL PERO RECOMENDADA)
-- Evita que las APIs devuelvan la lista de turnos de un negocio que ya no paga.
-- ==============================================================================

-- 3. Política: SOLO lectura de turnos propios
DROP POLICY IF EXISTS "Solo dueños ven sus propios turnos" ON public.appointments;
CREATE POLICY "Solo dueños ven sus propios turnos"
ON public.appointments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = business_id
    AND b.user_id = auth.uid()
    AND 'appointments' = ANY(b.active_modules)
  )
);

-- 4. Política: SOLO actualizar turnos propios
DROP POLICY IF EXISTS "Solo dueños pueden actualizar sus turnos" ON public.appointments;
CREATE POLICY "Solo dueños pueden actualizar sus turnos"
ON public.appointments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = business_id
    AND b.user_id = auth.uid()
    AND 'appointments' = ANY(b.active_modules)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = business_id
    AND b.user_id = auth.uid()
    AND 'appointments' = ANY(b.active_modules)
  )
);

-- 5. Política: SOLO eliminar turnos propios
DROP POLICY IF EXISTS "Solo dueños pueden eliminar sus turnos" ON public.appointments;
CREATE POLICY "Solo dueños pueden eliminar sus turnos"
ON public.appointments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = business_id
    AND b.user_id = auth.uid()
    AND 'appointments' = ANY(b.active_modules)
  )
);

-- ==============================================================================
-- PROTECCIÓN PARA OTRAS TABLAS DEL ECOSISTEMA
-- Solo el dueño de un negocio puede editar su configuración.
-- ==============================================================================

-- 6. Schedules (Habilitar RLS y proteger)
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Solo dueños gestionan sus horarios" ON public.schedules;
CREATE POLICY "Solo dueños gestionan sus horarios"
ON public.schedules FOR ALL
USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.user_id = auth.uid()));

-- 7. Services (Habilitar RLS y proteger)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Solo dueños gestionan sus servicios" ON public.services;
CREATE POLICY "Solo dueños gestionan sus servicios"
ON public.services FOR ALL
USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.user_id = auth.uid()));

-- 8. Blocked Dates (Habilitar RLS y proteger)
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Solo dueños gestionan sus bloqueos" ON public.blocked_dates;
CREATE POLICY "Solo dueños gestionan sus bloqueos"
ON public.blocked_dates FOR ALL
USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.user_id = auth.uid()));

-- 9. Businesses (Seguridad en la tabla principal)
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- SELECT público (necesario para que las tarjetas virtuales y el sistema de turnos funcionen sin login)
DROP POLICY IF EXISTS "Lectura pública de negocios" ON public.businesses;
CREATE POLICY "Lectura pública de negocios"
ON public.businesses FOR SELECT
USING (true);

-- UPDATE solo por el dueño
DROP POLICY IF EXISTS "Solo dueños editan su negocio" ON public.businesses;
CREATE POLICY "Solo dueños editan su negocio"
ON public.businesses FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- INSERT (Solo el admin/dueño por ahora)
DROP POLICY IF EXISTS "Solo usuarios autenticados crean negocios" ON public.businesses;
CREATE POLICY "Solo usuarios autenticados crean negocios"
ON public.businesses FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

