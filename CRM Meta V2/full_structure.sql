-- ==========================================
-- FULL DATABASE STRUCTURE MIGRATION
-- Project: CRM Meta V2
-- New URL: https://ojbyabjhuhzwijnborga.supabase.co
-- ==========================================

-- 1. PROFILES TABLE & AUTH TRIGGERS
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- 2. CUSTOMERS (CLIENTES)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL,
    nome TEXT NOT NULL,
    telefone TEXT,
    whatsapp TEXT,
    email TEXT,
    observacoes TEXT,
    ativo boolean NOT NULL DEFAULT true
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own customers" ON public.customers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. PETS 
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
    peso NUMERIC,
    ativo boolean NOT NULL DEFAULT true
);

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own pets" ON public.pets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. PRODUCTS (PRODUTOS)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL,
    nome TEXT NOT NULL,
    categoria TEXT,
    prazo_recompra_dias INTEGER NOT NULL DEFAULT 30,
    dias_aviso_previo INTEGER NOT NULL DEFAULT 3,
    mensagem_padrao TEXT,
    ativo boolean NOT NULL DEFAULT true
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own products" ON public.products FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. PET PURCHASES (RECOMPRAS)
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
    status TEXT NOT NULL DEFAULT 'Ativo',
    purchase_history_id UUID REFERENCES public.pet_purchases(id) ON DELETE SET NULL,
    ativo boolean NOT NULL DEFAULT true
);

ALTER TABLE public.pet_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own pet_purchases" ON public.pet_purchases FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. NOTIFICATIONS & WHATSAPP LOGS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL,
    purchase_id UUID NOT NULL REFERENCES public.pet_purchases(id) ON DELETE CASCADE,
    data TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo TEXT NOT NULL,
    status TEXT NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL,
    purchase_id UUID REFERENCES public.pet_purchases(id) ON DELETE SET NULL,
    telefone TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    data_envio TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own whatsapp_logs" ON public.whatsapp_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. METAS & LANÇAMENTOS (FINANCEIRO)
CREATE TABLE IF NOT EXISTS public.metas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  descricao TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own metas" ON public.metas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own metas" ON public.metas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own metas" ON public.metas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own metas" ON public.metas FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.lancamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  valor_bruto NUMERIC NOT NULL,
  desconto NUMERIC NOT NULL DEFAULT 0,
  valor_liquido NUMERIC GENERATED ALWAYS AS (valor_bruto - desconto) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own lancamentos" ON public.lancamentos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own lancamentos" ON public.lancamentos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own lancamentos" ON public.lancamentos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own lancamentos" ON public.lancamentos FOR DELETE USING (auth.uid() = user_id);

-- 8. WORK SETTINGS & HOLIDAYS
CREATE TABLE IF NOT EXISTS public.work_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  work_mode TEXT NOT NULL DEFAULT 'Segunda-sexta',
  custom_schedule_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.work_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own work_settings" ON public.work_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own work_settings" ON public.work_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own work_settings" ON public.work_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.custom_holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, data)
);

ALTER TABLE public.custom_holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own custom_holidays" ON public.custom_holidays FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own custom_holidays" ON public.custom_holidays FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own custom_holidays" ON public.custom_holidays FOR DELETE USING (auth.uid() = user_id);
