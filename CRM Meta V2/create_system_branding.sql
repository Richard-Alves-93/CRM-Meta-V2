-- 1. TABELA DE CONFIGURAÇÕES GLOBAIS DO SISTEMA (BRANDING)
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logo_light_url TEXT,
    logo_dark_url TEXT,
    favicon_url TEXT,
    login_logo_url TEXT,
    login_bg_url TEXT,
    primary_color TEXT DEFAULT '#3b82f6',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. INSERIR REGISTRO ÚNICO INICIAL
-- Garante que o sistema sempre tenha uma linha de configuração para consultar
INSERT INTO public.system_settings (logo_light_url) 
SELECT '/logo-full.png' 
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings);

-- 3. SEGURANÇA (RLS)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário (mesmo não logado, para o Login) pode ler as configurações
DROP POLICY IF EXISTS "Permitir leitura global das configurações" ON public.system_settings;
CREATE POLICY "Permitir leitura global das configurações" ON public.system_settings FOR SELECT USING (true);

-- Apenas o Master Admin pode modificar as configurações
DROP POLICY IF EXISTS "Apenas Master pode editar configurações" ON public.system_settings;
CREATE POLICY "Apenas Master pode editar configurações" ON public.system_settings FOR ALL 
USING (
    (SELECT (raw_user_meta_data->>'role') FROM auth.users WHERE id = auth.uid()) = 'master_admin'
    OR (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'master_admin'
);
