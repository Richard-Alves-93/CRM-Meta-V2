import type { WASocket, WAMessage } from "baileys";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import { supabase } from "../../libs/supabaseClient";
import ShowTicketService from "../TicketServices/ShowTicketService";

interface Request {
  messageId: string;
  body: string;
}

const EditWhatsAppMessage = async ({
  messageId,
  body,
}: Request): Promise<{ ticket: any, message: any }> => {

  // 1. Buscar mensagem no Supabase
  const { data: message, error } = await supabase
    .from("messages")
    .select("*")
    .eq("message_id", messageId)
    .maybeSingle();

  if (error || !message) {
    throw new AppError("No message found with this ID.", 404);
  }

  // 2. Carregar Ticket via ShowTicketService (Supabase)
  const ticket = await ShowTicketService(message.ticket_id, message.company_id);

  const wbot = await GetTicketWbot(ticket);

  const msg = typeof message.data_json === "string" 
    ? JSON.parse(message.data_json) 
    : message.data_json;

  if (!msg?.key) {
    throw new AppError("ERR_EDITING_WAPP_MSG_NO_KEY");
  }

  try {
    await wbot.sendMessage(msg.key.remoteJid, {
      text: body,
      edit: msg.key,
    }, {});

    // 3. Atualizar mensagem no Supabase
    const { data: updatedMessage } = await supabase
      .from("messages")
      .update({ body, is_edited: true })
      .eq("id", message.id)
      .select()
      .single();

    // 4. Atualizar ticket no Supabase
    await supabase
      .from("tickets")
      .update({ last_message: body, updated_at: new Date().toISOString() })
      .eq("id", ticket.id);

    // Recarregar ticket formatado
    const finalTicket = await ShowTicketService(ticket.id, message.company_id);
    
    return { ticket: finalTicket, message: updatedMessage };
  } catch (err) {
    console.error("❌ Erro ao editar no WhatsApp:", err);
    throw new AppError("ERR_EDITING_WAPP_MSG");
  }

};

export default EditWhatsAppMessage;

