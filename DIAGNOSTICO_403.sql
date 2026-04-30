-- =============================================================================
-- DIAGNOSTICO COMPLETO: 403 en UPDATE businesses
-- =============================================================================
-- Ejecutar en Supabase SQL Editor y pegar los resultados.
-- =============================================================================

-- 1) Permisos de EXECUTE sobre is_super_admin
SELECT
    'authenticated' AS role,
    has_function_privilege('authenticated', 'public.is_super_admin(uuid)', 'EXECUTE') AS puede_ejecutar
UNION ALL
SELECT
    'anon',
    has_function_privilege('anon', 'public.is_super_admin(uuid)', 'EXECUTE');

-- 2) Contenido de super_admins
SELECT * FROM public.super_admins;

-- 3) Verificar is_super_admin para el admin
SELECT public.is_super_admin('1aca93a8-6f2e-4801-bb0a-d8167e7e190c') AS es_super_admin;

-- 4) Triggers activos sobre businesses
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'businesses'
  AND event_object_schema = 'public';

-- 5) Policies activas sobre businesses
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'businesses'
  AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 6) GRANTs sobre la tabla businesses
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'businesses'
  AND table_schema = 'public';
