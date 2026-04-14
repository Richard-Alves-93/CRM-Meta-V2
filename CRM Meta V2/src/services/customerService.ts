/**
 * ETAPA 9: Customer Service
 * Handles all customer-related data operations
 */

import { supabase } from "@/integrations/supabase/client";
import { withErrorHandler, handleSupabaseError, CrmError } from "@/services/errorHandler";
import { getAuthUser } from "@/services/authService";
import { z } from "zod";
import type { Customer } from "@/lib/types";

// Input validation schemas
const customerSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200, "Nome muito longo"),
  telefone: z.string().trim().max(30, "Telefone muito longo").nullable().optional(),
  whatsapp: z.string().trim().max(30, "WhatsApp muito longo").nullable().optional(),
  email: z.string().trim().email("Email inválido").max(255, "Email muito longo").nullable().optional()
    .or(z.literal("")).or(z.null()),
  observacoes: z.string().trim().max(1000, "Observações muito longas").nullable().optional(),
  cep: z.string().trim().max(20, "CEP muito longo").nullable().optional().or(z.literal("")),
  endereco: z.string().trim().max(300, "Endereço muito longo").nullable().optional().or(z.literal("")),
  numero: z.string().trim().max(20, "Número muito longo").nullable().optional().or(z.literal("")),
  bairro: z.string().trim().max(100, "Bairro muito longo").nullable().optional().or(z.literal("")),
  cidade: z.string().trim().max(100, "Cidade muito longa").nullable().optional().or(z.literal("")),
  complemento: z.string().trim().max(200, "Complemento muito longo").nullable().optional().or(z.literal("")),
});

function validateCustomerInput(data: Record<string, any>) {
  const result = customerSchema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.errors[0];
    throw new CrmError(
      `Validation failed: ${firstError.message}`,
      'VALIDATION_ERROR',
      400,
      firstError.message,
      { validationErrors: result.error.errors }
    );
  }
  return result.data;
}

export async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from('customers').select('*').eq('ativo', true).order('nome');
  if (error) throw error;
  return data as Customer[];
}

export async function fetchCustomersWithPets(): Promise<(Customer & { pets: Pet[] })[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*, pets(*)')
    .eq('ativo', true)
    .order('nome');
    
  if (error) throw error;
  return data as (Customer & { pets: Pet[] })[];
}

export async function addCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
  const user = await getAuthUser();
  const validated = validateCustomerInput(customer);
  
  const { data, error } = await supabase
    .from('customers')
    .insert({ 
      ...validated, 
      user_id: user.id 
    })
    .select()
    .single();

  if (error) throw handleSupabaseError(error, 'addCustomer');
  return data as Customer;
}

export async function updateCustomer(id: string, customer: Partial<Omit<Customer, 'id'>>) {
  return withErrorHandler(
    async () => {
      // Validamos o que foi enviado (usando nome placeholder se omitido para passar no schema)
      const validated = validateCustomerInput({ 
        nome: customer.nome || 'Validation Placeholder', 
        ...customer 
      });

      // Removemos o placeholder se ele foi usado
      const updateData = { ...validated };
      if (!customer.nome) delete (updateData as any).nome;

      const { error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', id);

      if (error) throw handleSupabaseError(error, 'updateCustomer');
    },
    'updateCustomer',
    undefined,
    { customerId: id }
  );
}

export async function deleteCustomer(id: string) {
  return withErrorHandler(
    async () => {
      // Chama a função especial criada no SQL Editor para uma limpeza profunda
      const { error } = await supabase.rpc('delete_customer_complete', { 
        target_customer_id: id 
      });
      
      if (error) throw handleSupabaseError(error, 'deleteCustomer - via RPC');
    },
    'deleteCustomer',
    undefined,
    { customerId: id }
  );
}
