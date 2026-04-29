import { supabase } from "../../libs/supabaseClient";
import AppError from "../../errors/AppError";
import ShowTicketService from "../TicketServices/ShowTicketService";
import { getTicketUuid } from "../../helpers/SupabaseIdResolver";

interface Request {
  ticketId: string | number;
  companyId: string | number;
  pageNumber?: string;
  queues?: (string | number)[];
  searchParam?: string;
  user?: any;
}

interface Response {
  messages: any[];
  ticket: any;
  count: number;
  hasMore: boolean;
}

const ListMessagesService = async ({
  pageNumber = "1",
  ticketId,
  companyId,
  searchParam = "",
}: Request): Promise<Response> => {
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  // 1. Carregar o ticket do Supabase (valida company_id internamente)
  const ticket = await ShowTicketService(ticketId, companyId);

  if (!ticket) {
    throw new AppError("ERR_NO_TICKET_FOUND", 404);
  }

  // 2. Buscar mensagens do Supabase usando ticket_id (UUID)
  const ticketUuid = await getTicketUuid(ticketId);

  let query = supabase
    .from("messages")
    .select("*", { count: "exact" })
    .eq("ticket_id", ticketUuid)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (searchParam.trim()) {
    query = query.ilike("body", `%${searchParam.trim()}%`);
  }

  const { data: messages, count, error } = await query;

  if (error) {
    console.error("❌ Erro ao listar mensagens no Supabase:", error.message);
    throw new AppError("ERR_FETCHING_MESSAGES", 500);
  }

  // 3. Formatar para compatibilidade com frontend (camelCase)
  const formattedMessages = (messages || []).map(m => ({
    ...m,
    fromMe: m.from_me,
    mediaUrl: m.media_url,
    mediaType: m.media_type,
    ticketId: m.ticket_id,
    contactId: m.contact_id,
    companyId: m.company_id,
    createdAt: m.created_at,
    // Campo legado esperado pelo frontend
    wid: m.message_id,
    ack: m.ack || 0,
    isDeleted: false,
    isForwarded: false,
    isEdited: false,
    isPrivate: false,
    read: m.read || false,
  })).reverse(); // crescente para exibição

  const hasMore = (count || 0) > offset + formattedMessages.length;

  return {
    messages: formattedMessages,
    ticket,
    count: count || 0,
    hasMore,
  };
};

export default ListMessagesService;
