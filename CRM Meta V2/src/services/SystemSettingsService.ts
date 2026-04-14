import { supabase } from "@/integrations/supabase/client";

export interface SystemSettings {
  id?: string;
  logo_light_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  login_logo_url: string | null;
  primary_color: string | null;
  updated_at?: string;
}

export const SystemSettingsService = {
  async getSettings(): Promise<SystemSettings | null> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Erro ao buscar configurações globais:', error);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error('Falha ao obter configurações do sistema:', err);
      return null;
    }
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<boolean> {
    try {
      // First, check if a row exists
      const current = await this.getSettings();
      
      if (!current) {
        const { error } = await supabase
          .from('system_settings')
          .insert([settings]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('system_settings')
          .update(settings)
          .eq('id', current.id);
        if (error) throw error;
      }
      
      return true;
    } catch (err) {
      console.error('Erro ao salvar configurações do sistema:', err);
      return false;
    }
  }
};
