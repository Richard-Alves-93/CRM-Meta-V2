import AppError from "../../errors/AppError";
import { getIO } from "../../libs/socket";
import { supabase } from "../../libs/supabaseClient";
import ShowTicketService from "./ShowTicketService";
import { getCompanyUuid } from "../../helpers/SupabaseIdResolver";

interface TransferRequest {
  ticketId: string | number;
  companyId: string | number;
  queueId: string | number | null;
}

const TransferTicketToQueueService = async ({
  ticketId,
  companyId,
  queueId
}: TransferRequest): Promise<any> => {
  const companyUuid = await getCompanyUuid(companyId);

  // 1. Verificar se o ticket existe
  const { data: ticketExists, error: fetchError } = await supabase
    .from("tickets")
    .select("id")
    .eq("id", ticketId)
    .eq("company_id", companyUuid)
    .maybeSingle();

  if (fetchError || !ticketExists) {
    throw new AppError("ERR_NO_TICKET_FOUND", 404);
  }

  // 2. Atualizar as informações do ticket
  const { error: updateError } = await supabase
    .from("tickets")
    .update({
      queue_id: queueId,
      status: "pending", // <-- fica como AGUARDANDO
      user_id: null,      // <-- libera para qualquer atendente da fila
      flow_stopped: null,
      flow_webhook: false,
      last_flow_id: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", ticketId);

  if (updateError) {
    throw new AppError("Erro ao transferir ticket no Supabase", 500);
  }

  // 3. Recarrega o ticket completo para emissão via websocket e retorno
  const ticket = await ShowTicketService(ticketId, companyId);

  // 4. Emite atualização em tempo real
  const io = getIO();
  io.to(String(companyId)).emit("ticket:update", {
    action: "update",
    ticket
  });

  return ticket;
};

export default TransferTicketToQueueService;
