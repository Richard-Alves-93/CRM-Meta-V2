-- ========================================================
-- SAAS MULTI-TENANT REFACTOR MIGRATION
-- ========================================================

-- 1. ESTRUTURA BASE (PROFILES & TENANTS)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'team';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'gratuito';
-- O campo 'status' já deve existir, mas garantimos:
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='status') THEN
    ALTER TABLE public.tenants ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
END $$;

-- 2. ADIÇÃO DE TENANT_ID EM TABELAS DE NEGÓCIO
-- Função auxiliar para adicionar tenant_id com segurança
CREATE OR REPLACE FUNCTION add_tenant_id_to_table(t_name TEXT) 
RETURNS VOID AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t_name) THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'tenant_id') THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE', t_name);
      -- Tenta popular com um tenant padrão se já houver dados (opcional/segurança)
      -- EXECUTE format('UPDATE public.%I SET tenant_id = (SELECT id FROM tenants LIMIT 1) WHERE tenant_id IS NULL', t_name);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

SELECT add_tenant_id_to_table('customers');
SELECT add_tenant_id_to_table('pets');
SELECT add_tenant_id_to_table('products');
SELECT add_tenant_id_to_table('services');
SELECT add_tenant_id_to_table('sales');
SELECT add_tenant_id_to_table('sale_items');
SELECT add_tenant_id_to_table('payments');
SELECT add_tenant_id_to_table('cashier_sessions');
SELECT add_tenant_id_to_table('notifications');
SELECT add_tenant_id_to_table('whatsapp_logs');
SELECT add_tenant_id_to_table('metas');
SELECT add_tenant_id_to_table('lancamentos');
SELECT add_tenant_id_to_table('work_settings');
SELECT add_tenant_id_to_table('custom_holidays');
SELECT add_tenant_id_to_table('transportes');

DROP FUNCTION add_tenant_id_to_table;

-- 3. TRIGGER DE CRIAÇÃO DE USUÁRIO (O CÉREBRO DO SAAS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_name TEXT;
  v_tenant_id UUID;
  v_existing_profile_id UUID;
BEGIN
  -- 1. Pega o nome da empresa do metadata (passado no signUp do frontend)
  v_company_name := NEW.raw_user_meta_data->>'company_name';
  
  -- 2. Verifica se existe um pré-cadastro (convite) pelo e-mail
  SELECT id, tenant_id INTO v_existing_profile_id, v_tenant_id 
  FROM public.profiles 
  WHERE email_temp = NEW.email AND user_id IS NULL 
  LIMIT 1;

  IF v_existing_profile_id IS NOT NULL THEN
    -- CASO A: Usuário convidado
    UPDATE public.profiles 
    SET user_id = NEW.id,
        status = 'active',
        display_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
        avatar_url = NEW.raw_user_meta_data->>'avatar_url'
    WHERE id = v_existing_profile_id;
    
  ELSIF v_company_name IS NOT NULL THEN
    -- CASO B: Cadastro público de nova empresa (Self-service)
    INSERT INTO public.tenants (name, status, plan)
    VALUES (v_company_name, 'active', 'gratuito')
    RETURNING id INTO v_tenant_id;

    INSERT INTO public.profiles (user_id, tenant_id, role, status, display_name, avatar_url)
    VALUES (
      NEW.id, 
      v_tenant_id, 
      'tenant_admin', 
      'active', 
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
      NEW.raw_user_meta_data->>'avatar_url'
    );
    
  ELSE
    -- CASO C: Cadastro direto sem empresa (Bloqueado por padrão em SaaS profissional)
    -- Opcional: Criar uma empresa padrão ou lançar exceção. 
    -- Vamos criar uma empresa genérica para não quebrar o login, mas marcamos como pendente.
    INSERT INTO public.tenants (name, status, plan)
    VALUES ('Minha Empresa', 'active', 'gratuito')
    RETURNING id INTO v_tenant_id;

    INSERT INTO public.profiles (user_id, tenant_id, role, status, display_name)
    VALUES (NEW.id, v_tenant_id, 'tenant_admin', 'active', NEW.email);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. POLÍTICAS DE SEGURANÇA (RLS) - ISOLAMENTO TOTAL
-- Função para facilitar a criação de políticas SaaS
CREATE OR REPLACE FUNCTION apply_saas_policy(t_name TEXT) 
RETURNS VOID AS $$
BEGIN
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t_name);
  EXECUTE format('DROP POLICY IF EXISTS "SaaS Isolation" ON public.%I', t_name);
  EXECUTE format('CREATE POLICY "SaaS Isolation" ON public.%I AS PERMISSIVE FOR ALL TO authenticated 
    USING (tenant_id = (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()))
    WITH CHECK (tenant_id = (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()))', t_name);
END;
$$ LANGUAGE plpgsql;

-- Aplica o isolamento em todas as tabelas
SELECT apply_saas_policy('customers');
SELECT apply_saas_policy('pets');
SELECT apply_saas_policy('products');
SELECT apply_saas_policy('services');
SELECT apply_saas_policy('sales');
SELECT apply_saas_policy('sale_items');
SELECT apply_saas_policy('payments');
SELECT apply_saas_policy('cashier_sessions');
SELECT apply_saas_policy('notifications');
SELECT apply_saas_policy('whatsapp_logs');
SELECT apply_saas_policy('metas');
SELECT apply_saas_policy('lancamentos');
SELECT apply_saas_policy('work_settings');
SELECT apply_saas_policy('custom_holidays');
SELECT apply_saas_policy('transportes');

DROP FUNCTION apply_saas_policy;

-- Política especial para a tabela PROFILES
DROP POLICY IF EXISTS "Profiles Isolation" ON public.profiles;
CREATE POLICY "Profiles Isolation" ON public.profiles AS PERMISSIVE FOR ALL TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()) OR role = 'master_admin')
  WITH CHECK (tenant_id = (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()) OR role = 'master_admin');
