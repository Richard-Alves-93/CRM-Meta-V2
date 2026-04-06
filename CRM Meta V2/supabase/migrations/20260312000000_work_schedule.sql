-- Create work_settings table for user work schedules
CREATE TABLE IF NOT EXISTS public.work_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  work_mode TEXT NOT NULL DEFAULT 'Segunda-sexta',
  -- work_mode options: 'Segunda-sexta', 'Segunda-sabado', 'Todos os dias', 'Personalizado'
  custom_schedule_json JSONB,
  -- For 'Personalizado' mode: {"Monday": true, "Tuesday": true, ...}
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.work_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own work_settings" ON public.work_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own work_settings" ON public.work_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own work_settings" ON public.work_settings FOR UPDATE USING (auth.uid() = user_id);

-- Create custom_holidays table for manual holiday management
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
