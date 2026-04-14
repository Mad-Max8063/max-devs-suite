-- Migración para añadir columnas necesarias a la tabla businesses (v2)
-- Requerido para el sistema de autogestión y perfiles automáticos

-- 1. Aseguramos que existan las columnas de imágenes y meta-datos
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS edit_token TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS cover_url TEXT; -- ← ESTA FALTABA
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS color_primario TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]';

-- 2. Creamos índices para optimizar la búsqueda
CREATE INDEX IF NOT EXISTS idx_businesses_edit_token ON public.businesses(edit_token);
