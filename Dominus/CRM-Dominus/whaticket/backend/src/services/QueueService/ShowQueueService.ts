import { supabase } from "../../libs/supabaseClient";
import AppError from "../../errors/AppError";
import { getCompanyUuid } from "../../helpers/SupabaseIdResolver";

const ShowQueueService = async (
  queueId: number | string,
  companyId: number | string
): Promise<any> => {
  const companyUuid = await getCompanyUuid(companyId);

  const { data: queue, error } = await supabase
    .from("queues")
    .select(`
      *,
      chatbots:chatbots(*, user:users(id, name))
    `)
    .eq("id", queueId)
    .eq("company_id", companyUuid)
    .maybeSingle();

  if (error || !queue) {
    throw new AppError("ERR_QUEUE_NOT_FOUND");
  }

  // Formatting for legacy compatibility
  return {
    ...queue,
    companyId: queue.company_id,
    orderQueue: queue.order_queue,
    greetingMessage: queue.greeting_message,
    outOfHoursMessage: queue.out_of_hours_message,
    chatbots: queue.chatbots || []
  };
};

export default ShowQueueService;
