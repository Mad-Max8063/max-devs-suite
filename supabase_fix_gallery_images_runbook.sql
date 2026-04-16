-- ==============================================================================
-- RUNBOOK: CORRECCION DE ESQUEMA Y CLAVES FORANEAS EN GALLERY_IMAGES
-- ==============================================================================
-- Instrucciones:
-- Ejecutar en el SQL Editor de Supabase (https://bfsttdiokdqyvwjuvcbp.supabase.co).
-- Ejecutar paso por paso o los bloques transaccionales completos.
-- ==============================================================================

-- ==========================================
-- PASO 0: Inspección (Solo lectura)
-- (Ejecutar para verificar antes de limpiar)
-- ==========================================
-- 0.1 Buscar IDs noUUID (estos serán eliminados)
SELECT * FROM public.gallery_images 
WHERE card_id IS NOT NULL 
  AND card_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 0.2 Buscar registros sin un negocio correspondiente en `businesses`
SELECT g.* FROM public.gallery_images g
LEFT JOIN public.businesses b ON g.card_id = b.id::text
WHERE b.id IS NULL AND g.card_id IS NOT NULL;


-- ==========================================
-- PASO 1: Respaldo
-- ==========================================
CREATE TABLE IF NOT EXISTS public._backup_gallery_images_20260416 AS 
SELECT * FROM public.gallery_images;


-- ==========================================
-- PASO 2: Limpieza de registros incompatibles
-- ==========================================
-- 2.1 Limpiar card_id NULL o vacíos
DELETE FROM public.gallery_images WHERE card_id IS NULL OR length(trim(card_id)) = 0;

-- 2.2 Limpiar card_id que no tengan formato UUID estricto
DELETE FROM public.gallery_images 
WHERE card_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 2.3 Limpiar huérfanos reales (el ID parece UUID pero no existe en businesses)
DELETE FROM public.gallery_images g
WHERE NOT EXISTS (
    SELECT 1 FROM public.businesses b WHERE b.id::text = g.card_id
);


-- ==========================================
-- PASO 3: Transacción de Cambio Estructural
-- ==========================================
BEGIN;

-- 3.1 Eliminar la clave foránea conflictiva antigua
ALTER TABLE public.gallery_images DROP CONSTRAINT IF EXISTS gallery_images_card_id_fkey;

-- 3.2 Convertir la columna al tipo UUID
ALTER TABLE public.gallery_images ALTER COLUMN card_id TYPE uuid USING card_id::uuid;

-- 3.3 Crear la nueva restricción apuntando a `businesses(id)`
ALTER TABLE public.gallery_images 
ADD CONSTRAINT gallery_images_card_id_fkey 
FOREIGN KEY (card_id) REFERENCES public.businesses(id) 
ON DELETE CASCADE;

-- 3.4 Asegurar un índice en card_id para performance
CREATE INDEX IF NOT EXISTS idx_gallery_images_card_id ON public.gallery_images(card_id);

COMMIT;
-- (Si ocurre un error, PostgreSQL hará ROLLBACK automáticamente de este bloque BEGIN/COMMIT)


-- ==========================================
-- PASO 4: Recrear las RPCs SECURITY DEFINER
-- ==========================================
-- Aseguramos que los tipos en los parámetros sean estrictamente UUID

-- 4.1 add_gallery_image_secure
DROP FUNCTION IF EXISTS public.add_gallery_image_secure(UUID, TEXT, TEXT, TEXT, INT);
CREATE OR REPLACE FUNCTION public.add_gallery_image_secure(
    p_card_id    UUID,
    p_edit_token TEXT,
    p_image_url  TEXT,
    p_caption    TEXT DEFAULT '',
    p_sort_order INT  DEFAULT 0
)
RETURNS public.gallery_images
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_token TEXT;
    v_row   public.gallery_images;
BEGIN
    SELECT edit_token INTO v_token
      FROM public.businesses
     WHERE id = p_card_id;

    IF v_token IS NULL OR p_edit_token IS NULL OR v_token <> p_edit_token THEN
        RAISE EXCEPTION 'invalid_edit_token' USING ERRCODE = '28000';
    END IF;

    IF p_image_url IS NULL OR length(p_image_url) = 0 THEN
        RAISE EXCEPTION 'image_url_required' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.gallery_images (card_id, image_url, caption, sort_order)
    VALUES (p_card_id, p_image_url, COALESCE(p_caption, ''), COALESCE(p_sort_order, 0))
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;
REVOKE ALL ON FUNCTION public.add_gallery_image_secure(UUID, TEXT, TEXT, TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_gallery_image_secure(UUID, TEXT, TEXT, TEXT, INT) TO anon, authenticated;


-- 4.2 delete_gallery_image_secure
DROP FUNCTION IF EXISTS public.delete_gallery_image_secure(UUID, UUID, TEXT);
CREATE OR REPLACE FUNCTION public.delete_gallery_image_secure(
    p_image_id   UUID,
    p_card_id    UUID,
    p_edit_token TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_token TEXT;
BEGIN
    SELECT edit_token INTO v_token
      FROM public.businesses
     WHERE id = p_card_id;

    IF v_token IS NULL OR p_edit_token IS NULL OR v_token <> p_edit_token THEN
        RAISE EXCEPTION 'invalid_edit_token' USING ERRCODE = '28000';
    END IF;

    DELETE FROM public.gallery_images
     WHERE id = p_image_id
       AND card_id = p_card_id;
END;
$$;
REVOKE ALL ON FUNCTION public.delete_gallery_image_secure(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_gallery_image_secure(UUID, UUID, TEXT) TO anon, authenticated;


-- 4.3 update_gallery_caption_secure
DROP FUNCTION IF EXISTS public.update_gallery_caption_secure(UUID, UUID, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.update_gallery_caption_secure(
    p_image_id   UUID,
    p_card_id    UUID,
    p_edit_token TEXT,
    p_caption    TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_token TEXT;
BEGIN
    SELECT edit_token INTO v_token
      FROM public.businesses
     WHERE id = p_card_id;

    IF v_token IS NULL OR p_edit_token IS NULL OR v_token <> p_edit_token THEN
        RAISE EXCEPTION 'invalid_edit_token' USING ERRCODE = '28000';
    END IF;

    UPDATE public.gallery_images
       SET caption = COALESCE(p_caption, '')
     WHERE id = p_image_id
       AND card_id = p_card_id;
END;
$$;
REVOKE ALL ON FUNCTION public.update_gallery_caption_secure(UUID, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_gallery_caption_secure(UUID, UUID, TEXT, TEXT) TO anon, authenticated;


-- ==========================================
-- PASO 5: Políticas RLS
-- ==========================================
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica de galerias" ON public.gallery_images;
DROP POLICY IF EXISTS "Lectura pública de galerías" ON public.gallery_images;
CREATE POLICY "Lectura publica de galerias"
ON public.gallery_images FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Solo duenos gestionan su galeria" ON public.gallery_images;
DROP POLICY IF EXISTS "Solo dueños gestionan su galería" ON public.gallery_images;
CREATE POLICY "Solo duenos gestionan su galeria"
ON public.gallery_images FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b 
    WHERE b.id = card_id 
    AND b.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses b 
    WHERE b.id = card_id 
    AND b.user_id = auth.uid()
  )
);


-- ==========================================
-- PASO 6: Verificación
-- ==========================================
-- Confirmar que el tipo de datos ha cambiado y la FK está apuntando a businesses
SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'gallery_images' AND column_name = 'card_id';

-- ==========================================
-- PLAN DE CONTINGENCIA (Comentado)
-- Si necesitas revertir los datos borrados:
-- INSERT INTO public.gallery_images SELECT * FROM public._backup_gallery_images_20260416 ON CONFLICT DO NOTHING;
-- ==========================================
