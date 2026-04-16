import { formatCurrency } from '@/utils/currency';

/**
 * ETAPA 9: Formatters Utility Functions
 * Centralized formatting functions for currency, dates, etc.
 */

export { formatCurrency };

export function formatDate(date: string | null | undefined): string {
  if (!date) return "-";
  try {
    const d = new Date(date + 'T12:00:00');
    if (isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat('pt-BR').format(d);
  } catch (error) {
    return "-";
  }
}

export const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length === 0) return "";
  if (numbers.length <= 2) return `(${numbers}`;
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  if (numbers.length === 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  return numbers; // Retorna apenas números se for internacional ou maior que 11
};

export const formatDocument = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length < 11) return numbers; // Deixa o usuário digitar livremente até 11
  if (numbers.length === 11) {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  if (numbers.length === 14) {
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  return numbers; // Se for diferente (estrangeiro?), retorna o que foi digitado
};

export const formatCEP = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length > 8) return numbers.substring(0, 5) + "-" + numbers.substring(5, 8);
  if (numbers.length > 5) return numbers.substring(0, 5) + "-" + numbers.substring(5);
  return numbers;
};
