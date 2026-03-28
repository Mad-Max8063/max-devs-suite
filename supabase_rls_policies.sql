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

-- Política de SELECT para dueños o admins:
DROP POLICY IF EXISTS "Duenos pueden ver turnos solo si tienen modulo activo" ON public.appointments;
CREATE POLICY "Duenos pueden ver turnos solo si tienen modulo activo"
ON public.appointments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.businesses b 
    WHERE b.id = business_id 
    AND b.user_id = auth.uid()
    AND 'appointments' = ANY(b.active_modules)
  )
);
