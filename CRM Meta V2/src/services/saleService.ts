/**
 * ETAPA 9: Sale Service (Vendas/Metas)
 * Handles sales targets (Metas) and sales records (Lancamentos)
 * Includes calculations for sales metrics based on working days
 */

import { supabase } from "@/integrations/supabase/client";
import { withErrorHandler, handleSupabaseError } from "@/services/errorHandler";
import { getAuthUser } from "@/services/authService";
import { getRemainingWorkingDays } from "@/services/workSettingsService";
import { parseLocalDate } from "@/utils/date";
import type { Meta, Lancamento, CrmDatabase } from "@/lib/types";

// ---- Database Fetching ----

export async function fetchDatabase(): Promise<CrmDatabase> {
  const [metasRes, lancRes] = await Promise.all([
    supabase.from('metas').select('*'),
    supabase.from('lancamentos').select('*'),
  ]);

  const metas: Meta[] = (metasRes.data || []).map(m => ({
    id: m.id,
    nome: m.nome,
    valor: Number(m.valor),
    descricao: m.descricao || '',
  }));

  const lancamentos: Lancamento[] = (lancRes.data || []).map(l => ({
    id: l.id,
    data: l.data,
    valorBruto: Number(l.valor_bruto),
    desconto: Number(l.desconto),
    valorLiquido: Number(l.valor_liquido),
  }));

  return { metas, lancamentos };
}

// ---- Meta CRUD ----

export async function addMeta(nome: string, valor: number, descricao: string) {
  const user = await getAuthUser();
  await supabase.from('metas').insert({ user_id: user.id, nome, valor, descricao });
}

export async function updateMeta(id: string, nome: string, valor: number, descricao: string) {
  return withErrorHandler(
    async () => {
      const { error } = await supabase.from('metas').update({ nome, valor, descricao }).eq('id', id);
      if (error) throw handleSupabaseError(error, 'updateMeta');
    },
    'updateMeta',
    undefined,
    { metaId: id }
  );
}

export async function deleteMeta(id: string) {
  return withErrorHandler(
    async () => {
      const { error } = await supabase.from('metas').delete().eq('id', id);
      if (error) throw handleSupabaseError(error, 'deleteMeta');
    },
    'deleteMeta',
    undefined,
    { metaId: id }
  );
}

// ---- Lancamento CRUD ----

export async function addLancamento(
  data: string,
  valorBruto: number,
  desconto: number
) {
  const user = await getAuthUser();
  return withErrorHandler(
    async () => {
      const { error } = await supabase.from('lancamentos').insert({
        user_id: user.id,
        data,
        valor_bruto: valorBruto,
        desconto,
      });

      if (error) throw handleSupabaseError(error, 'addLancamento');
    },
    'addLancamento',
    undefined,
    { data, valorBruto, desconto }
  );
}

export async function updateLancamento(id: string, data: string, valorBruto: number, desconto: number) {
  return withErrorHandler(
    async () => {
      const { error } = await supabase.from('lancamentos').update({
        data,
        valor_bruto: valorBruto,
        desconto,
      }).eq('id', id);
      if (error) throw handleSupabaseError(error, 'updateLancamento');
    },
    'updateLancamento',
    undefined,
    { lancamentoId: id }
  );
}

export async function deleteLancamento(id: string) {
  return withErrorHandler(
    async () => {
      const { error } = await supabase.from('lancamentos').delete().eq('id', id);
      if (error) throw handleSupabaseError(error, 'deleteLancamento');
    },
    'deleteLancamento',
    undefined,
    { lancamentoId: id }
  );
}

// ---- Helper Functions ----

export function getLancamentosDoMes(db: CrmDatabase): Lancamento[] {
  const hoje = new Date();
  return db.lancamentos.filter(l => {
    const d = parseLocalDate(l.data);
    return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
  });
}

export function getLancamentosMesAnterior(db: CrmDatabase): Lancamento[] {
  const hoje = new Date();
  const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  return db.lancamentos.filter(l => {
    const d = parseLocalDate(l.data);
    return d.getMonth() === mesAnterior.getMonth() && d.getFullYear() === mesAnterior.getFullYear();
  });
}

export function getDiasMes(data?: Date): number {
  const d = data || new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/**
 * Calculate sales needed per day to reach target
 * Considers working days (Segunda-sexta, holidays, etc) when useWorkingDays is true
 */
export async function calcularVendasNecessarias(meta: Meta, lancamentos: Lancamento[], useWorkingDays: boolean = true) {
  const totalVendido = lancamentos.reduce((sum, l) => sum + l.valorLiquido, 0);
  const hoje = new Date();

  let diasRestantes: number;

  if (useWorkingDays) {
    try {
      diasRestantes = await getRemainingWorkingDays(hoje);
    } catch (error) {
      // Fallback to calendar days if working days calculation fails
      const diasMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
      diasRestantes = diasMes - hoje.getDate() + 1;
    }
  } else {
    const diasMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
    diasRestantes = diasMes - hoje.getDate() + 1;
  }

  const vendasRestantes = Math.max(0, meta.valor - totalVendido);
  const vendasNecessarias = diasRestantes > 0 ? vendasRestantes / diasRestantes : 0;
  const percentual = Math.min((totalVendido / meta.valor) * 100, 100);
  const metaBatida = totalVendido >= meta.valor;
  return { totalVendido, vendasRestantes, diasRestantes, vendasNecessarias, percentual, metaBatida };
}
