import { supabase } from "../../libs/supabaseClient";
import { getIO } from "../../libs/socket";
import AppError from "../../errors/AppError";
import ShowTicketService from "./ShowTicketService";
import { getUserUuid, getCompanyUuid } from "../../helpers/SupabaseIdResolver";

interface TicketData {
  status?: string;
  userId?: string | number | null;
  queueId?: string | number | null;
  contactId?: string | number;
  isBot?: boolean;
  unreadMessages?: number;
  isTransfered?: boolean;
  sendFarewellMessage?: boolean;
  amountUsedBotQueues?: number;
  lastMessage?: string;
  integrationId?: string | number | null;
  useIntegration?: boolean;
  msgTransfer?: string;
  whatsappId?: string | number;
  [key: string]: any; // allow additional dynamic fields without breaking callers
}

interface Request {
  ticketData: TicketData;
  ticketId: string | number;
  companyId: string | number;
}

const UpdateTicketService = async ({
  ticketData,
  ticketId,
  companyId
}: Request): Promise<any> => {
  const io = getIO();

  // 1. Carregar Ticket Atual (já do Supabase)
  const ticket = await ShowTicketService(ticketId, companyId);
  const oldStatus = ticket.status;
  const oldUserId = ticket.userId;

  // 2. Preparar Dados para Update
  const { status, userId, queueId, isBot, unreadMessages, isTransfered } = ticketData;

  const dataToUpdate: any = {
    updated_at: new Date().toISOString()
  };

  if (status) dataToUpdate.status = status;
  if (userId !== undefined) {
    dataToUpdate.user_id = userId ? await getUserUuid(userId) : null;
  }
  if (queueId !== undefined) {
    // Note: Assuming we have a getQueueUuid or similar if needed, 
    // but for now let's use the provided ID if it's already UUID or handle it.
    dataToUpdate.queue_id = queueId; 
  }
  if (isBot !== undefined) dataToUpdate.is_bot = isBot;
  if (unreadMessages !== undefined) dataToUpdate.unread_messages = unreadMessages;
  
  // Lógica de "Assumir": Se o status mudar para open e não tiver dono, ou se for forçado
  if (status === "open" && !dataToUpdate.user_id) {
    // Mantém o dono atual se já tiver um, ou assume no controller
  }

  // 3. Atualizar no Supabase
  const { error: updateError } = await supabase
    .from("tickets")
    .update(dataToUpdate)
    .eq("id", ticketId)
    .eq("company_id", companyId);

  if (updateError) {
    throw new AppError(`Erro ao atualizar ticket no Supabase: ${updateError.message}`);
  }

  // 4. Carregar Ticket Atualizado
  const updatedTicket = await ShowTicketService(ticketId, companyId);

  // 5. Notificar via Socket (Frontend depende disso para atualizar a lista)
  io.of(String(companyId)).emit(`company-${companyId}-ticket`, {
    action: "update",
    ticket: updatedTicket
  });

  // Se o status mudou ou o dono mudou, notificamos a remoção da lista anterior (ex: pending -> open)
  if (updatedTicket.status !== oldStatus || updatedTicket.userId !== oldUserId) {
    io.of(String(companyId)).emit(`company-${companyId}-ticket`, {
      action: "delete",
      ticketId: updatedTicket.id
    });
  }

  return { ticket: updatedTicket, oldStatus, oldUserId };
};

export default UpdateTicketService;
