-- ==============================================================================
-- FASE 7: MIGRACION BASE DE DATOS SUITO (UNIFICANDO GESTOR + TARJETA VIRTUAL)
-- ==============================================================================

-- 1. Agregar las columnas de Identidad Digital (Tarjeta Virtual) a la tabla maestra 'businesses'
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS facebook TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free'; -- 'free', 'premium', 'combo'

-- 2. Asegurarse de que las políticas RLS permitan lectura publica
DROP POLICY IF EXISTS "Permitir lectura publica a negocios (tarjeta virtual)" ON public.businesses;
CREATE POLICY "Permitir lectura publica a negocios (tarjeta virtual)"
ON public.businesses
FOR SELECT
TO public
USING (true);

-- Listo! Ya tienes una base de datos centralizada SaaS.
