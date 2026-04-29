import { supabase } from "../../libs/supabaseClient";
import ShowTicketService from "../TicketServices/ShowTicketService";

const ShowMessageService = async (messageId: string): Promise<any> => {
  const { data: message, error } = await supabase
    .from("messages")
    .select("*")
    .eq("message_id", messageId)
    .maybeSingle();

  if (error || !message) {
    return undefined;
  }

  return {
    ...message,
    ticketId: message.ticket_id,
    companyId: message.company_id,
    contactId: message.contact_id,
  };
}

export const GetWhatsAppFromMessage = async (message: any): Promise<number | null> => {
  if (!message.ticketId || !message.companyId) return null;
  
  try {
    const ticket = await ShowTicketService(message.ticketId, message.companyId);
    return ticket.whatsapp_id || ticket.whatsappId;
  } catch (e) {
    return null;
  }
}

export default ShowMessageService;

