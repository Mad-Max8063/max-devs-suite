-- Script de migración para el CRM de Suito (Admin Clients)
-- Ejecutar este script en el SQL Editor de Supabase (https://bfsttdiokdqyvwjuvcbp.supabase.co)

-- 1. Crear tabla admin_clients
CREATE TABLE IF NOT EXISTS public.admin_clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    business TEXT,
    whatsapp TEXT,
    email TEXT,
    slug TEXT,
    plan TEXT DEFAULT 'tarjeta', -- tarjeta | turnos | combo
    status TEXT DEFAULT 'active',
    is_premium BOOLEAN DEFAULT false,
    card_id TEXT,
    notes TEXT,
    free_until DATE,
    paid_until DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.admin_clients ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas de seguridad
-- Solo el dueño autenticado puede gestionar sus propios clientes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'admin_clients' AND policyname = 'Usuarios autenticados gestionan sus clientes'
    ) THEN
        CREATE POLICY "Usuarios autenticados gestionan sus clientes"
        ON public.admin_clients FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_admin_clients_user_id ON public.admin_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_clients_slug ON public.admin_clients(slug);
