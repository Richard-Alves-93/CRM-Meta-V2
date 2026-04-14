-- 1. Garante que as colunas existam em profiles e customers
DO $$
BEGIN
    -- Profiles: tenant_id e role
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'tenant_id') THEN
        ALTER TABLE profiles ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'atendente';
    END IF;

    -- Customers: endereco
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'endereco') THEN
        ALTER TABLE customers ADD COLUMN endereco TEXT DEFAULT NULL;
    END IF;
END $$;

-- 2. Tabela de Transportes
-- Como a tabela pode já ter sido criada no passado SEM a coluna tenant_id, vamos garantir:
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'transportes') THEN
        CREATE TABLE transportes (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
          venda_id UUID REFERENCES lancamentos(id) ON DELETE CASCADE,
          tipo TEXT CHECK (tipo IN ('BUSCA', 'ENTREGA')),
          data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
          motorista_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
          endereco_transporte TEXT,
          status TEXT CHECK (status IN ('AGUARDANDO', 'A_CAMINHO', 'REAGENDADO', 'CONCLUIDO', 'CANCELADO')) DEFAULT 'AGUARDANDO',
          observacoes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    ELSE
        -- Se a tabela existir mas não tiver as colunas novas, a gente adiciona!
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transportes' AND column_name = 'tenant_id') THEN
            ALTER TABLE transportes ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Habilita RLS
ALTER TABLE transportes ENABLE ROW LEVEL SECURITY;

-- Limpa as políticas que podem estar incorretas
DROP POLICY IF EXISTS "Visão Isolada por Tenant" ON transportes;
DROP POLICY IF EXISTS "Permissao de Cadastro de Transporte" ON transportes;
DROP POLICY IF EXISTS "Motorista atualiza status e Empresa gerencia" ON transportes;

-- Cria novamente com as regras de Tenant seguras
CREATE POLICY "Visão Isolada por Tenant" ON transportes FOR SELECT 
USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1) 
  AND 
  (
    motorista_id = auth.uid() 
    OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'atendente'))
  )
);

CREATE POLICY "Permissao de Cadastro de Transporte" ON transportes FOR INSERT
WITH CHECK (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1)
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'atendente'))
);

CREATE POLICY "Motorista atualiza status e Empresa gerencia" ON transportes FOR UPDATE
USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1))
WITH CHECK (
  (motorista_id = auth.uid()) OR (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'atendente')))
);
