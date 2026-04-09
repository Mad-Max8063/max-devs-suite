-- =============================================================================
-- SUITO PLATFORM — Migración: Arquitectura Multi-Tenant Fase A
-- Proyecto: MiSuite / Suito Platform
-- Supabase Project ID: bfsttdiokdqyvwjuvcbp
-- Fecha: 2026-04-08
--
-- Propósito:
--   Establece la capa de super-administración para la plataforma multi-tenant.
--   Incluye:
--     1. Tabla `super_admins` para identificar usuarios con privilegios globales.
--     2. Función helper `is_super_admin` usada en políticas RLS.
--     3. Actualización de la policy RLS de `admin_clients` para permitir acceso
--        tanto al propietario del registro como al super admin.
--     4. Columna `transfer_email` en `admin_clients` para la Fase B (login libre).
--
-- Orden de ejecución: correr este script completo una sola vez en el SQL Editor
-- de Supabase, DESPUÉS de que `admin_clients_migration.sql` haya sido aplicado.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- SECCIÓN 1: Tabla `super_admins`
-- -----------------------------------------------------------------------------
-- Solo ejecutar una vez. Luego insertar el UUID del admin vía Supabase Dashboard:
--   INSERT INTO public.super_admins (user_id) VALUES ('<UUID-del-super-admin>');
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.super_admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);


-- -----------------------------------------------------------------------------
-- SECCIÓN 2: Función `is_super_admin`
-- -----------------------------------------------------------------------------
-- Función helper reutilizable en políticas RLS.
-- SECURITY DEFINER garantiza que la consulta a `super_admins` se ejecute con
-- permisos elevados, sin exponer la tabla directamente a los usuarios finales.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_super_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins WHERE user_id = uid
  );
$$;


-- -----------------------------------------------------------------------------
-- SECCIÓN 3: Actualizar RLS de `admin_clients`
-- -----------------------------------------------------------------------------
-- Reemplaza la policy anterior que solo filtraba por user_id.
-- La nueva policy permite acceso al propietario del registro (auth.uid() = user_id)
-- O al super admin (is_super_admin), habilitando la gestión global de clientes.
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Usuarios autenticados gestionan sus clientes" ON public.admin_clients;

CREATE POLICY "Usuarios autenticados gestionan sus clientes"
ON public.admin_clients FOR ALL
USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()))
WITH CHECK (auth.uid() = user_id OR public.is_super_admin(auth.uid()));


-- -----------------------------------------------------------------------------
-- SECCIÓN 4: Columna `transfer_email` en `admin_clients`
-- -----------------------------------------------------------------------------
-- Email del futuro inquilino que recibirá este registro cuando abra el login
-- libre (Fase B). Queda como TEXT nullable; se poblará durante el flujo de
-- traspaso de tenant en la siguiente fase del producto.
-- -----------------------------------------------------------------------------

ALTER TABLE public.admin_clients
ADD COLUMN IF NOT EXISTS transfer_email TEXT;


-- =============================================================================
-- FIN DEL SCRIPT
-- =============================================================================
