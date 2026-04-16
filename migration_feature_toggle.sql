-- ==============================================================================
-- MIGRACIÓN: FEATURE TOGGLE - CONTROL DE MÓDULO DE TURNOS
-- ==============================================================================

-- 1. Cambiar DEFAULT de active_modules para que nuevos clientes no tengan turnos por defecto
ALTER TABLE public.businesses 
ALTER COLUMN active_modules SET DEFAULT '{"card"}';

-- 2. Migrar registros existentes que tienen el default viejo pero no se usan activamente para turnos
-- Solo afecta a quienes tienen {"appointments", "card"}, no tienen booking_url y no tienen turnos creados.
UPDATE public.businesses
SET active_modules = ARRAY['card']::TEXT[]
WHERE active_modules = '{"appointments", "card"}'::TEXT[]
  AND (booking_url IS NULL OR booking_url = '')
  AND id NOT IN (
    -- Esta subconsulta es segura: si la tabla appointments no existe, el script fallará aquí (aviso de seguridad)
    -- Si existe, evita desactivar el módulo a quien ya tiene data.
    SELECT DISTINCT business_id FROM public.appointments
  );

-- 3. Crear RPC para actualización segura de módulos desde el cliente
CREATE OR REPLACE FUNCTION public.update_active_modules_secure(
    p_card_id UUID,
    p_edit_token TEXT,
    p_active_modules TEXT[]
) 
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.businesses
       SET active_modules = p_active_modules
     WHERE id = p_card_id 
       AND edit_token = p_edit_token;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'invalid_edit_token_or_business_not_found' USING ERRCODE = '28000';
    END IF;
END;
$$;

-- Permisos para la nueva función
REVOKE ALL ON FUNCTION public.update_active_modules_secure(UUID, TEXT, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_active_modules_secure(UUID, TEXT, TEXT[]) TO anon, authenticated;

-- Verificación de la migración
DO $$
BEGIN
  RAISE NOTICE 'Migración de Feature Toggle completada con éxito.';
END $$;
