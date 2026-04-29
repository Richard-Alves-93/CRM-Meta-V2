import { supabase } from "../../libs/supabaseClient";
import ShowUserService from "../UserServices/ShowUserService";
import { getCompanyUuid, getUserUuid, getQueueUuid } from "../../helpers/SupabaseIdResolver";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  status?: string;
  userId: string | number;
  queueIds: (string | number)[];
  companyId: string | number;
  showAll?: string;
}

interface Response {
  tickets: any[];
  count: number;
  hasMore: boolean;
}

const ListTicketsService = async ({
  searchParam = "",
  pageNumber = "1",
  queueIds,
  status,
  showAll,
  userId,
  companyId
}: Request): Promise<Response> => {
  const user = await ShowUserService(userId, companyId);
  const limit = 40;
  const offset = limit * (+pageNumber - 1);

  // Resolve UUIDs for Supabase query
  const companyUuid = await getCompanyUuid(companyId);
  const userUuid = status === "open" ? await getUserUuid(userId) : null;

  // 1. Iniciar Query base no Supabase
  let query = supabase
    .from("tickets")
    .select(`
      *,
      contact:contacts(*),
      queue:queues(id, name, color),
      user:users(id, name)
    `, { count: "exact" })
    .eq("company_id", companyUuid);

  // 2. Aplicar Filtros de Status e Ownership
  if (status === "open") {
    query = query.eq("status", "open").eq("user_id", userUuid);
  } else if (status === "pending") {
    query = query.eq("status", "pending");
    // Se não for admin e não tiver permissão de ver tudo, filtra pelas filas do usuário
    if (user.profile !== "admin" && showAll !== "true") {
      if (queueIds && queueIds.length > 0) {
        const queueUuids = await Promise.all(queueIds.map(id => getQueueUuid(id)));
        query = query.in("queue_id", queueUuids);
      }
    }
  } else if (status === "closed") {
    query = query.eq("status", "closed");
  } else if (status === "group") {
    query = query.eq("is_group", true);
  }

  // 3. Busca por nome ou número (Sintaxe corrigida para relacionamentos)
  if (searchParam) {
    const search = `%${searchParam.trim()}%`;
    query = query.or(`last_message.ilike.${search},contact.name.ilike.${search}`);
  }

  // 4. Ordenação e Paginação
  query = query
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: tickets, count, error } = await query;

  if (error) {
    console.error("❌ Erro ao listar tickets no Supabase:", error.message);
    return { tickets: [], count: 0, hasMore: false };
  }

  // 5. Formatação para compatibilidade legada (camelCase)
  const formattedTickets = (tickets || []).map(t => ({
    ...t,
    contactId: t.contact_id,
    companyId: t.company_id,
    queueId: t.queue_id,
    userId: t.user_id,
    lastMessage: t.last_message,
    unreadMessages: t.unread_messages,
    updatedAt: t.updated_at
  }));

  const hasMore = (count || 0) > offset + formattedTickets.length;

  return {
    tickets: formattedTickets,
    count: count || 0,
    hasMore
  };
};

export default ListTicketsService;
