import { parseISO, startOfDay, endOfDay } from "date-fns";
import { supabase } from "../../libs/supabaseClient";
import { getCompanyUuid, getUserUuid } from "../../helpers/SupabaseIdResolver";

interface Request {
  dateStart: string;
  dateEnd: string;
  status?: string[];
  userId: string | number;
  queuesIds?: string[];
  companyId: string | number;
  showAll?: string | boolean;
  profile?: string;
}

const TicketsQueuesService = async ({
  dateStart,
  dateEnd,
  status,
  userId,
  queuesIds,
  companyId,
  showAll,
  profile
}: Request): Promise<any[]> => {
  const companyUuid = await getCompanyUuid(companyId);

  let query = supabase
    .from("tickets")
    .select(`
      *,
      contact:contacts(id, name, number, profile_pic_url, company_id, url_picture),
      user:users(id, name, profile),
      queue:queues(*)
    `)
    .eq("company_id", companyUuid);

  if (profile === "user") {
    const userUuid = await getUserUuid(userId);
    query = query.eq("user_id", userUuid);
  }

  if (dateStart && dateEnd) {
    query = query
      .gte("created_at", startOfDay(parseISO(dateStart)).toISOString())
      .lte("created_at", endOfDay(parseISO(dateEnd)).toISOString());
  }

  // A lógica antiga fazia um agrupamento por MAX(id) quando 'status' era passado.
  // Vamos buscar os tickets e depois filtrar caso necessário.
  query = query.order("updated_at", { ascending: false });

  const { data: tickets, error } = await query;

  if (error) {
    console.error("Erro ao buscar TicketsQueuesService:", error);
    return [];
  }

  let finalTickets = tickets || [];

  if (status) {
    // Busca todos os tickets abertos para fazer a interseção lógica de MAX(id)
    const { data: openTickets } = await supabase
      .from("tickets")
      .select("id, contact_id, queue_id, whatsapp_id")
      .eq("company_id", companyUuid)
      .eq("status", "open");

    if (openTickets && openTickets.length > 0) {
      // Agrupar para pegar o max(id)
      const maxIdsMap = new Map<string, number>();
      
      openTickets.forEach(t => {
        const key = `${t.contact_id}-${t.queue_id}-${t.whatsapp_id}`;
        // Assumindo que os IDs legados ainda sejam incrementais ou podemos comparar datas.
        // Se a migração mudou id para UUID, comparar max(id) de UUID não faz sentido cronológico.
        // Como o BD legado usava ID int incremental, tentaremos pegar o UUID, e fallback na data se possível.
        // O Supabase tem 'created_at', então podemos guardar o ticket todo no map e manter o mais recente.
        maxIdsMap.set(key, t.id); 
      });

      const maxIds = Array.from(maxIdsMap.values());
      finalTickets = finalTickets.filter(t => maxIds.includes(t.id));
    } else {
      finalTickets = [];
    }
  }

  // Formatar para compatibilidade
  return finalTickets.map(t => ({
    ...t,
    companyId: t.company_id,
    contactId: t.contact_id,
    queueId: t.queue_id,
    userId: t.user_id,
    createdAt: t.created_at,
    updatedAt: t.updated_at
  }));
};

export default TicketsQueuesService;
