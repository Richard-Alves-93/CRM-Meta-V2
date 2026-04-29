import Ticket from "../../models/Ticket";
import FindOrCreateATicketTrakingService from "./FindOrCreateATicketTrakingService";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import UpdateTicketService from "./UpdateTicketService";
import { supabase } from "../../libs/supabaseClient";
import { getCompanyUuid, getUserUuid } from "../../helpers/SupabaseIdResolver";

/** Extrai a 1ª nota (0–10) presente no texto. */
function extractScore0to10(text: string): number | null {
  const s = (text || "").toString().trim();
  if (!s) return null;

  const tokens = s.match(/\b\d{1,2}\b/g);
  if (!tokens) return null;

  for (const t of tokens) {
    const n = Number(t);
    if (Number.isInteger(n) && n >= 0 && n <= 10) return n;
  }
  return null;
}

type Params = {
  ticket: any; // Ajustado para aceitar o objeto ticket retornado pelo Supabase (any)
  companyId: number | string;
  text: string | undefined | null;
};

const HandleNpsReplyService = async ({
  ticket,
  companyId,
  text
}: Params): Promise<boolean> => {
  const score = extractScore0to10(text || "");
  if (score === null) return false;

  const tracking = await FindOrCreateATicketTrakingService({
    ticketId: ticket.id,
    companyId,
    whatsappId: ticket.whatsapp_id || ticket.whatsappId
  });

  // Apenas processa se o ticket estava aguardando avaliação (status 'nps')
  if (ticket.status !== "nps") return false;
  if (tracking.rated) return true; // Já foi avaliado, apenas ignora a nova mensagem

  console.log(`[NPS] Storing score: ${score} for ticket ${ticket.id}`);

  const companyUuid = await getCompanyUuid(companyId);
  const userUuid = tracking.userId ? await getUserUuid(tracking.userId) : null;

  // Salva a nota no Supabase
  const { error: ratingError } = await supabase
    .from("user_ratings")
    .insert({
      ticket_id: ticket.id,
      company_id: companyUuid,
      user_id: userUuid,
      rate: score,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (ratingError) {
    console.error("Erro ao salvar UserRating:", ratingError.message);
  }

  // Marca no tracking que já foi avaliado
  await supabase
    .from("ticket_trackings")
    .update({ rated: true, updated_at: new Date().toISOString() })
    .eq("id", tracking.id);

  // CHAMAR O SERVIÇO PRINCIPAL PARA FECHAR O TICKET CORRETAMENTE
  await UpdateTicketService({
    ticketId: ticket.id,
    companyId: ticket.companyId || ticket.company_id,
    ticketData: {
      status: "closed",
      sendFarewellMessage: false // Impede o envio de mensagens de despedida duplicadas
    }
  });

  // (Opcional) Agradecer ao usuário
  try {
    if (ticket.channel === "whatsapp" && (ticket.whatsapp?.status === "CONNECTED" || ticket.whatsapp?.status === "OPEN")) {
      await SendWhatsAppMessage({
        body: "\u200eObrigado pela sua avaliação! 🙏",
        ticket
      });
    }
  } catch (err) {
    // ignora erros no envio do agradecimento
  }

  return true; // Finaliza o fluxo
};

export default HandleNpsReplyService;