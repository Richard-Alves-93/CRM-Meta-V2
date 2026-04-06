/**
 * ETAPA 9: Product Service
 * Handles all product-related data operations
 */

import { supabase } from "@/integrations/supabase/client";
import { withErrorHandler, handleSupabaseError } from "@/services/errorHandler";
import { getAuthUser } from "@/services/authService";
import type { Product } from "@/lib/types";

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*').order('nome');
  if (error) throw error;
  return data as Product[];
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<Product> {
  const user = await getAuthUser();
  const { data, error } = await supabase.from('products').insert({ ...product, user_id: user.id } as any).select().single();
  if (error) throw handleSupabaseError(error, 'addProduct');
  return data as Product;
}

export async function findOrCreateProduct(productName: string, categoria?: string | null): Promise<Product> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Try to find existing product by name
  const { data: existing } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', user.id)
    .ilike('nome', productName)
    .limit(1);

  if (existing && existing.length > 0) {
    return existing[0] as Product;
  }

  // Create new product with defaults
  return addProduct({
    nome: productName,
    categoria: categoria || null,
    prazo_recompra_dias: 30,
    dias_aviso_previo: 3,
    mensagem_padrao: null,
  });
}

export async function updateProduct(id: string, product: Partial<Omit<Product, 'id'>>) {
  return withErrorHandler(
    async () => {
      const { error } = await supabase.from('products').update(product).eq('id', id);
      if (error) throw handleSupabaseError(error, 'updateProduct');
    },
    'updateProduct',
    undefined,
    { productId: id }
  );
}

export async function deleteProduct(id: string) {
  return withErrorHandler(
    async () => {
      // Remove dependent pet purchases first to avoid FK constraints
      await supabase.from('pet_purchases').delete().eq('product_id', id);

      // Delete the product
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw handleSupabaseError(error, 'deleteProduct');
    },
    'deleteProduct',
    undefined,
    { productId: id }
  );
}
