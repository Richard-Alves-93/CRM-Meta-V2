import { supabase } from "../../libs/supabaseClient";
import ShowTicketService from "./ShowTicketService";
import AppError from "../../errors/AppError";

const FindOrCreateTicketService = async (
  contact: any,
  whatsapp: any,
  unreadMessages: number,
  companyId: string | number,
  queueId: string | number | null = null,
  userId: string | number | null = null,
  groupContact?: any,
  channel?: string,
  isImported?: boolean,
  isForward?: boolean,
  settings?: any,
  isTransfered?: boolean,
  isCampaign?: boolean
): Promise<any> => {

  const resolvedCompanyId = whatsapp.company_id || whatsapp.companyId || companyId;
  const targetContactId = groupContact ? groupContact.id : contact.id;

  // 1. Buscar ticket aberto no Supabase
  let { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("contact_id", targetContactId)
    .eq("company_id", resolvedCompanyId)
    .in("status", ["open", "pending", "group", "nps", "lgpd"])
    .maybeSingle();

  if (ticket) {
    // Atualizar unread messages
    await supabase
      .from("tickets")
      .update({ unread_messages: unreadMessages, updated_at: new Date().toISOString() })
      .eq("id", ticket.id);

    return ShowTicketService(ticket.id, resolvedCompanyId);
  }

  // 2. Se não existir, criar um novo

  const { data: newTicket, error: createError } = await supabase
    .from("tickets")
    .insert({
      contact_id: targetContactId,
      company_id: resolvedCompanyId,
      whatsapp_id: whatsapp.id,
      user_id: userId || null,
      queue_id: queueId || null,
      status: groupContact ? "group" : "pending",
      channel: channel || "whatsapp",
      unread_messages: unreadMessages,
      is_group: !!groupContact,
      legacy_id: Math.floor(Date.now() / 1000)
    })
    .select()
    .single();

  if (createError || !newTicket) {
    throw new AppError(`Erro ao criar ticket no Supabase: ${createError?.message}`);
  }

  return ShowTicketService(newTicket.id, resolvedCompanyId);
};

export default FindOrCreateTicketService;
