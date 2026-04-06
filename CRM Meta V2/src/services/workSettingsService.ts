/**
 * ETAPA 9: Work Settings Service
 * Handles work schedule, holidays, and working days calculations
 */

import { supabase } from "@/integrations/supabase/client";
import type { WorkSettings, CustomHoliday, WorkMode } from "@/lib/types";

export const defaultJornada = {
  modo: "Segunda-sexta",
  diasSelecionados: [1, 2, 3, 4, 5], // 1=Mon, 2=Tue... 5=Fri
  usarFeriados: true // Padrao para calcular descontando feriados
};

export function carregarJornada() {
  try {
    const data = localStorage.getItem("jornada_trabalho");
    if (!data) return defaultJornada;
    
    const parsed = JSON.parse(data);

    return {
      modo: parsed.modo || "Segunda-sexta",
      diasSelecionados: Array.isArray(parsed.diasSelecionados)
        ? parsed.diasSelecionados
        : [1, 2, 3, 4, 5],
      usarFeriados: parsed.usarFeriados !== undefined ? parsed.usarFeriados : true
    };
  } catch (error) {
    console.error("Erro ao carregar jornada:", error);
    return defaultJornada;
  }
}

export function salvarJornada(jornada: any) {
  try {
    localStorage.setItem("jornada_trabalho", JSON.stringify(jornada));
    return true;
  } catch (error) {
    console.error("Erro ao salvar jornada:", error);
    return false;
  }
}

export const defaultFeriados: CustomHoliday[] = [];

export function carregarFeriados(): CustomHoliday[] {
  try {
    const data = localStorage.getItem("feriados");
    if (!data) return defaultFeriados;

    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return defaultFeriados;

    return parsed;
  } catch (error) {
    console.error("Erro ao carregar feriados:", error);
    return defaultFeriados;
  }
}

export function salvarFeriados(lista: CustomHoliday[]) {
  try {
    localStorage.setItem("feriados", JSON.stringify(lista));
    return true;
  } catch (error) {
    console.error("Erro ao salvar feriados:", error);
    return false;
  }
}

// Deprecated (Kept for backwards compatibility but not used or relies on local fallback)
export async function getWorkSettings(): Promise<WorkSettings | null> {
  // work_settings table doesn't exist in schema, return null
  return null;
}

export async function getRemainingWorkingDays(fromDate?: Date): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const currentDate = fromDate || new Date();
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Usar a base local em vez de fetch no banco para evitar quebras
  const holidays = carregarFeriados();
  const holidayDates = new Set(holidays.map(h => h.data));
  const jornada = carregarJornada();

  let workingDays = 0;
  const dateIterator = new Date(currentDate);
  dateIterator.setHours(0, 0, 0, 0);

  while (dateIterator <= lastDayOfMonth) {
    const dateStr = dateIterator.toISOString().split('T')[0];

    // Se usarFeriados for true, avaliamos se é um dia do Set, caso contrário ignoramos o bloqueio do feriado.
    if (!jornada.usarFeriados || !holidayDates.has(dateStr)) {
      const dayOfWeek = dateIterator.getDay(); // JS getDay: 0=Sun, 1=Mon...6=Sat

      let isWorkDay = false;
      if (jornada.modo === 'Segunda-sexta') {
        isWorkDay = dayOfWeek >= 1 && dayOfWeek <= 5;
      } else if (jornada.modo === 'Segunda-sabado') {
        isWorkDay = dayOfWeek >= 1 && dayOfWeek <= 6;
      } else if (jornada.modo === 'Todos os dias') {
        isWorkDay = true;
      } else if (jornada.modo === 'Personalizado') {
        // Assume diasSelecionados has JS Day values (0-6) mapped previously (In WorkSettings we mapped them correctly).
        // Note: Se o array tiver valores 1 a 6 e 0 para dom, includes funcionará.
        isWorkDay = Array.isArray(jornada.diasSelecionados) && jornada.diasSelecionados.includes(dayOfWeek);
      }

      if (isWorkDay) {
        workingDays++;
      }
    }

    dateIterator.setDate(dateIterator.getDate() + 1);
  }

  return Math.max(1, workingDays);
}

export async function saveWorkSettings(workMode: WorkMode, customSchedule?: Record<string, boolean>) {
  // work_settings table doesn't exist in schema, save to localStorage
  const jornada = {
    modo: workMode,
    diasSelecionados: customSchedule ? Object.entries(customSchedule).filter(([_, v]) => v).map(([k]) => parseInt(k)) : [1, 2, 3, 4, 5],
    usarFeriados: true
  };
  salvarJornada(jornada);
}

export async function addCustomHoliday(data: string, descricao?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  const list = carregarFeriados();
  
  const novoFeriado: CustomHoliday = {
    id: crypto.randomUUID(),
    user_id: user?.id || 'local-user',
    data,
    descricao,
    created_at: new Date().toISOString()
  };

  const atualizada = [...list, novoFeriado];
  salvarFeriados(atualizada);
}

export async function deleteCustomHoliday(holidayId: string) {
  const list = carregarFeriados();
  const atualizada = list.filter(h => h.id !== holidayId);
  salvarFeriados(atualizada);
}

export async function fetchCustomHolidays(): Promise<CustomHoliday[]> {
  // Ignoramos a rede completamente para ter um retorno infalível síncrono ou pseudo-assíncrono
  return carregarFeriados();
}
