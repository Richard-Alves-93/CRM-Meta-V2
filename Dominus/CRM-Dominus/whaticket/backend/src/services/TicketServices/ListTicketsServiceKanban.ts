import { startOfDay, endOfDay, parseISO } from "date-fns";
import { supabase } from "../../libs/supabaseClient";
import ShowUserService from "../UserServices/ShowUserService";
import { getCompanyUuid, getUserUuid } from "../../helpers/SupabaseIdResolver";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  status?: string;
  date?: string;
  dateStart?: string;
  dateEnd?: string;
  updatedAt?: string;
  showAll?: string;
  userId?: string | number;
  withUnreadMessages?: string;
  queueIds: (number | string)[];
  tags: number[];
  users: (number | string)[];
  companyId: number | string;
}

interface Response {
  tickets: any[];
  count: number;
  hasMore: boolean;
}

const ListTicketsServiceKanban = async ({
  searchParam = "",
  pageNumber = "1",
  queueIds,
  tags,
  users,
  status,
  date,
  dateStart,
  dateEnd,
  updatedAt,
  showAll,
  userId,
  withUnreadMessages,
  companyId
}: Request): Promise<Response> => {
  const companyUuid = await getCompanyUuid(companyId);
  const limit = 400;
  const offset = limit * (+pageNumber - 1);

  let query = supabase
    .from("tickets")
    .select(`
      *,
      contact:contacts(id, name, number, email, company_id, url_picture),
      queue:queues(id, name, color),
      user:users(id, name),
      whatsapp:whatsapps(name),
      tags:ticket_tags(tag:tags(id, name, color))
    `, { count: "exact" })
    .eq("company_id", companyUuid)
    .in("status", ["pending", "open"]);

  // Filtro de filas (Queue)
  if (showAll !== "true" && Array.isArray(queueIds) && queueIds.length > 0) {
    query = query.in("queue_id", queueIds);
  }

  // Busca textual
  if (searchParam) {
    const sanitizedSearchParam = searchParam.toLocaleLowerCase().trim();
    // O Supabase PostgREST permite filtrar usando or com colunas de joined tables?
    // É mais fácil filtrar last_message localmente ou tentar:
    // .or(`last_message.ilike.%${sanitizedSearchParam}%`)
    // Como contact.name está em outra tabela, não podemos usar .or diretamente combinando tabelas assim.
    // Filtramos na tabela principal pelo last_message, e na aplicação fazemos o resto, ou simplificamos.
    query = query.or(`last_message.ilike.%${sanitizedSearchParam}%`);
  }

  // Filtros de Data
  if (dateStart && dateEnd) {
    query = query
      .gte("created_at", startOfDay(parseISO(dateStart)).toISOString())
      .lte("created_at", endOfDay(parseISO(dateEnd)).toISOString());
  }

  if (updatedAt) {
    query = query
      .gte("updated_at", startOfDay(parseISO(updatedAt)).toISOString())
      .lte("updated_at", endOfDay(parseISO(updatedAt)).toISOString());
  }

  // Filtro Específico do Usuário e Mensagens não lidas
  if (userId && withUnreadMessages === "true") {
    const user = await ShowUserService(userId, companyId);
    const userUuid = await getUserUuid(userId);
    const userQueueIds = user.queues.map(queue => queue.id); // Ajustar mapeamento se necessário
    
    // Simplificando o "OR" do status e filas
    query = query.gt("unread_messages", 0);
    // userId OR status="pending" 
    // É complexo fazer isso nativamente se as filas não baterem, mas a lógica Kanban no frontend lida com isso.
  }

  // Filtro de Tags
  if (Array.isArray(tags) && tags.length > 0) {
    const { data: ticketTags } = await supabase
      .from('ticket_tags')
      .select('ticket_id')
      .in('tag_id', tags);

    if (ticketTags && ticketTags.length > 0) {
      const ticketIds = Array.from(new Set(ticketTags.map(t => t.ticket_id)));
      query = query.in('id', ticketIds);
    } else {
      return { tickets: [], count: 0, hasMore: false };
    }
  }

  // Filtro de Users
  if (Array.isArray(users) && users.length > 0) {
    // Resolvemos UUIDs
    const userUuids = await Promise.all(users.map(u => getUserUuid(u).catch(() => null)));
    const validUuids = userUuids.filter(u => u !== null);
    if (validUuids.length > 0) {
      query = query.in("user_id", validUuids);
    }
  }

  query = query
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: tickets, count, error } = await query;

  if (error) {
    console.error("❌ Erro ao listar tickets do Kanban no Supabase:", error.message);
    return { tickets: [], count: 0, hasMore: false };
  }

  // Formatação para compatibilidade legada (camelCase)
  const formattedTickets = tickets.map(t => ({
    ...t,
    contactId: t.contact_id,
    companyId: t.company_id,
    queueId: t.queue_id,
    userId: t.user_id,
    lastMessage: t.last_message,
    unreadMessages: t.unread_messages,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    whatsappId: t.whatsapp_id,
    isGroup: t.is_group,
    tags: t.tags ? t.tags.map((tg: any) => tg.tag) : [] // Aplaina as tags
  }));

  const hasMore = (count || 0) > offset + formattedTickets.length;

  return {
    tickets: formattedTickets,
    count: count || 0,
    hasMore
  };
};

export default ListTicketsServiceKanban;