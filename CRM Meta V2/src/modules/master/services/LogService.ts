import { supabase } from "@/integrations/supabase/client";

export interface SystemLog {
  action: string;
  entity: string;
  details?: any;
}

export const logSystemAction = async (log: SystemLog) => {
  try {
    console.log('[SystemLog]', log);
    // Armazena no Supabase se houver tabela para isso, 
    // ou apenas mantém o log para auditoria futura.
    const { error } = await supabase
      .from('system_logs')
      .insert({
        action: log.action,
        entity: log.entity,
        details: log.details
      });

    if (error) {
      // Se a tabela não existir, apenas logamos no console para não quebrar o sistema
      console.warn('[SystemLog] Tabela system_logs não encontrada ou erro ao inserir.');
    }
  } catch (err) {
    console.error('[SystemLog] Erro ao registrar log:', err);
  }
};
