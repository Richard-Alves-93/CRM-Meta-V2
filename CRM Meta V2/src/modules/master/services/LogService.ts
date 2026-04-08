import { supabase } from "@/integrations/supabase/client";
import { getAuthUserId } from "@/services/authService";

export interface SystemLog {
  action: string;
  entity: string;
  details?: Record<string, any>;
}

export const logSystemAction = async ({ action, entity, details = {} }: SystemLog) => {
  try {
    const userId = await getAuthUserId();
    
    // Sempre tenta registrar a ação assincronamente (Fire and Forget)
    await supabase.from('logs').insert({
      user_id: userId,
      action,
      entity,
      details
    });
    
    console.log(`[LogService] Ação Registrada: ${action} em ${entity}`);
  } catch (error) {
    console.error("[LogService] Falha ao gravar auditoria silênciosa:", error);
  }
};
