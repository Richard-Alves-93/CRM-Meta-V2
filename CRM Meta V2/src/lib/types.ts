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
  cep?: string | null;
  endereco?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  complemento?: string | null;
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
   preco_venda: number;
  estoque_atual: number;
  requires_pet_history?: boolean;
  ativo?: boolean;
}

export interface Service {
  id: string;
  tenant_id: string;
  nome: string;
  preco: number;
  descricao: string | null;
  categoria: string | null;
  duration_minutes?: number;
  requires_pet?: boolean;
  requires_professional?: boolean;
  requires_schedule?: boolean;
  commission_rate?: number;
  ativo: boolean;
  created_at?: string;
}

export interface Sale {
  id: string;
  tenant_id: string;
  customer_id: string;
  pet_id: string | null;
  user_id: string;
  cashier_session_id?: string | null;
  total_amount: number;
  discount_amount: number;
  status: 'paid' | 'pending' | 'canceled';
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  type: 'product' | 'service';
  item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  pet_id?: string | null;
  professional_id?: string | null;
}

export interface Payment {
  id: string;
  sale_id: string;
  method: 'cash' | 'pix' | 'credit_card' | 'debit_card';
  amount: number;
  created_at?: string;
}

export interface CashierSession {
  id: string;
  tenant_id: string;
  opened_by: string;
  opened_at: string;
  closed_at: string | null;
  initial_amount: number;
  final_amount: number | null;
  status: 'open' | 'closed';
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

export type AuthRole = 'master' | 'owner' | 'admin' | 'atendente' | 'driver';

export interface Profile {
  id: string;
  tenant_id: string | null;
  user_id: string; // Vínculo com auth.uid()
  role: AuthRole | string | null;
  display_name: string | null;
  avatar_url: string | null;
  email_temp?: string | null; // E-mail para convite antes do signup
  whatsapp?: string | null;
  telefone?: string | null;
  documento?: string | null; // CPF
  cnh?: string | null;
  endereco?: any | null; // JSONB
  permissions?: Record<string, boolean> | null;
  sector_id?: string | null;
  created_at?: string;
}

export interface Sector {
  id: string;
  tenant_id: string | null;
  name: string;
  permissions: Record<string, boolean>;
  created_at: string;
}

export type TransporteStatus = 'AGUARDANDO' | 'A_CAMINHO' | 'REAGENDADO' | 'CONCLUIDO' | 'CANCELADO';
export type TransporteTipo = 'BUSCA' | 'ENTREGA';

export interface Transporte {
  id: string;
  tenant_id: string;
  venda_id: string | null;
  pet_id: string | null;
  tipo: TransporteTipo;
  data_hora: string;
  motorista_id: string | null;
  endereco_transporte: string | null;
  status: TransporteStatus;
  observacoes: string | null;
  
  // Relations for joining data in UI
  motorista_nome?: string;
  cliente_nome?: string;
  pet_nome?: string;
  cliente_whatsapp?: string;
}
