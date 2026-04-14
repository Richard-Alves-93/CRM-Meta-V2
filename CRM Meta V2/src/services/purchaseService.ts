/**
 * ETAPA 9: Purchase Service
 * Handles all pet purchase-related operations including recurring purchase cycles
 * This is the most complex service containing atomic transactions
 */

import { supabase } from "@/integrations/supabase/client";
import { withErrorHandler, handleSupabaseError, executeSequential, CrmError } from "@/services/errorHandler";
import { getAuthUser } from "@/services/authService";
import type { PetPurchase, PetPurchaseStatus, Customer, Pet, Product } from "@/lib/types";

export async function fetchPetPurchases(): Promise<PetPurchase[]> {
  const { data, error } = await supabase
    .from('pet_purchases')
    .select(`
      *,
      pet:pets(
        *,
        customer:customers(*)
      ),
      product:products(*)
    `)
    .eq('ativo', true)
    .order('proxima_data', { ascending: true });
  if (error) throw error;

  // Map internal nested customer object to top level for frontend compatibility
  return data.map((d: any) => ({
    ...d,
    customer: d.pet?.customer || null
  })) as PetPurchase[];
}

export async function addPetPurchase(purchase: Omit<PetPurchase, 'id' | 'pet' | 'product'>) {
  const user = await getAuthUser();

  // Calculate reminder date if not provided
  let data_lembrete = purchase.data_lembrete;
  if (!data_lembrete && purchase.proxima_data && purchase.dias_aviso_previo) {
    const prox = new Date(purchase.proxima_data);
    prox.setDate(prox.getDate() - purchase.dias_aviso_previo);
    data_lembrete = prox.toISOString().split('T')[0];
  }

  const { error } = await supabase.from('pet_purchases').insert({ ...purchase, data_lembrete, ativo: true, user_id: user.id } as any);
  if (error) throw handleSupabaseError(error, 'addPetPurchase');
}

export async function updatePetPurchase(id: string, purchase: Partial<Omit<PetPurchase, 'id' | 'pet' | 'product'>>) {
  return withErrorHandler(
    async () => {
      const { error } = await supabase.from('pet_purchases').update(purchase).eq('id', id);
      if (error) throw handleSupabaseError(error, 'updatePetPurchase');
    },
    'updatePetPurchase',
    undefined,
    { purchaseId: id }
  );
}

export async function deletePetPurchase(id: string) {
  return withErrorHandler(
    async () => {
      const { error } = await supabase.from('pet_purchases').update({ ativo: false }).eq('id', id);
      if (error) throw handleSupabaseError(error, 'deletePetPurchase');
    },
    'deletePetPurchase',
    undefined,
    { purchaseId: id }
  );
}

export async function fetchPurchases(filters?: { status?: PetPurchaseStatus }): Promise<(PetPurchase & { customer?: Customer, pet?: Pet, product?: Product })[]> {
  const query = supabase
    .from('pet_purchases')
    .select(`
      *,
      pet:pets(*, customer:customers(*)),
      product:products(*)
    `)
    .eq('ativo', true)
    .order('proxima_data', { ascending: true });

  const { data, error } = await query;
  if (error) throw error;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calcula dinamicamente o status no front end (Avisar Hoje e Avisar em Breve <= 7 dias)
  const mappedData = (data || []).map(item => {
    let currentStatus = item.status;

    if (!['Recompra registrada', 'Trocado', 'Cancelado', 'Notificado'].includes(currentStatus) && item.proxima_data) {
      const proxDate = new Date(item.proxima_data);
      const proxDataLocal = new Date(proxDate.valueOf() + proxDate.getTimezoneOffset() * 60 * 1000);
      proxDataLocal.setHours(0, 0, 0, 0);

      const diffDays = Math.round((proxDataLocal.getTime() - today.getTime()) / (1000 * 3600 * 24));

      if (diffDays < 0) {
        currentStatus = 'Vencido';
      } else if (diffDays === 0) {
        currentStatus = 'Avisar hoje';
      } else if (diffDays <= 7) {
        currentStatus = 'Avisar em breve';
      } else {
        currentStatus = 'Ativo';
      }
    }

    return {
      ...item,
      status: currentStatus,
      customer: item.pet?.customer
    };
  });

  if (filters?.status) {
    return mappedData.filter(item => item.status === filters.status) as any[];
  }

  return mappedData as any[];
}

export async function updatePurchaseStatus(purchaseId: string, status: PetPurchaseStatus) {
  return withErrorHandler(
    async () => {
      const { error } = await supabase.from('pet_purchases').update({ status }).eq('id', purchaseId);
      if (error) throw handleSupabaseError(error, 'updatePurchaseStatus');
    },
    'updatePurchaseStatus',
    undefined,
    { purchaseId, status }
  );
}

export async function registerWhatsAppLog(purchaseId: string, telefone: string, mensagem: string) {
  const user = await getAuthUser();

  const { error } = await supabase.from('whatsapp_logs').insert({
    user_id: user.id,
    purchase_id: purchaseId,
    telefone,
    mensagem
  });

  if (error) throw handleSupabaseError(error, 'registerWhatsAppLog');

  // Update purchase status
  await updatePurchaseStatus(purchaseId, 'Notificado');
}

/**
 * Register a repurchase: update current purchase and create new purchase cycle
 * Atomic operation with rollback capability
 */
export async function registerRepurchase(purchaseId: string, newProductId: string, dataCompraStr: string) {
  const user = await getAuthUser();

  interface StepResults {
    currentPurchase?: any;
    newProduct?: any;
    isTrocado?: boolean;
    proximaData?: Date;
    dataLembrete?: Date;
  }

  const stepResults: StepResults = {};

  await executeSequential([
    {
      name: 'Fetch current purchase',
      operation: async () => {
        const { data, error } = await supabase
          .from('pet_purchases')
          .select('*')
          .eq('id', purchaseId)
          .single();

        if (error || !data) {
          throw handleSupabaseError(error || new Error('Purchase not found'), 'registerRepurchase - fetch current');
        }

        stepResults.currentPurchase = data;
        return data;
      }
    },
    {
      name: 'Fetch new product',
      operation: async () => {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', newProductId)
          .single();

        if (error || !data) {
          throw handleSupabaseError(error || new Error('Product not found'), 'registerRepurchase - fetch product');
        }

        stepResults.newProduct = data;
        return data;
      }
    },
    {
      name: 'Update current purchase status',
      operation: async () => {
        const isTrocado = stepResults.currentPurchase!.product_id !== newProductId;
        stepResults.isTrocado = isTrocado;

        const { error } = await supabase
          .from('pet_purchases')
          .update({ status: isTrocado ? 'Trocado' : 'Recompra registrada' })
          .eq('id', purchaseId);

        if (error) {
          throw handleSupabaseError(error, 'registerRepurchase - update status');
        }
      },
      rollback: async () => {
        // Revert status back to 'Ativo'
        try {
          await supabase
            .from('pet_purchases')
            .update({ status: 'Ativo' })
            .eq('id', purchaseId);
        } catch (err) {
          console.error('[CRM] Rollback error on status revert:', err);
        }
      }
    },
    {
      name: 'Insert new purchase cycle',
      operation: async () => {
        const dataCompra = new Date(dataCompraStr);
        const proximaData = new Date(dataCompra);
        proximaData.setDate(proximaData.getDate() + stepResults.newProduct!.prazo_recompra_dias);

        const dataLembrete = new Date(proximaData);
        dataLembrete.setDate(dataLembrete.getDate() - stepResults.newProduct!.dias_aviso_previo);

        stepResults.proximaData = proximaData;
        stepResults.dataLembrete = dataLembrete;

        const { data, error } = await supabase
          .from('pet_purchases')
          .insert({
            user_id: user.id,
            pet_id: stepResults.currentPurchase!.pet_id,
            product_id: newProductId,
            data_compra: dataCompraStr,
            dias_recompra: stepResults.newProduct!.prazo_recompra_dias,
            proxima_data: proximaData.toISOString().split('T')[0],
            dias_aviso_previo: stepResults.newProduct!.dias_aviso_previo,
            data_lembrete: dataLembrete.toISOString().split('T')[0],
            status: 'Ativo',
            ativo: true,
            purchase_history_id: purchaseId,
            valor: stepResults.currentPurchase?.valor || null
          })
          .select()
          .single();

        if (error) {
          throw handleSupabaseError(error, 'registerRepurchase - insert new cycle');
        }

        return data;
      }
    }
  ]);
}

/**
 * Start a new purchase cycle for a pet
 * Creates initial recurring purchase record with calculated dates
 */
export async function startNewPurchaseCycle(
  petId: string,
  productId: string,
  dataCompraStr: string,
  diasRecompra?: number,
  diasAvisoPrevio?: number,
  valor?: number
) {
  const user = await getAuthUser();

  // Validate data_compra is not empty
  if (!dataCompraStr || !dataCompraStr.trim()) {
    throw new CrmError(
      'Data da compra é obrigatória e não pode estar vazia',
      'VALIDATION_ERROR',
      400,
      'Data da compra é obrigatória',
      { petId, productId }
    );
  }

  // Try to fetch product for accurate data, but don't fail if RLS blocks it
  let productDias = diasRecompra || 30;
  let productAvisoPrevio = diasAvisoPrevio || 3;

  try {
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (!prodErr && product) {
      productDias = diasRecompra || product.prazo_recompra_dias;
      productAvisoPrevio = diasAvisoPrevio ?? product.dias_aviso_previo;
    } else {
      console.warn('[startNewPurchaseCycle] Produto não encontrado via RLS, usando valores passados como parâmetro.', { productId, diasRecompra, diasAvisoPrevio });
    }
  } catch (fetchErr) {
    console.warn('[startNewPurchaseCycle] Falha ao buscar produto, usando fallback.', fetchErr);
  }

  const dataCompra = new Date(dataCompraStr);
  const proximaData = new Date(dataCompra);
  proximaData.setDate(proximaData.getDate() + productDias);

  const dataLembrete = new Date(proximaData);
  dataLembrete.setDate(dataLembrete.getDate() - productAvisoPrevio);

  const { error } = await supabase.from('pet_purchases').insert({
    user_id: user.id,
    pet_id: petId,
    product_id: productId,
    data_compra: dataCompraStr,
    dias_recompra: productDias,
    proxima_data: proximaData.toISOString().split('T')[0],
    dias_aviso_previo: productAvisoPrevio,
    data_lembrete: dataLembrete.toISOString().split('T')[0],
    status: 'Ativo',
    ativo: true,
    purchase_history_id: null,
    valor: valor || null
  });

  if (error) throw handleSupabaseError(error, 'startNewPurchaseCycle - insert');
}
