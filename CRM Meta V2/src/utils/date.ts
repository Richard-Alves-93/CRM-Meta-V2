/**
 * Data Utilities - Centralizada para tratar datas de forma consistente
 * Elimina timezone mismatches e oferece um ponto único de verdade para manipulação de datas
 */

/**
 * Cria uma data cravada ao meio-dia, evitando que a interpretação local de fusos jogue o dia para trás.
 */
export function criarDataSemFuso(ano: number, mes: number, dia: number): Date {
  // Passando 12 para garantir que conversões GMT-3/GMT-4 nunca voltem ao dia/mês anterior.
  return new Date(ano, mes - 1, dia, 12, 0, 0);
}

/**
 * Parse uma string de data local (YYYY-MM-DD) e retorna Date sem timezone issues
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr || typeof dateStr !== 'string') {
    throw new Error('Data inválida: string esperada');
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) {
    throw new Error(`Formato de data inválido: ${dateStr}. Use YYYY-MM-DD`);
  }
  return criarDataSemFuso(year, month, day);
}

/**
 * Formata uma Date para string no formato brasileiro (DD/MM/YYYY)
 */
export function formatDateBR(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? parseLocalDate(date) : date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '';
  }
}

/**
 * Formata uma Date para string ISO (YYYY-MM-DD) - padrão para inputs e Supabase
 */
export function formatISODate(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? parseLocalDate(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Erro ao formatar data ISO:', error);
    return '';
  }
}

/**
 * Retorna o número de dias no mês de uma data (ou mês atual se omitido)
 */
export function getMonthDays(date?: Date): number {
  const d = date || new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/**
 * Verify se duas datas estão no mesmo mês/ano
 */
export function isSameMonth(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth()
  );
}

/**
 * Calcula número de dias entre duas datas (inclusivo)
 */
export function getDaysInRange(start: Date, end: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / oneDay) + 1;
}

/**
 * Remove horário de uma data (retorna meia-noite UTC)
 */
export function dateWithoutTime(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Adiciona dias a uma data
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Subtrai dias de uma data
 */
export function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

/**
 * Obtém o último dia do mês
 */
export function getLastDayOfMonth(date?: Date): Date {
  const d = date || new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/**
 * Obtém o primeiro dia do mês
 */
export function getFirstDayOfMonth(date?: Date): Date {
  const d = date || new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function isLastDayOfMonth(date: Date) {
  const tomorrow = new Date(date);
  tomorrow.setDate(date.getDate() + 1);
  return tomorrow.getDate() === 1;
}

export function isFirstDayOfMonth(date: Date) {
  return date.getDate() === 1;
}

/**
 * Verifica se uma data é válida
 */
export function isValidDate(date: any): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Compara duas datas (retorna -1, 0, ou 1)
 */
export function compareDates(d1: Date, d2: Date): -1 | 0 | 1 {
  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
}

/**
 * Verifica se uma data é hoje
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Verifica se uma data é no passado
 */
export function isPast(date: Date): boolean {
  return date < new Date();
}

/**
 * Verifica se uma data é no futuro
 */
export function isFuture(date: Date): boolean {
  return date > new Date();
}

/**
 * Obtém o número da semana do ano (ISO 8601)
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Formata data para exibição com contexto relativo (hoje, ontem, amanhã, etc)
 */
export function formatDateRelative(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? parseLocalDate(date) : date;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (isToday(d)) return 'Hoje';
    if (isToday(tomorrow) && d.getTime() === tomorrow.getTime()) return 'Amanhã';
    if (isToday(yesterday) && d.getTime() === yesterday.getTime()) return 'Ontem';

    return formatDateBR(d);
  } catch (error) {
    console.error('Erro ao formatar data relativa:', error);
    return '';
  }
}

/**
 * Retorna intervalo de datas em formato legível (ex: "15 de Março a 20 de Março")
 */
export function formatDateRange(start: Date | string, end: Date | string): string {
  try {
    const s = typeof start === 'string' ? parseLocalDate(start) : start;
    const e = typeof end === 'string' ? parseLocalDate(end) : end;

    const startDay = s.getDate();
    const endDay = e.getDate();
    const startMonth = s.toLocaleDateString('pt-BR', { month: 'long' });
    const endMonth = e.toLocaleDateString('pt-BR', { month: 'long' });
    const year = e.getFullYear();

    if (isSameMonth(s, e)) {
      return `${startDay} a ${endDay} de ${startMonth} de ${year}`;
    }
    return `${startDay} de ${startMonth} a ${endDay} de ${endMonth} de ${year}`;
  } catch (error) {
    console.error('Erro ao formatar intervalo:', error);
    return '';
  }
}
