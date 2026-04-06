-- Libera a criação de novas empresas no onboarding automático
CREATE POLICY "Permitir auto-cadastro na tabela tenants"
ON tenants FOR INSERT
TO authenticated
WITH CHECK (true);

-- Garante que um usuário possa atualizar o seu PRÓPRIO registro para amarrar o tenant_id
CREATE POLICY "Permitir atualização do proprio perfil no onboarding"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
