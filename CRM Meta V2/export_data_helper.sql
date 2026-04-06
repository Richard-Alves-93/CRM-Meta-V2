-- ======================================================
-- SCRIPT DE EXPORTAÇÃO DE DADOS (RODAR NO BANCO ANTIGO)
-- Projeto Antigo: apdaqtetajxzpaofdgvu
-- ======================================================

-- 1. IDENTIFICAÇÃO: 
-- Substitua 'SEU_NOVO_ID_AQUI' pelo ID que você obteve no novo projeto.
DO $$
DECLARE
    v_novo_user_id UUID := 'SEU_NOVO_ID_AQUI'::UUID; 
BEGIN
    RAISE NOTICE 'Gerando dados para o novo usuário: %', v_novo_user_id;
END $$;

-- 2. CLIENTES (CUSTOMERS)
-- Rode esta query e exporte o resultado como SQL Insert se possível, 
-- ou apenas copie os valores se forem poucos.
SELECT 
    'INSERT INTO public.customers (id, user_id, nome, telefone, whatsapp, email, observacoes, ativo) VALUES (' ||
    quote_literal(id) || ', ' || 
    quote_literal('SEU_NOVO_ID_AQUI') || ', ' || 
    quote_literal(nome) || ', ' || 
    COALESCE(quote_literal(telefone), 'NULL') || ', ' || 
    COALESCE(quote_literal(whatsapp), 'NULL') || ', ' || 
    COALESCE(quote_literal(email), 'NULL') || ', ' || 
    COALESCE(quote_literal(observacoes), 'NULL') || ', ' || 
    ativo || ');' as sql_insert
FROM public.customers;

-- 3. PETS
SELECT 
    'INSERT INTO public.pets (id, user_id, customer_id, nome, especie, raca, data_aniversario, sexo, porte, peso, ativo) VALUES (' ||
    quote_literal(id) || ', ' || 
    quote_literal('SEU_NOVO_ID_AQUI') || ', ' || 
    quote_literal(customer_id) || ', ' || 
    quote_literal(nome) || ', ' || 
    COALESCE(quote_literal(especie), 'NULL') || ', ' || 
    COALESCE(quote_literal(raca), 'NULL') || ', ' || 
    COALESCE(quote_literal(data_aniversario), 'NULL') || ', ' || 
    COALESCE(quote_literal(sexo), 'NULL') || ', ' || 
    COALESCE(quote_literal(porte), 'NULL') || ', ' || 
    COALESCE(peso::text, 'NULL') || ', ' || 
    ativo || ');' as sql_insert
FROM public.pets;

-- 4. PRODUTOS (PRODUCTS)
SELECT 
    'INSERT INTO public.products (id, user_id, nome, categoria, prazo_recompra_dias, dias_aviso_previo, mensagem_padrao, ativo) VALUES (' ||
    quote_literal(id) || ', ' || 
    quote_literal('SEU_NOVO_ID_AQUI') || ', ' || 
    quote_literal(nome) || ', ' || 
    COALESCE(quote_literal(categoria), 'NULL') || ', ' || 
    prazo_recompra_dias || ', ' || 
    dias_aviso_previo || ', ' || 
    COALESCE(quote_literal(mensagem_padrao), 'NULL') || ', ' || 
    ativo || ');' as sql_insert
FROM public.products;

-- 5. RECOMPRAS (PET_PURCHASES)
SELECT 
    'INSERT INTO public.pet_purchases (id, user_id, pet_id, product_id, data_compra, dias_recompra, proxima_data, dias_aviso_previo, data_lembrete, status, purchase_history_id, ativo) VALUES (' ||
    quote_literal(id) || ', ' || 
    quote_literal('SEU_NOVO_ID_AQUI') || ', ' || 
    quote_literal(pet_id) || ', ' || 
    quote_literal(product_id) || ', ' || 
    quote_literal(data_compra) || ', ' || 
    dias_recompra || ', ' || 
    quote_literal(proxima_data) || ', ' || 
    dias_aviso_previo || ', ' || 
    quote_literal(data_lembrete) || ', ' || 
    quote_literal(status) || ', ' || 
    COALESCE(quote_literal(purchase_history_id), 'NULL') || ', ' || 
    ativo || ');' as sql_insert
FROM public.pet_purchases;

-- 6. METAS
SELECT 
    'INSERT INTO public.metas (id, user_id, nome, valor, descricao, created_at) VALUES (' ||
    quote_literal(id) || ', ' || 
    quote_literal('SEU_NOVO_ID_AQUI') || ', ' || 
    quote_literal(nome) || ', ' || 
    valor || ', ' || 
    quote_literal(descricao) || ', ' || 
    quote_literal(created_at) || ');' as sql_insert
FROM public.metas;

-- 7. LANÇAMENTOS
SELECT 
    'INSERT INTO public.lancamentos (id, user_id, data, valor_bruto, desconto, created_at) VALUES (' ||
    quote_literal(id) || ', ' || 
    quote_literal('SEU_NOVO_ID_AQUI') || ', ' || 
    quote_literal(data) || ', ' || 
    valor_bruto || ', ' || 
    desconto || ', ' || 
    quote_literal(created_at) || ');' as sql_insert
FROM public.lancamentos;
