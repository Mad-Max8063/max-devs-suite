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
