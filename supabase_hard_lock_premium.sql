-- ==============================================================================
-- PRODUCT LAB: HARD-LOCK DE FUNCIONALIDADES PREMIUM
-- ==============================================================================
-- Objetivo: Evitar modificaciones de foto de perfil (foto_url) y portada (cover_url)
-- a nivel de base de datos si el usuario no tiene plan Premium activo.
-- ==============================================================================

-- 1. Crear función que actúa como Trigger para la tabla Businesses
CREATE OR REPLACE FUNCTION public.fn_enforce_premium_features()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. PREVENCIÓN DE ESCALADA DE PRIVILEGIOS
    -- Evitar que un usuario intente autootorgarse Premium
    IF (NEW.is_premium IS DISTINCT FROM OLD.is_premium OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status) THEN
        -- Si la petición viene de un usuario autenticado (no de un proceso interno/service_role)
        IF auth.uid() IS NOT NULL THEN
            -- Y no es un super admin (usando la función existente is_super_admin)
            IF NOT public.is_super_admin(auth.uid()) THEN
                RAISE EXCEPTION 'UNAUTHORIZED: Solo los administradores pueden modificar el estado de la suscripción.' USING ERRCODE = '42501';
            END IF;
        END IF;
    END IF;

    -- 2. HARD-LOCK DE FUNCIONALIDADES
    -- Verificar si se está intentando cambiar la foto de perfil o portada
    IF (NEW.foto_url IS DISTINCT FROM OLD.foto_url OR NEW.cover_url IS DISTINCT FROM OLD.cover_url) THEN
        -- Usar OLD para evaluar el estado real actual del usuario, evitando payloads engañosos
        IF (OLD.is_premium = false AND (OLD.subscription_status IS NULL OR OLD.subscription_status != 'active')) THEN
            RAISE EXCEPTION 'PREMIUM_REQUIRED: Se requiere plan Premium para modificar foto o portada de la tarjeta.' USING ERRCODE = '28000';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- 2. Eliminar trigger anterior si existe y crear el nuevo
DROP TRIGGER IF EXISTS trg_enforce_premium_features ON public.businesses;
CREATE TRIGGER trg_enforce_premium_features
BEFORE UPDATE ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.fn_enforce_premium_features();

-- ==============================================================================
-- 3. HARD-LOCK PARA LA GALERÍA DE IMÁGENES
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.fn_enforce_premium_gallery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.businesses 
        WHERE id = NEW.card_id AND (is_premium = true OR subscription_status = 'active')
    ) THEN
        RAISE EXCEPTION 'PREMIUM_REQUIRED: Se requiere plan Premium para usar la galería de imágenes.' USING ERRCODE = '28000';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_premium_gallery ON public.gallery_images;
CREATE TRIGGER trg_enforce_premium_gallery
BEFORE INSERT OR UPDATE ON public.gallery_images
FOR EACH ROW
EXECUTE FUNCTION public.fn_enforce_premium_gallery();
