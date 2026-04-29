import type { proto, WASocket } from "baileys";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import { supabase } from "../../libs/supabaseClient";
import ShowTicketService from "../TicketServices/ShowTicketService";

const DeleteWhatsAppMessage = async (messageId: string, companyId: string | number): Promise<any> => {
  // 1. Buscar mensagem no Supabase
  const { data: message, error } = await supabase
    .from("messages")
    .select("*")
    .eq("message_id", messageId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error || !message) {
    throw new AppError("No message found with this ID.", 404);
  }

  // 2. Carregar Ticket via ShowTicketService (Supabase)
  const ticket = await ShowTicketService(message.ticket_id, companyId);

  // 3. Formatar para compatibilidade
  const formattedMessage = {
    ...message,
    id: message.id,
    ticketId: message.ticket_id,
    isPrivate: message.is_private || false,
    remoteJid: message.remote_jid || "" // fallback se necessário
  };

  if (!formattedMessage.isPrivate) {
    // 4. Deletar no WhatsApp via Baileys
    try {
      const wbot = await GetTicketWbot(ticket);
      
      const jsonStringToParse = typeof message.data_json === "string" 
        ? JSON.parse(message.data_json) 
        : message.data_json;

      if (jsonStringToParse?.key) {
        await (wbot as WASocket).sendMessage(jsonStringToParse.key.remoteJid, {
          delete: jsonStringToParse.key
        });
      }
    } catch (err) {
      console.error("❌ Erro ao deletar no WhatsApp:", err);
      throw new AppError("ERR_DELETE_WAPP_MSG");
    }

    // 5. Marcar como deletado no Supabase
    await supabase
      .from("messages")
      .update({ is_deleted: true })
      .eq("id", message.id);
  }

  return formattedMessage;
};

export default DeleteWhatsAppMessage;

