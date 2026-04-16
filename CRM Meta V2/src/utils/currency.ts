export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Formata apenas os números e separadores, sem o prefixo R$
export function formatCurrencyClean(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function parseCurrency(value: string): number {
  // Remove tudo que não é dígito
  const numeric = value.replace(/\D/g, '');
  if (!numeric) return 0;
  return Number(numeric) / 100;
}
