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

  // Busca apenas transportes válidos para o Motorista Logado
  async fetchMeusTransportes(): Promise<Transporte[]> {
     const { data: session } = await supabase.auth.getSession();
     if (!session.session?.user) throw new Error("Não autenticado");

     const { data, error } = await supabase
      .from('transportes')
      .select(`
        *,
        pet:pets(nome),
        motorista:profiles!transportes_motorista_id_fkey (display_name)
      `)
      .eq('motorista_id', session.session.user.id)
      .order('data_hora', { ascending: true });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      tipo: item.tipo as TransporteTipo,
      status: item.status as TransporteStatus,
      motorista_nome: item.motorista?.display_name || 'Eu',
      pet_nome: item.pet?.nome || 'Pet'
    }));
  },

  // Insere um novo transporte. O tenant_id é pego pelo profile do logado.
  async addTransporte(transporte: Omit<Transporte, 'id' | 'tenant_id'>) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) throw new Error("Não autenticado");

    // Tenta pegar o tenant_id do perfil, mas não bloqueia se não existir
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('user_id', session.session.user.id)
      .single();

    const tenantId = profile?.tenant_id || null;
    
    // Avisa no console mas não bloqueia (para facilitar o desenvolvimento)
    if (!tenantId) {
      console.warn('[Transporte] Perfil sem tenant_id. Execute o SQL para vincular o tenant ao usuário.');
    }

    // Corrigir venda_id: se for string vazia, vira null para não dar erro de UUID no Postgres
    const vendaId = (transporte.venda_id && transporte.venda_id.length > 5) ? transporte.venda_id : null;

    const insertPayload: Record<string, any> = {
      tenant_id: tenantId,
      tipo: transporte.tipo,
      data_hora: transporte.data_hora,
      motorista_id: transporte.motorista_id,
      endereco_transporte: transporte.endereco_transporte,
      status: 'AGUARDANDO',
      observacoes: transporte.observacoes,
    };

    // Só inclui venda_id se houver um valor válido
    if (vendaId) {
      insertPayload.venda_id = vendaId;
    }

    // Tenta com pet_id; se a coluna ainda não existe no banco, faz fallback sem ela
    let data: any, error: any;
    
    if (transporte.pet_id) {
      const result = await supabase.from('transportes').insert({ ...insertPayload, pet_id: transporte.pet_id }).select().single();
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
  async fetchMotoristasDaEmpresa(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'driver');
      
    if (error) throw error;
    // O RLS idealmente já filtra pelo id do tenant ou fazemos manual se faltar política
    return data as any;
  }
};
