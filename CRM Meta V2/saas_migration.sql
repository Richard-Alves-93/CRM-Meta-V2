-- ======================================================
-- SAAS MULTI-TENANCY MIGRATION
-- Project: CRM Meta V2
-- ======================================================

-- 1. TENANTS TABLE (Empresas Clientes)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE, -- Ex: petshop-do-richard
    plan TEXT DEFAULT 'free', -- free, pro, master
    status TEXT DEFAULT 'active', -- active, suspended, trial
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. UPDATE PROFILES 
-- Adiciona tenant_id e role (master_admin, tenant_admin, user)
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id),
    ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 3. ADD TENANT_ID TO DATA TABLES
-- Clientes
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
-- Pets
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
-- Produtos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
-- Recompras
ALTER TABLE public.pet_purchases ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
-- Metas
ALTER TABLE public.metas ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
-- Lançamentos
ALTER TABLE public.lancamentos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- 4. UTILITY FUNCTION (Para pegar o tenant do usuário atual)
CREATE OR REPLACE FUNCTION public.get_auth_tenant()
RETURNS UUID AS $$
    SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 5. UPGRADE RLS POLICIES (ISOLAMENTO REAL)
-- Agora a regra não é mais user_id = auth.uid(), mas sim tenant_id = tenant_do_usuario()

-- Exemplo para Customers:
DROP POLICY IF EXISTS "Users can manage their own customers" ON public.customers;
CREATE POLICY "Tenants can manage their own customers" 
ON public.customers FOR ALL 
USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'master_admin'
);

-- Repetir para outras tabelas conforme necessário...

-- 6. SETTING UP MASTER ADMIN (VOCÊ)
-- Nota: Esta parte requer que você já tenha se cadastrado via e-mail 'adm@crm.com.br'
-- para podermos associar o papel de 'master_admin' ao seu registro.
