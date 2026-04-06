-- 1. Customers Table (Clientes)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL, -- To isolate data per user/tenant
    nome TEXT NOT NULL,
    telefone TEXT,
    whatsapp TEXT,
    email TEXT,
    observacoes TEXT
);

-- 2. Pets Table (Pets vinculados a clientes)
CREATE TABLE IF NOT EXISTS public.pets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    especie TEXT,
    raca TEXT,
    data_aniversario DATE,
    sexo TEXT,
    porte TEXT,
    peso NUMERIC
);

-- 3. Products Table (Produtos recorrentes de Petshop)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL,
    nome TEXT NOT NULL,
    categoria TEXT,
    prazo_recompra_dias INTEGER NOT NULL DEFAULT 30,
    dias_aviso_previo INTEGER NOT NULL DEFAULT 3,
    mensagem_padrao TEXT
);

-- 4. Pet Purchases Table (Ciclos de recompra)
CREATE TABLE IF NOT EXISTS public.pet_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL,
    pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    data_compra DATE NOT NULL,
    dias_recompra INTEGER NOT NULL,
    proxima_data DATE NOT NULL,
    dias_aviso_previo INTEGER NOT NULL,
    data_lembrete DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Ativo', -- 'Ativo', 'Avisar em breve', 'Avisar hoje', 'Notificado', 'Recompra registrada', 'Trocado', 'Vencido', 'Cancelado'
    purchase_history_id UUID REFERENCES public.pet_purchases(id) ON DELETE SET NULL -- Para histórico de trocas/renovações
);

-- 5. Notifications Table (Logs de quando avisos deveriam ser/foram enviados)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL,
    purchase_id UUID NOT NULL REFERENCES public.pet_purchases(id) ON DELETE CASCADE,
    data TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo TEXT NOT NULL,
    status TEXT NOT NULL
);

-- 6. WhatsApp Logs Table (Logs reais de envio)
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL,
    purchase_id UUID REFERENCES public.pet_purchases(id) ON DELETE SET NULL,
    telefone TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    data_envio TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) Policies
-- Ative o RLS para todas as tabelas e crie politicas para que o user_id == auth.uid()
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Note: The policies themselves should be created via the Supabase UI or using similar statements:
-- CREATE POLICY "Users can manage their own customers" ON public.customers FOR ALL USING (auth.uid() = user_id);
