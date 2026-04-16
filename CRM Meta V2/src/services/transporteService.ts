import { supabase } from "@/integrations/supabase/client";
import { Transporte, TransporteStatus, TransporteTipo, Profile } from "@/lib/types";

export const transporteService = {
  // Busca transportes vinculados ao tenant do usuário logado (RLS cuida do filtro automático, mas a gente formata os dados)
  async fetchTransportes(): Promise<Transporte[]> {
    const { data, error } = await supabase
      .from('transportes')
      .select(`
        *,
        pet:pets (
          id,
          nome,
          customer:customers (
            id,
            nome,
            whatsapp
          )
        ),
        motorista:profiles!transportes_motorista_id_fkey (
          id,
          display_name
        )
      `)
      .order('data_hora', { ascending: true });

    if (error) {
      console.error("Erro ao buscar transportes:", error);
      throw error;
    }

    // Formata o retorno para a interface Frontend
    return (data || []).map((item: any) => ({
      ...item,
      tipo: item.tipo as TransporteTipo,
      status: item.status as TransporteStatus,
      motorista_nome: item.motorista?.display_name || 'Sem motorista',
      pet_nome: item.pet?.nome || 'Pet',
      cliente_nome: item.pet?.customer?.nome || 'Não informado',
      cliente_whatsapp: item.pet?.customer?.whatsapp || null,
    }));
  },

  // Busca apenas transportes válidos para o Motorista Logado (de hoje em diante)
  async fetchMeusTransportes(): Promise<Transporte[]> {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) throw new Error("Não autenticado");

    const authUserId = session.session.user.id;

    // 1. Busca o profile.id do usuário logado (pois motorista_id usa profile.id, não auth.user.id)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', authUserId)
      .single();

    if (profileError || !profile) {
      console.warn('[DriverDashboard] Perfil não encontrado para user_id:', authUserId);
      return [];
    }

    const profileId = profile.id;

    // 2. Início do dia de hoje (00:00:00)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // 3. Busca transportes onde motorista_id = profile.id (de hoje em diante)
    const { data, error } = await supabase
      .from('transportes')
      .select(`
        *,
        pet:pets (
          id,
          nome,
          customer:customers (
            id,
            nome,
            whatsapp
          )
        ),
        motorista:profiles!transportes_motorista_id_fkey (display_name)
      `)
      .eq('motorista_id', profileId)
      .gte('data_hora', hoje.toISOString())
      .order('data_hora', { ascending: true });

    if (error) throw error;

    // Diagnóstico: logar o primeiro item para verificar o join
    if (data && data.length > 0) {
      console.log('[DriverDashboard] Primeiro transporte raw:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('[DriverDashboard] Nenhum transporte encontrado para profileId:', profileId);
    }

    return (data || []).map((item: any) => ({
      ...item,
      tipo: item.tipo as TransporteTipo,
      status: item.status as TransporteStatus,
      motorista_nome: item.motorista?.display_name || 'Eu',
      // Tenta pegar pet_nome do join, senão usa valor já salvo (pet_nome denormalizado)
      pet_nome: item.pet?.nome ?? item.pet_nome ?? 'Pet não informado',
      // Tenta pegar cliente do join profundo, senão usa fallback vazio
      cliente_nome: item.pet?.customer?.nome ?? item.cliente_nome ?? 'Tutor não informado',
      cliente_whatsapp: item.pet?.customer?.whatsapp ?? item.cliente_whatsapp ?? null,
    }));
  },

  // Insere um novo transporte. O tenant_id é pego pelo profile do logado ou injetado manualmente.
  async addTransporte(transporte: Omit<Transporte, 'id' | 'tenant_id'> & { tenant_id?: string }) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) throw new Error("Não autenticado");

    let tenantId = transporte.tenant_id;
    
    // Se não foi passado tenantId, tenta buscar do perfil
    if (!tenantId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', session.session.user.id)
        .single();
      tenantId = profile?.tenant_id || null;
    }
    
    // Avisa no console mas não bloqueia (para facilitar o desenvolvimento)
    if (!tenantId) {
      console.warn('[Transporte] Perfil sem tenant_id. Execute o SQL para vincular o tenant ao usuário.');
    }

    // Limpeza de UUIDs: se for string vazia ou inválida, vira null para o Postgres
    const vendaId = (transporte.venda_id && transporte.venda_id.length > 5) ? transporte.venda_id : null;
    const motoristaId = (transporte.motorista_id && transporte.motorista_id.length > 5) ? transporte.motorista_id : null;
    const petId = (transporte.pet_id && transporte.pet_id.length > 5) ? transporte.pet_id : null;

    const insertPayload: Record<string, any> = {
      tenant_id: tenantId,
      tipo: transporte.tipo,
      data_hora: transporte.data_hora,
      motorista_id: motoristaId,
      endereco_transporte: transporte.endereco_transporte,
      status: 'AGUARDANDO',
      observacoes: transporte.observacoes,
    };

    // Só inclui venda_id se houver um valor válido
    if (vendaId) {
      insertPayload.venda_id = vendaId;
    }

    // Tenta com petId; se a coluna ainda não existe no banco, faz fallback sem ela
    let data: any, error: any;
    
    if (petId) {
      const result = await supabase.from('transportes').insert({ ...insertPayload, pet_id: petId }).select().single();
      data = result.data; error = result.error;
      
      // Se o erro for de coluna não encontrada, tenta sem pet_id
      if (error && (error.code === '42703' || error.message?.includes('pet_id'))) {
        console.warn('[Transporte] Coluna pet_id não existe ainda. Execute o SQL de migração. Salvando sem pet_id...');
        const fallback = await supabase.from('transportes').insert(insertPayload).select().single();
        data = fallback.data; error = fallback.error;
      }
    } else {
      const result = await supabase.from('transportes').insert(insertPayload).select().single();
      data = result.data; error = result.error;
    }

    if (error) throw error;
    return data;
  },

  // Atualiza um transporte existente
  async updateTransporte(id: string, transporte: Omit<Transporte, 'id' | 'tenant_id'>) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) throw new Error("Não autenticado");

    const updatePayload: Record<string, any> = {
      tipo: transporte.tipo,
      data_hora: transporte.data_hora,
      motorista_id: transporte.motorista_id,
      endereco_transporte: transporte.endereco_transporte,
      observacoes: transporte.observacoes,
    };

    if (transporte.pet_id) updatePayload.pet_id = transporte.pet_id;

    const { data, error } = await supabase
      .from('transportes')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar transporte:", error);
      throw error;
    }
    return data;
  },

  // Atualiza Status (Qualquer driver ou admin pode fazer)
  async updateStatus(id: string, status: TransporteStatus) {
    const { data, error } = await supabase
      .from('transportes')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  
  // Lista perfis que são motoristas (drivers) do mesmo tenant
  async fetchMotoristasDaEmpresa(tenantId?: string): Promise<Profile[]> {
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'driver');
      
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
      
    if (error) throw error;
    // O RLS idealmente já filtra pelo id do tenant ou fazemos manual se faltar política
    return data as any;
  }
};
