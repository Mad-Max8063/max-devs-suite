-- Migración para añadir edit_token a la tabla businesses
-- Requerido para el sistema de autogestión de tarjetas (Gallery Editor)

ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS edit_token TEXT;

-- Crear un índice para búsquedas rápidas por edit_token
CREATE INDEX IF NOT EXISTS idx_businesses_edit_token ON public.businesses(edit_token);

-- Asegurarse de que profession, description y otras columnas existan (por si no se corrió suito_db_migration.sql)
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS color_primario TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]';
