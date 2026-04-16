-- supabase_suito_businesses_rls_patch.sql
-- Patch RLS para public.businesses — bypass super-admin en UPDATE y DELETE.
-- Pre-requisito: public.is_super_admin(uid UUID) (definida en suito_super_admin_migration.sql).
-- Idempotente: se puede ejecutar multiples veces sin efectos colaterales.

-- 1. UPDATE: dueno OR super-admin
DROP POLICY IF EXISTS "Solo dueños editan su negocio" ON public.businesses;
DROP POLICY IF EXISTS "businesses_update_owner_or_super_admin" ON public.businesses;
CREATE POLICY "businesses_update_owner_or_super_admin"
ON public.businesses FOR UPDATE
USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()))
WITH CHECK (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

-- 2. DELETE: dueno OR super-admin (no existia politica previa)
DROP POLICY IF EXISTS "businesses_delete_owner_or_super_admin" ON public.businesses;
CREATE POLICY "businesses_delete_owner_or_super_admin"
ON public.businesses FOR DELETE
USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
