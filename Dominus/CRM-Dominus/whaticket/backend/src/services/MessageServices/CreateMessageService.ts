import { supabase } from "../../libs/supabaseClient";
import { getIO } from "../../libs/socket";
import ShowTicketService from "../TicketServices/ShowTicketService";
import { getTicketUuid, getContactUuid } from "../../helpers/SupabaseIdResolver";

export interface MessageData {
  wid?: string;          // mapeado para message_id no Supabase
  ticketId: number | string;
  body: string;
  contactId?: string | number;
  fromMe?: boolean;
  read?: boolean;
  mediaType?: string;
  mediaUrl?: string;
  ack?: number;
  isPrivate?: boolean;   // não existe na tabela — ignorado silenciosamente
}

interface Request {
  messageData: MessageData;
  companyId: string | number;
}

const CreateMessageService = async ({
  messageData,
  companyId
}: Request): Promise<any> => {

  // Schema real da tabela messages no Supabase:
  // id, company_id, contact_id, body, from_me, read,
  // media_url, media_type, ack, created_at, message_id, legacy_id, ticket_id
  //
  // NOTA: Se ticket_id não existir ainda, execute no Supabase SQL Editor:
  // ALTER TABLE messages ADD COLUMN IF NOT EXISTS ticket_id BIGINT;
  // CREATE INDEX IF NOT EXISTS idx_messages_ticket_id ON messages(ticket_id);

  const ticketUuid = await getTicketUuid(messageData.ticketId);
  const contactUuid = messageData.contactId ? await getContactUuid(messageData.contactId) : null;

  const { data: newMessage, error: insertError } = await supabase
    .from("messages")
    .insert({
      message_id: messageData.wid || null,
      ticket_id: ticketUuid,
      company_id: companyId,
      contact_id: contactUuid,
      body: messageData.body,
      from_me: messageData.fromMe ?? false,
      read: messageData.read ?? false,
      media_type: messageData.mediaType || "chat",
      media_url: messageData.mediaUrl || null,
      ack: messageData.ack ?? 0,
    })
    .select()
    .single();

  if (insertError || !newMessage) {
    console.error("❌ Erro ao criar mensagem no Supabase:", insertError?.message);
    throw new Error("ERR_CREATING_MESSAGE");
  }

  // Carregar Ticket para emitir via Socket
  let ticket: any = null;
  try {
    ticket = await ShowTicketService(messageData.ticketId, companyId);
  } catch (e) {
    console.warn("[WARN] CreateMessageService: ticket não encontrado para socket emit");
  }

  const io = getIO();
  const formattedMessage = {
    ...newMessage,
    wid: newMessage.message_id,
    ticketId: newMessage.ticket_id,
    contactId: newMessage.contact_id,
    companyId: newMessage.company_id,
    fromMe: newMessage.from_me,
    mediaUrl: newMessage.media_url,
    mediaType: newMessage.media_type,
    createdAt: newMessage.created_at,
    ack: newMessage.ack,
    read: newMessage.read,
    isDeleted: false,
    isForwarded: false,
    isEdited: false,
    isPrivate: false,
  };

  const payload = {
    action: "create",
    message: { ...formattedMessage, ticket },
    ticket,
    contact: ticket?.contact || null,
  };

  io.of(String(companyId)).emit(`company-${companyId}-appMessage`, payload);
  io.of(String(companyId)).to(String(messageData.ticketId)).emit("appMessage", payload);

  return formattedMessage;
};

export default CreateMessageService;
