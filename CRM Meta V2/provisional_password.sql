-- ========================================================
-- PROVISIONARY PASSWORD & ADMIN USER CREATION
-- ========================================================

-- 1. ADICIONA COLUNA DE CONTROLE DE TROCA DE SENHA
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- 2. FUNÇÃO SQL PARA CRIAÇÃO DE USUÁRIO VIA ADMIN (BYPASS SUPABASE AUTH RPC)
-- Esta função permite que um Admin crie um usuário com senha definida sem precisar deslogar do sistema.
-- Ela insere diretamente na tabela auth.users e previne conflitos.

CREATE OR REPLACE FUNCTION public.create_user_admin(
  p_email TEXT,
  p_password TEXT,
  p_display_name TEXT,
  p_role TEXT,
  p_tenant_id UUID,
  p_must_change BOOLEAN DEFAULT TRUE
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 1. Verifica se o usuário já existe no auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

  IF v_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'Um usuário com este e-mail já existe no sistema.';
  END IF;

  -- 2. Insere no auth.users (Tabela gerenciada pelo Supabase)
  -- Nota: Usamos crypt para gerar o hash da senha padrão do Supabase (Blowfish)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_sent_at,
    is_super_admin,
    confirmed_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    NULL,
    NULL,
    '{"provider":"email","providers":["email"]}',
    format('{"full_name":"%s"}', p_display_name)::jsonb,
    now(),
    now(),
    '',
    '',
    NULL,
    FALSE,
    now()
  )
  RETURNING id INTO v_user_id;

  -- 3. Insere a identidade (Necessário para o Supabase reconhecer o método de login)
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    v_user_id,
    format('{"sub":"%s","email":"%s"}', v_user_id, p_email)::jsonb,
    'email',
    NULL,
    now(),
    now()
  );

  -- 4. Cria o perfil na nossa tabela interna via link (O trigger handle_new_user cuidará do resto se configurado, 
  -- mas aqui forçamos os valores corretos de SaaS)
  -- Se o trigger handle_new_user já existir, ele criará um perfil. Vamos atualizar este perfil.
  
  -- Pequeno delay ou verificação para garantir que o trigger executou
  -- Caso o trigger não exista ou falhe, garantimos o perfil aqui:
  INSERT INTO public.profiles (user_id, tenant_id, role, status, display_name, must_change_password)
  VALUES (v_user_id, p_tenant_id, p_role, 'active', p_display_name, p_must_change)
  ON CONFLICT (user_id) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    display_name = EXCLUDED.display_name,
    must_change_password = EXCLUDED.must_change_password;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;
