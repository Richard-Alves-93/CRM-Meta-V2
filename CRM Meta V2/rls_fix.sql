-- ========================================================
-- RLS RECURSION FIX (POLÍTICAS DE SEGURANÇA)
-- ========================================================

-- 1. Funções auxiliares para quebrar a recursão
-- SECURITY DEFINER faz a função rodar com privilégios de dono, pulando o RLS dela mesma.

CREATE OR REPLACE FUNCTION get_auth_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_auth_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 2. Recriar a política da tabela PROFILES usando as funções
DROP POLICY IF EXISTS "Profiles Isolation" ON public.profiles;
DROP POLICY IF EXISTS "SaaS Isolation" ON public.profiles;

CREATE POLICY "Profiles Isolation" ON public.profiles
AS PERMISSIVE FOR ALL TO authenticated
USING (
  user_id = auth.uid() OR                    -- Pode ver o próprio perfil
  tenant_id = get_auth_tenant_id() OR        -- Pode ver perfis da mesma empresa
  get_auth_role() = 'master_admin'           -- Master Admin vê tudo
)
WITH CHECK (
  user_id = auth.uid() OR 
  tenant_id = get_auth_tenant_id() OR 
  get_auth_role() = 'master_admin'
);

-- 3. Otimizar a política dos TENANTS (Evitar que master se bloqueie)
DROP POLICY IF EXISTS "Tenants Isolation" ON public.tenants;
CREATE POLICY "Tenants Isolation" ON public.tenants
AS PERMISSIVE FOR ALL TO authenticated
USING (
  id = get_auth_tenant_id() OR 
  get_auth_role() = 'master_admin'
);
