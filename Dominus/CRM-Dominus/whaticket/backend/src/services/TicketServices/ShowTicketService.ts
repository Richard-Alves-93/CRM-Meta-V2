import { supabase } from "../../libs/supabaseClient";
import AppError from "../../errors/AppError";

const ShowTicketService = async (
  id: string | number,
  companyId: string | number
): Promise<any> => {
  const isIdUuid = typeof id === "string" && id.includes("-");

  const { data: ticket, error } = await supabase
    .from("tickets")
    .select(`
      *,
      contact:contacts(*),
      queue:queues(id, name, color),
      user:users(id, name, email, profile),
      company:companies(id, name)
    `)
    .eq(isIdUuid ? "id" : "legacy_id", id)
    .maybeSingle();

  if (error || !ticket) {
    console.log(`[DEBUG] ShowTicketService: Ticket ${id} not found.`);
    throw new AppError("ERR_NO_TICKET_FOUND", 404);
  }

  // Validação Multi-tenant (Pelo UUID da empresa no Supabase)
  // Nota: O companyId vindo do middleware isAuth já deve ser o UUID se o usuário estiver logado via Supabase
  if (String(ticket.company_id) !== String(companyId)) {
    throw new AppError("Não é possível consultar registros de outra empresa", 403);
  }

  // Formatação para compatibilidade com o frontend (camelCase)
  const formattedTicket = {
    ...ticket,
    contactId: ticket.contact_id,
    companyId: ticket.company_id,
    queueId: ticket.queue_id,
    userId: ticket.user_id,
    whatsappId: ticket.whatsapp_id,
    lastMessage: ticket.last_message,
    unreadMessages: ticket.unread_messages,
    isActiveDemand: ticket.is_active_demand,
    updatedAt: ticket.updated_at,
    createdAt: ticket.created_at
  };

  return formattedTicket;
};

export default ShowTicketService;