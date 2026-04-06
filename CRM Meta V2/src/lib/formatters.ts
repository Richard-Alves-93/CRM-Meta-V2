import { formatCurrency } from '@/utils/currency';

/**
 * ETAPA 9: Formatters Utility Functions
 * Centralized formatting functions for currency, dates, etc.
 */

export { formatCurrency };

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date + 'T12:00:00'));
}
