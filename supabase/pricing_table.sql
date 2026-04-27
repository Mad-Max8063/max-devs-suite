-- ============================================
-- pricing_table.sql — Tabla de precios dinámicos para Suito
-- ============================================
-- Ejecutar en Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- Idempotente: se puede ejecutar múltiples veces sin romper nada.

-- 1. Crear tabla
CREATE TABLE IF NOT EXISTS public.pricing (
    id          TEXT PRIMARY KEY,          -- slug: 'tarjeta', 'turnos', 'combo'
    monthly     NUMERIC NOT NULL,          -- precio mensual en ARS
    quarterly   NUMERIC NOT NULL,          -- precio trimestral en ARS
    updated_at  TIMESTAMPTZ DEFAULT NOW()  -- última actualización
);

-- 2. Seed con valores actuales (no sobreescribe si ya existen)
INSERT INTO public.pricing (id, monthly, quarterly) VALUES
    ('tarjeta', 4900,  12500),
    ('turnos',  9900,  25000),
    ('combo',   12900, 33000)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS: lectura pública, escritura solo para usuarios autenticados
ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.pricing TO anon, authenticated;
GRANT UPDATE ON public.pricing TO authenticated;

DROP POLICY IF EXISTS "pricing_read_all" ON public.pricing;
CREATE POLICY "pricing_read_all" ON public.pricing
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "pricing_update_auth" ON public.pricing;
DROP POLICY IF EXISTS "pricing_update_super_admin" ON public.pricing;
CREATE POLICY "pricing_update_super_admin" ON public.pricing
    FOR UPDATE
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));

-- 4. Trigger para auto-actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_pricing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pricing_updated_at ON public.pricing;
CREATE TRIGGER trg_pricing_updated_at
    BEFORE UPDATE ON public.pricing
    FOR EACH ROW
    EXECUTE FUNCTION public.update_pricing_timestamp();
