-- ==============================================================================
-- FIX: Elevar usuario a Super Admin — Resolver 403 en Panel Admin
-- ==============================================================================
-- IDEMPOTENTE: ON CONFLICT DO NOTHING, seguro para ejecución repetida.
-- EJECUTAR EN: Supabase SQL Editor → Copy/Paste → Run
-- ==============================================================================

-- PASO 1: Insertar al operador como Super Admin
INSERT INTO public.super_admins (user_id)
VALUES ('1aca93a8-6f2e-4801-bb0a-d8167e7e190c')
ON CONFLICT (user_id) DO NOTHING;

-- PASO 2: Verificar que la inserción fue exitosa
SELECT 
    sa.user_id,
    public.is_super_admin(sa.user_id) AS es_admin
FROM public.super_admins sa
WHERE sa.user_id = '1aca93a8-6f2e-4801-bb0a-d8167e7e190c';

-- Resultado esperado:
-- | user_id                              | es_admin |
-- | 1aca93a8-6f2e-4801-bb0a-d8167e7e190c | true     |
