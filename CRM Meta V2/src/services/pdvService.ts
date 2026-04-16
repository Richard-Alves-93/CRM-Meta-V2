import { supabase } from "@/integrations/supabase/client";
import { Sale, SaleItem, Payment, CashierSession, Product, Service, Transporte, Profile } from "@/lib/types";
import { addLancamento } from "./saleService";
import { transporteService } from "./transporteService";
import { toast } from "sonner";

export const pdvService = {
  // ---- Fetching ----
  
  async fetchPdvData() {
    const [productsRes, servicesRes] = await Promise.all([
      supabase.from('products').select('*').eq('ativo', true),
      supabase.from('services').select('*').eq('ativo', true)
    ]);

    if (productsRes.error) throw productsRes.error;
    if (servicesRes.error) throw servicesRes.error;

    return {
      products: productsRes.data as Product[],
      services: servicesRes.data as Service[]
    };
  },

  async fetchProfiles(tenantId: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('role', 'team'); // Assumindo que role team são os funcionários

    if (error) {
      console.warn("[pdvService] Erro ao buscar perfis:", error);
      // Fallback: buscar todos se filtrar por team der erro ou retornar nada
      const { data: all } = await supabase.from('profiles').select('*').eq('tenant_id', tenantId);
      return (all || []) as Profile[];
    }
    return data as Profile[];
  },

  // ---- Cashier Sessions ----

  async getActiveSession(userId: string): Promise<CashierSession | null> {
    const { data, error } = await supabase
      .from('cashier_sessions')
      .select('*')
      .eq('opened_by', userId)
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[pdvService] Erro ao buscar sessão ativa:", error);
      throw error;
    }
    return data as CashierSession;
  },

  async openCashier(userId: string, tenantId: string, initialAmount: number) {
    const { data, error } = await supabase
      .from('cashier_sessions')
      .insert({
        tenant_id: tenantId,
        opened_by: userId,
        initial_amount: initialAmount,
        status: 'open'
      })
      .select()
      .single();

    if (error) throw error;
    return data as CashierSession;
  },

  async closeCashier(sessionId: string, finalAmount: number) {
    // 1. Marcar sessão como fechada
    const { data: session, error: closeError } = await supabase
      .from('cashier_sessions')
      .update({
        closed_at: new Date().toISOString(),
        final_amount: finalAmount,
        status: 'closed'
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (closeError) throw closeError;

    // 2. Gerar Lançamento Financeiro Automático (Consolidado)
    // Buscamos todas as vendas da sessão
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('total_amount, discount_amount')
      .eq('cashier_session_id', sessionId)
      .eq('status', 'paid');

    if (!salesError && sales && sales.length > 0) {
      const totalBruto = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
      const totalDesconto = sales.reduce((sum, s) => sum + Number(s.discount_amount), 0);
      
      // Criar o lançamento no dashboard
      await addLancamento(
        new Date().toISOString().split('T')[0],
        totalBruto,
        totalDesconto
      );
    }

    return session;
  },

  // ---- Sales Logic ----

  async createSale(
    saleData: Omit<Sale, 'id' | 'created_at'>,
    items: Omit<SaleItem, 'id' | 'sale_id'>[],
    payments: Omit<Payment, 'id' | 'sale_id'>[],
    logistics?: {
      busca?: Partial<Transporte>;
      entrega?: Partial<Transporte>;
    }
  ) {
    // 1. Inserir a Venda
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert(saleData)
      .select()
      .single();

    if (saleError) throw saleError;

    // 2. Inserir Itens da Venda
    const itemsWithSaleId = items.map(item => ({ ...item, sale_id: sale.id }));
    const { error: itemsError } = await supabase.from('sale_items').insert(itemsWithSaleId);
    if (itemsError) throw itemsError;

    // 3. Inserir Pagamentos
    const paymentsWithSaleId = payments.map(p => ({ ...p, sale_id: sale.id }));
    const { error: paymentsError } = await supabase.from('payments').insert(paymentsWithSaleId);
    if (paymentsError) throw paymentsError;

    // 4. Baixar Estoque (apenas para produtos) e registrar histórico de serviço
    for (const item of items) {
      if (item.type === 'product') {
        const { error: stockError } = await supabase.rpc('decrement_stock', {
          product_id: item.item_id,
          qty: item.quantity
        });
        
        if (stockError) {
           const { data: p } = await supabase.from('products').select('estoque_atual').eq('id', item.item_id).single();
           if (p) {
             await supabase.from('products').update({ estoque_atual: (p.estoque_atual || 0) - item.quantity }).eq('id', item.item_id);
           }
        }
      }
      
      // Registrar última interação no Pet se houver vínculo
      if (item.pet_id) {
         await supabase.from('pets').update({ last_service_at: new Date().toISOString() }).eq('id', item.pet_id);
      }
    }

    // 5. Gerar Logística Integrada (Se houver)
    if (logistics) {
      try {
        if (logistics.busca) {
          await transporteService.addTransporte({
            tenant_id: sale.tenant_id,
            venda_id: sale.id,
            tipo: 'BUSCA',
            data_hora: logistics.busca.data_hora!,
            motorista_id: logistics.busca.motorista_id!,
            endereco_transporte: logistics.busca.endereco_transporte || '',
            status: 'AGUARDANDO',
            pet_id: sale.pet_id,
            observacoes: logistics.busca.observacoes || 'Gerado via PDV'
          });
        }
        
        if (logistics.entrega) {
          await transporteService.addTransporte({
            tenant_id: sale.tenant_id,
            venda_id: sale.id,
            tipo: 'ENTREGA',
            data_hora: logistics.entrega.data_hora!,
            motorista_id: logistics.entrega.motorista_id!,
            endereco_transporte: logistics.entrega.endereco_transporte || '',
            status: 'AGUARDANDO',
            pet_id: sale.pet_id,
            observacoes: logistics.entrega.observacoes || 'Gerado via PDV'
          });
        }
      } catch (logErr) {
        console.error("[PDV] Erro ao criar logística vinculada:", logErr);
        // Não jogamos o erro para cima para não quebrar a finalização da venda
      }
    }

    return sale;
  }
};
