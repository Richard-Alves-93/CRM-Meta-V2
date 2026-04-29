import { supabase } from "../../libs/supabaseClient";
import AppError from "../../errors/AppError";

interface Params {
  companyId: string | number;
}

const SimpleListService = async ({ companyId }: Params): Promise<any[]> => {
  const { data: users, error } = await supabase
    .from("users")
    .select("id, name, email, queues:user_queues(queue:queues(id, name, color))")
    .eq("company_id", companyId)
    .order("name", { ascending: true });

  if (error || !users) {
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }

  // Formatação para compatibilidade legada
  return users.map(u => ({
    ...u,
    queues: u.queues?.map((uq: any) => uq.queue) || []
  }));
};

export default SimpleListService;
