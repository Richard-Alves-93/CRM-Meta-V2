-- ========================================================
-- SAAS SYSTEM PLANS INFRASTRUCTURE
-- ========================================================

-- 1. CRIAÇÃO DA TABELA DE PLANOS
CREATE TABLE IF NOT EXISTS public.system_plans (
    id TEXT PRIMARY KEY, -- ex: 'essencial', 'profissional', 'plus'
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC DEFAULT 0,
    max_users INTEGER DEFAULT 5,
    features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS na tabela de planos
ALTER TABLE public.system_plans ENABLE ROW LEVEL SECURITY;

-- Políticas: Qualquer autenticado pode ver planos (para o seletor), mas só master_admin gerencia.
DROP POLICY IF EXISTS "Allow authenticated read plans" ON public.system_plans;
CREATE POLICY "Allow authenticated read plans" ON public.system_plans
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Master admin manage plans" ON public.system_plans;
CREATE POLICY "Master admin manage plans" ON public.system_plans
    FOR ALL TO authenticated 
    USING ((SELECT role FROM profiles WHERE user_id = auth.uid()) = 'master_admin');

-- 2. POPULA COM PLANOS INICIAIS
INSERT INTO public.system_plans (id, name, price, max_users, description)
VALUES 
    ('gratuito', 'Gratuito', 0.00, 1, 'Plano de degustação limitado.'),
    ('essencial', 'Essencial', 97.00, 5, 'Plano básico para pequenas empresas.'),
    ('profissional', 'Profissional', 197.00, 15, 'Ideal para empresas em crescimento.'),
    ('plus', 'Plus', 297.00, 999, 'Recursos ilimitados e suporte prioritário.')
ON CONFLICT (id) DO NOTHING;

-- 3. VINCULA TENANTS AOS PLANOS FORMALMENTE
-- Se a coluna plan_id ainda for apenas texto bruto, vamos garantir que ela exista.
-- A coluna já foi adicionada no saas_refactor.sql como TEXT.
DO $$ BEGIN
  -- Garante que todos os tenants tenham um plan_id válido antes de criar a FK
  UPDATE public.tenants SET plan_id = 'gratuito' WHERE plan_id IS NULL OR plan_id = '';
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='plan_id') THEN
    ALTER TABLE public.tenants ADD COLUMN plan_id TEXT REFERENCES public.system_plans(id) DEFAULT 'gratuito';
  ELSE
    -- Se já existe, tentamos adicionar a FK se não houver
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name='tenants' AND constraint_type='FOREIGN KEY' AND constraint_name='tenants_plan_id_fkey'
    ) THEN
        -- Remove valores que não existem na system_plans (fallback para gratuito)
        UPDATE public.tenants t 
        SET plan_id = 'gratuito' 
        WHERE NOT EXISTS (SELECT 1 FROM public.system_plans p WHERE p.id = t.plan_id);

        ALTER TABLE public.tenants ADD CONSTRAINT tenants_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.system_plans(id);
    END IF;
  END IF;
END $$;
