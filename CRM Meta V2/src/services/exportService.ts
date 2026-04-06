/**
 * ETAPA 9: Export Service
 * Handles data export to JSON and Excel formats
 * Aggregates data from all entities for backup/reporting
 */

import { supabase } from "@/integrations/supabase/client";
import { fetchDatabase } from "@/services/saleService";
import { formatDate } from "@/lib/formatters";

export async function gerarBackupString(): Promise<string> {
  const db = await fetchDatabase();

  // Buscar os dados das novas tabelas V4
  const { data: customers } = await supabase.from('customers').select('*');
  const { data: pets } = await supabase.from('pets').select('*');
  const { data: products } = await supabase.from('products').select('*');
  const { data: pet_purchases } = await supabase.from('pet_purchases').select('*');

  const backup = {
    versao: 4,
    dataHora: new Date().toISOString(),
    config: {
      logo: localStorage.getItem('crm_custom_logo'),
      primaryColor: localStorage.getItem('crm_custom_primary_color')
    },
    db: {
      ...db,
      customers: customers || [],
      pets: pets || [],
      products: products || [],
      pet_purchases: pet_purchases || []
    }
  };
  
  return JSON.stringify(backup, null, 2);
}

export async function exportarDadosJSON() {
  const jsonString = await gerarBackupString();
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `crm-v4-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportarExcel() {
  const db = await fetchDatabase();
  const dados = db.lancamentos.map(l => ({
    Data: formatDate(l.data),
    'Valor Bruto': l.valorBruto,
    Desconto: l.desconto,
    'Valor Líquido': l.valorLiquido
  }));

  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Lançamentos");
  XLSX.writeFile(wb, `lancamentos-${new Date().toISOString().split('T')[0]}.xlsx`);
}
