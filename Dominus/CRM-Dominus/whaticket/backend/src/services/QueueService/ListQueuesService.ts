import { supabase } from "../../libs/supabaseClient";
import { getCompanyUuid } from "../../helpers/SupabaseIdResolver";

interface Request {
  companyId: number | string;
}

const ListQueuesService = async ({ companyId }: Request): Promise<any[]> => {
  const companyUuid = await getCompanyUuid(companyId);

  const { data: queues, error } = await supabase
    .from("queues")
    .select("*")
    .eq("company_id", companyUuid)
    .order("order_queue", { ascending: true });

  if (error) {
    console.error("❌ Erro ao listar filas no Supabase:", error.message);
    return [];
  }

  // Formatação para compatibilidade com o frontend (camelCase)
  return queues.map(q => ({
    ...q,
    companyId: q.company_id,
    orderQueue: q.order_queue,
    greetingMessage: q.greeting_message,
    outOfHoursMessage: q.out_of_hours_message
  }));
};

export default ListQueuesService;
