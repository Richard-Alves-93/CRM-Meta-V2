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
  const { data, error } = await supabase.from('customers').select('*').order('nome');
  if (error) throw error;
  return data as Customer[];
}

export async function addCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
  const user = await getAuthUser();
  const validated = validateCustomerInput(customer);
  const { data, error } = await supabase.from('customers').insert({ ...validated, user_id: user.id } as any).select().single();
  if (error) throw handleSupabaseError(error, 'addCustomer');
  return data as Customer;
}

export async function updateCustomer(id: string, customer: Partial<Omit<Customer, 'id'>>) {
  return withErrorHandler(
    async () => {
      const validated = validateCustomerInput({ nome: 'placeholder', ...customer });
      const { nome: _ignored, ...updateData } = customer;
      const finalData = Object.keys(validated).reduce((acc, key) => {
        if (key in customer) acc[key] = (validated as any)[key];
        return acc;
      }, {} as Record<string, any>);
      const { error } = await supabase.from('customers').update(finalData).eq('id', id);
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
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw handleSupabaseError(error, 'deleteCustomer');
    },
    'deleteCustomer',
    undefined,
    { customerId: id }
  );
}
