import { supabase } from "../../libs/supabaseClient";

type logType =
  | "access"
  | "create"
  | "closed"
  | "transfered"
  | "receivedTransfer"
  | "open"
  | "reopen"
  | "pending"
  | "nps"
  | "lgpd"
  | "queue"
  | "userDefine"
  | "delete"
  | "chatBot"
  | "autoClose"
  | "retriesLimitQueue"
  | "retriesLimitUserDefine"
  | "redirect";

interface Request {
  type: logType;
  ticketId: number | string;
  userId?: number | string;
  queueId?: number | string;
}

const CreateLogTicketService = async ({
  type,
  userId,
  ticketId,
  queueId
}: Request): Promise<void> => {
  const { error } = await supabase
    .from("ticket_logs")
    .insert({
      ticket_id: ticketId,
      user_id: userId || null,
      queue_id: queueId || null,
      type: type,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error("❌ Erro ao criar LogTicket no Supabase:", error.message);
  }
};

export default CreateLogTicketService;

