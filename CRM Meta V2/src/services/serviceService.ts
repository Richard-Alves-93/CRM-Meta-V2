import { supabase } from "@/integrations/supabase/client";
import { Service } from "@/lib/types";

export const serviceService = {
  async fetchServices(tenantId?: string): Promise<Service[]> {
    let query = supabase
      .from('services')
      .select('*')
      .order('nome', { ascending: true });

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Service[];
  },

  async addService(service: Omit<Service, 'id' | 'created_at'>): Promise<Service> {
    const { data, error } = await supabase
      .from('services')
      .insert(service)
      .select()
      .single();

    if (error) throw error;
    return data as Service;
  },

  async updateService(id: string, service: Partial<Omit<Service, 'id'>>): Promise<void> {
    const { error } = await supabase
      .from('services')
      .update(service)
      .eq('id', id);

    if (error) throw error;
  },

  async deleteService(id: string): Promise<void> {
    // Soft delete
    const { error } = await supabase
      .from('services')
      .update({ ativo: false })
      .eq('id', id);

    if (error) throw error;
  }
};
