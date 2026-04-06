/**
 * ETAPA 9: Centralized Type Definitions
 * All interfaces and types used across Meta-Sant CRM
 * No implementation, only type definitions
 */

export interface Meta {
  id: string;
  nome: string;
  valor: number;
  descricao: string;
}

export interface Lancamento {
  id: string;
  data: string;
  valorBruto: number;
  desconto: number;
  valorLiquido: number;
  customer_id?: string | null;
  pet_id?: string | null;
  categoria?: string | null;
  ativo?: boolean;
}

export interface Customer {
  id: string;
  nome: string;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  observacoes: string | null;
  ativo?: boolean;
}

export interface Pet {
  id: string;
  customer_id: string;
  nome: string;
  especie: string | null;
  raca: string | null;
  data_aniversario: string | null;
  sexo: string | null;
  porte: string | null;
  peso: number | null;
  ativo?: boolean;
}

export interface Product {
  id: string;
  nome: string;
  categoria: string | null;
  prazo_recompra_dias: number;
  dias_aviso_previo: number;
  mensagem_padrao: string | null;
  ativo?: boolean;
}

export type PetPurchaseStatus = 'Ativo' | 'Avisar em breve' | 'Avisar hoje' | 'Notificado' | 'Recompra registrada' | 'Trocado' | 'Vencido' | 'Cancelado';

export interface PetPurchase {
  id: string;
  pet_id: string;
  product_id: string;
  data_compra: string;
  dias_recompra: number;
  proxima_data: string;
  dias_aviso_previo: number;
  data_lembrete: string;
  status: PetPurchaseStatus;
  purchase_history_id: string | null;
  valor?: number;
  ativo?: boolean;

  // Relations for joining data
  pet?: Pet;
  product?: Product;
}

export type WorkMode = 'Segunda-sexta' | 'Segunda-sabado' | 'Todos os dias' | 'Personalizado';

export interface WorkSettings {
  id: string;
  user_id: string;
  work_mode: WorkMode;
  custom_schedule_json?: Record<string, boolean> | null;
  created_at: string;
  updated_at: string;
}

export interface CustomHoliday {
  id: string;
  user_id: string;
  data: string;
  descricao?: string | null;
  created_at: string;
}

export interface CrmDatabase {
  metas: Meta[];
  lancamentos: Lancamento[];
}
