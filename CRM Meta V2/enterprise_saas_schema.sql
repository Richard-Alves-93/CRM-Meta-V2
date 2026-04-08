-- 1. TABELA DE PLANOS DE ASSINATURA
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    features JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir os 3 planos base obrigatórios
INSERT INTO public.plans (name, price, features) VALUES
('Free Trial', 0.00, '{"max_users": 1, "analytics": false}'::jsonb),
('Plano Básico', 47.00, '{"max_users": 3, "analytics": false}'::jsonb),
('Plano Pro', 97.00, '{"max_users": 10, "analytics": true}'::jsonb)
ON CONFLICT DO NOTHING;

-- 2. TABELA DE ASSINATURAS E STATUS FINANCEIRO (SUBSCRIPTIONS)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.plans(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'canceled')),
    payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'overdue', 'pending')),
    next_billing_date TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '30 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE AUDITORIAS GLOBAIS (LOGS)
CREATE TABLE IF NOT EXISTS public.logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar segurança contra acesso não autorizado
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Regras: O sistema (usuários autenticados) pode ler os planos, mas só o sistema/master edita.
CREATE POLICY "Permitir leitura de planos a todos" ON public.plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir leitura de assinaturas de sua empresa" ON public.subscriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir gravação de assinaturas (auto-onboarding)" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Permitir leitura de logs ao Master" ON public.logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir gravacao de logs ao sistema" ON public.logs FOR INSERT TO authenticated WITH CHECK (true);
