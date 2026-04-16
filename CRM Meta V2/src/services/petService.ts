/**
 * ETAPA 9: Pet Service
 * Handles all pet-related data operations
 */

import { supabase } from "@/integrations/supabase/client";
import { withErrorHandler, handleSupabaseError, validateCanDelete } from "@/services/errorHandler";
import { getAuthUser } from "@/services/authService";
import type { Pet } from "@/lib/types";

export async function fetchPets(): Promise<Pet[]> {
  const { data, error } = await supabase.from('pets').select('*').eq('ativo', true).order('nome');
  if (error) throw error;
  return data as Pet[];
}

export async function fetchPetsByCustomer(customerId: string): Promise<Pet[]> {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('customer_id', customerId)
    .eq('ativo', true)
    .order('nome');
  if (error) throw error;
  return data as Pet[];
}

export async function addPet(pet: Omit<Pet, 'id'>): Promise<Pet> {
  const user = await getAuthUser();

  // Buscar o perfil para obter o tenant_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  // Sanitize date fields: convert empty strings to null
  const sanitizedPet = {
    ...pet,
    data_aniversario: pet.data_aniversario?.trim() ? pet.data_aniversario : null,
    ativo: true,
    user_id: user.id,
    tenant_id: profile?.tenant_id || (pet as any).tenant_id
  };

  const { data, error } = await supabase.from('pets').insert(sanitizedPet as any).select().single();
  if (error) throw handleSupabaseError(error, 'addPet');
  return data as Pet;
}

export async function updatePet(id: string, pet: Partial<Omit<Pet, 'id'>>) {
  // Sanitize date fields: convert empty strings to null
  const sanitizedPet = {
    ...pet,
    data_aniversario: pet.data_aniversario?.trim() ? pet.data_aniversario : null
  };

  return withErrorHandler(
    async () => {
      const { error } = await supabase.from('pets').update(sanitizedPet).eq('id', id);
      if (error) throw handleSupabaseError(error, 'updatePet');
    },
    'updatePet',
    undefined,
    { petId: id }
  );
}

export async function deletePet(id: string) {
  return withErrorHandler(
    async () => {
      // Soft delete dependent pet purchases
      await supabase.from('pet_purchases').update({ ativo: false }).eq('pet_id', id);

      // Soft delete the pet
      const { error } = await supabase.from('pets').update({ ativo: false }).eq('id', id);
      if (error) throw handleSupabaseError(error, 'deletePet');
    },
    'deletePet',
    undefined,
    { petId: id }
  );
}
