-- 1. BUSCAR O USER_ID E ATUALIZAR O CARGO
UPDATE public.profiles 
SET role = 'master_admin'
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'crmdominus@gmail.com'
);

-- 2. VERIFICAR SE DEU CERTO:
SELECT p.user_id, u.email, p.role 
FROM public.profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'crmdominus@gmail.com';
