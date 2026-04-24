-- ==============================================================================
-- SUITO MONETIZATION TABLES (MERCADO PAGO INTEGRATION)
-- ==============================================================================

-- 1. EXTENSIÓN DE LA TABLA USERS (O BUSINESSES)
-- Nota: En Suito, el 'Business' es lo que monetiza.
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS mp_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_type TEXT CHECK (subscription_type IN ('free', 'one_time', 'subscription')) DEFAULT 'free';

-- 2. TABLA DE PAGOS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id),
    mp_payment_id TEXT UNIQUE NOT NULL,
    amount NUMERIC NOT NULL,
    currency_id TEXT DEFAULT 'ARS',
    status TEXT NOT NULL, -- approved, pending, rejected
    payment_type TEXT NOT NULL, -- single, subscription_fee
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABLA DE SUSCRIPCIONES (PRE-APPROVALS)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id),
    mp_preapproval_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL, -- authorized, paused, cancelled
    reason TEXT,
    next_billing_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. HABILITAR RLS PARA QUE EL DUEÑO VEA SUS PAGOS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dueños ven sus propios pagos" 
ON public.payments FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.businesses WHERE id = business_id));

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dueños ven sus propias suscripciones" 
ON public.subscriptions FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.businesses WHERE id = business_id));

-- 5. TRIGGER PARA ACTUALIZAR SUBSCRIPTION_STATUS AUTOMÁTICAMENTE
-- (Opcional, la lógica principal reside en el Webhook de FastAPI)
