import { supabase } from "../../libs/supabaseClient";
import AppError from "../../errors/AppError";
import ShowTicketService from "./ShowTicketService";

interface Request {
  contactId: string | number;
  status: string;
  userId: string | number;
  companyId: string | number;
  queueId?: string | number;
  whatsappId?: string | number;
  channel?: string;
}

const CreateTicketService = async ({
  contactId,
  status,
  userId,
  queueId,
  companyId,
  whatsappId,
  channel = "whatsapp"
}: Request): Promise<any> => {

  // 1. Verificar se já existe um ticket aberto/pendente para este contato no Supabase
  const { data: existingTicket } = await supabase
    .from("tickets")
    .select("id")
    .eq("contact_id", contactId)
    .eq("company_id", companyId)
    .in("status", ["open", "pending", "group"])
    .maybeSingle();

  if (existingTicket) {
    return ShowTicketService(existingTicket.id, companyId);
  }

  // 2. Criar novo Ticket no Supabase
  // Geramos um ID numérico incremental baseado no timestamp ou sequencial (fallback para legacy_id se necessário)
  // Mas aqui usaremos o BIGINT autoincrement se estiver configurado, ou mandamos o próximo ID.
  const { data: newTicket, error: createError } = await supabase
    .from("tickets")
    .insert({
      company_id: companyId,
      contact_id: contactId,
      user_id: userId || null,
      queue_id: queueId || null,
      whatsapp_id: whatsappId || null,
      status: status || "pending",
      channel: channel,
      is_active_demand: true,
      id: Math.floor(Date.now() / 1000) // Gerando um ID numérico único baseado em epoch para o BIGINT
    })
    .select()
    .single();

  if (createError || !newTicket) {
    throw new AppError(`Erro ao criar ticket no Supabase: ${createError?.message}`);
  }

  return ShowTicketService(newTicket.id, companyId);
};

export default CreateTicketService;