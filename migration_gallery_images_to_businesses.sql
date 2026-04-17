-- =====================================================================
-- MIGRACION: gallery_images -> businesses(id)
-- Fecha:     2026-04-16
-- Objetivo:  Desvincular gallery_images de la tabla deprecada `cards`,
--            convertir card_id de TEXT a UUID, y referenciar businesses(id).
-- =====================================================================

-- =====================================================================
-- PASO 0: INSPECCION DE DATOS (ejecutar ANTES de la migracion)
-- Proposito: Identificar registros incompatibles con UUID.
-- =====================================================================

-- 0.1 Detectar valores en card_id que NO son UUID validos
SELECT id, card_id, image_url
  FROM public.gallery_images
 WHERE card_id IS NOT NULL
   AND card_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 0.2 Detectar registros huerfanos (card_id no existe en businesses)
SELECT gi.id, gi.card_id, gi.image_url
  FROM public.gallery_images gi
  LEFT JOIN public.businesses b
    ON b.id::text = gi.card_id
 WHERE b.id IS NULL
   AND gi.card_id IS NOT NULL;

-- 0.3 Conteo general de registros para validacion post-migracion
SELECT COUNT(*) AS total_gallery_images FROM public.gallery_images;


-- =====================================================================
-- PASO 1: RESPALDO DE DATOS (ejecutar ANTES de la migracion)
-- Crea una tabla temporal con los datos actuales como red de seguridad.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public._backup_gallery_images_20260416 AS
  SELECT * FROM public.gallery_images;


-- =====================================================================
-- PASO 2: LIMPIEZA DE REGISTROS INCOMPATIBLES
-- Eliminar filas con card_id nulo, vacio, o que no cumplan formato UUID.
-- Eliminar huerfanos cuyo card_id no exista en businesses.
-- =====================================================================

-- 2.1 Eliminar registros con card_id nulo o vacio
DELETE FROM public.gallery_images
 WHERE card_id IS NULL
    OR card_id = '';

-- 2.2 Eliminar registros cuyo card_id no sea un UUID valido
DELETE FROM public.gallery_images
 WHERE card_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 2.3 Eliminar huerfanos (card_id valido como UUID pero sin business correspondiente)
DELETE FROM public.gallery_images
 WHERE card_id::uuid NOT IN (SELECT id FROM public.businesses);


-- =====================================================================
-- PASO 3: MIGRACION DDL (TRANSACCIONAL)
-- Todas las operaciones estructurales en un unico bloque atomico.
-- =====================================================================

BEGIN;

-- -----------------------------------------------------------------
-- 3.1 DESVINCULACION: eliminar FK obsoleta hacia tabla `cards`
-- -----------------------------------------------------------------
ALTER TABLE public.gallery_images
  DROP CONSTRAINT IF EXISTS gallery_images_card_id_fkey;

-- -----------------------------------------------------------------
-- 3.2 MUTACION DE TIPO: TEXT -> UUID con casting explicito
-- -----------------------------------------------------------------
ALTER TABLE public.gallery_images
  ALTER COLUMN card_id TYPE uuid USING card_id::uuid;

-- -----------------------------------------------------------------
-- 3.3 VINCULACION: nueva FK hacia businesses(id) con CASCADE
-- -----------------------------------------------------------------
ALTER TABLE public.gallery_images
  ADD CONSTRAINT gallery_images_business_id_fkey
    FOREIGN KEY (card_id) REFERENCES public.businesses(id)
    ON DELETE CASCADE;

-- -----------------------------------------------------------------
-- 3.4 INDICE: optimizar consultas por card_id (si no existe)
-- -----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_gallery_images_card_id
  ON public.gallery_images(card_id);

COMMIT;


-- =====================================================================
-- PASO 4: REFACTORIZACION DE RPCs
-- Recrear funciones SECURITY DEFINER con tipado UUID correcto.
-- La logica interna permanece identica; el cambio es estructural.
-- =====================================================================

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
    -- Validar token de edicion contra businesses
    SELECT edit_token INTO v_token
      FROM public.businesses
     WHERE id = p_card_id;

    IF v_token IS NULL OR p_edit_token IS NULL OR v_token <> p_edit_token THEN
        RAISE EXCEPTION 'invalid_edit_token' USING ERRCODE = '28000';
    END IF;

    -- Validar URL de imagen
    IF p_image_url IS NULL OR length(p_image_url) = 0 THEN
        RAISE EXCEPTION 'image_url_required' USING ERRCODE = '22023';
    END IF;

    -- Insertar en gallery_images (card_id ahora es UUID nativo)
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


-- =====================================================================
-- PASO 5: POLITICAS RLS
-- Recrear politicas sobre gallery_images apuntando a businesses.
-- =====================================================================

-- Asegurar que RLS esta habilitado
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- 5.1 Lectura publica
DROP POLICY IF EXISTS "Lectura publica de galerias" ON public.gallery_images;
DROP POLICY IF EXISTS "Lectura pública de galerías" ON public.gallery_images;
CREATE POLICY "Lectura publica de galerias"
  ON public.gallery_images FOR SELECT
  USING (true);

-- 5.2 Gestion por duenos (INSERT, UPDATE, DELETE)
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


-- =====================================================================
-- PASO 6: VERIFICACION POST-MIGRACION (ejecutar para validar)
-- =====================================================================

-- 6.1 Confirmar tipo de columna
SELECT column_name, data_type, udt_name
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name = 'gallery_images'
   AND column_name = 'card_id';

-- 6.2 Confirmar FK activa
SELECT tc.constraint_name, kcu.column_name,
       ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
 WHERE tc.table_name = 'gallery_images'
   AND tc.constraint_type = 'FOREIGN KEY';

-- 6.3 Confirmar conteo de registros (comparar con PASO 0.3)
SELECT COUNT(*) AS total_gallery_images FROM public.gallery_images;

-- 6.4 Confirmar politicas RLS activas
SELECT policyname, cmd, qual
  FROM pg_policies
 WHERE tablename = 'gallery_images';


-- =====================================================================
-- ROLLBACK DE EMERGENCIA (solo si algo sale mal)
-- Restaura desde la tabla de respaldo creada en PASO 1.
-- =====================================================================
-- TRUNCATE public.gallery_images;
-- INSERT INTO public.gallery_images SELECT * FROM public._backup_gallery_images_20260416;
-- ALTER TABLE public.gallery_images ALTER COLUMN card_id TYPE text USING card_id::text;
-- ALTER TABLE public.gallery_images DROP CONSTRAINT IF EXISTS gallery_images_business_id_fkey;
-- DROP INDEX IF EXISTS idx_gallery_images_card_id;


-- =====================================================================
-- LIMPIEZA (ejecutar cuando la migracion este validada en produccion)
-- =====================================================================
-- DROP TABLE IF EXISTS public._backup_gallery_images_20260416;
