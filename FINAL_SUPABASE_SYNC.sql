-- ==============================================================================
-- FINAL SUPABASE SYNC: SUITO SAAS & MULTI-TENANT
-- Ejecutar este script en el SQL EDITOR de Supabase
-- ==============================================================================

-- 1. ASEGURAR COLUMNAS EN LA TABLA 'businesses'
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS nombre_negocio TEXT,
ADD COLUMN IF NOT EXISTS telefono TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS valor_sena NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS alias_mp TEXT,
ADD COLUMN IF NOT EXISTS link_pago TEXT,
ADD COLUMN IF NOT EXISTS qr_image_url TEXT,
ADD COLUMN IF NOT EXISTS modo_sandbox BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS foto_url TEXT,
ADD COLUMN IF NOT EXISTS color_primario TEXT,
ADD COLUMN IF NOT EXISTS notificaciones_email BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS recordatorios_activos BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS facebook TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS active_modules TEXT[] DEFAULT '{"appointments", "card"}',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
ADD COLUMN IF NOT EXISTS locked_price NUMERIC,
ADD COLUMN IF NOT EXISTS price_lock_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. ASEGURAR QUE LOS SLUGS EXISTENTES NO SEAN NULOS
-- (Si ya tienes datos, este paso les asigna un slug temporal basado en el ID)
UPDATE public.businesses SET slug = substring(id::text, 1, 8) WHERE slug IS NULL;

-- 3. HABILITAR RLS Y POLÍTICAS PÚBLICAS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de negocios" ON public.businesses;
CREATE POLICY "Lectura pública de negocios"
ON public.businesses FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Solo dueños editan su negocio" ON public.businesses;
DROP POLICY IF EXISTS "Dueños y Admins gestionan negocios" ON public.businesses;
CREATE POLICY "Dueños y Admins gestionan negocios"
ON public.businesses FOR ALL
USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()))
WITH CHECK (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

-- 4. PERMISOS PARA TABLA APPOINTMENTS (TURNOS)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de turnos para disponibilidad" ON public.appointments;
CREATE POLICY "Lectura pública de turnos para disponibilidad"
ON public.appointments FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Inserción pública de turnos" ON public.appointments;
CREATE POLICY "Inserción pública de turnos"
ON public.appointments FOR INSERT
WITH CHECK (true);

-- 5. ÍNDICE DE UNICIDAD PARA EVITAR DOBLE RESERVA
DROP INDEX IF EXISTS idx_appointments_no_double_booking;
CREATE UNIQUE INDEX idx_appointments_no_double_booking 
ON public.appointments (business_id, fecha, hora) 
WHERE (estado != 'Cancelado');

-- ==============================================================================
-- FIN DEL SCRIPT. COPIA Y PEGA EN SUPABASE SQL EDITOR.
-- ==============================================================================
