-- ==========================================
-- MIGRACIÓN: ESTABILIZACIÓN DE TABLA LEADS
-- ==========================================
-- Ejecutar en el SQL Editor de Supabase para asegurar el flujo de registros.

-- 1. Crear tabla si no existe
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Asegurar columnas necesarias
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS service_type TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS profile_img_url TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS cover_img_url TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 3. Habilitar RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Seguridad (Leads)
DROP POLICY IF EXISTS "Permitir inserción pública de leads" ON public.leads;
CREATE POLICY "Permitir inserción pública de leads"
ON public.leads FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Solo admins ven y editan leads" ON public.leads;
CREATE POLICY "Solo admins ven y editan leads"
ON public.leads FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Políticas de Storage (Bucket: images)
-- Permite que cualquiera suba fotos de onboarding solo a la carpeta 'leads/'
DROP POLICY IF EXISTS "images: anon insert leads only" ON storage.objects;
CREATE POLICY "images: anon insert leads only"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'images' AND (storage.foldername(name))[1] = 'leads');

-- Asegurar lectura pública para el bucket 'images' (si no está ya)
DROP POLICY IF EXISTS "Public access for images" ON storage.objects;
CREATE POLICY "Public access for images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');
