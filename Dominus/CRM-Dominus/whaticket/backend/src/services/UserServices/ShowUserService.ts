import { supabase } from "../../libs/supabaseClient";
import AppError from "../../errors/AppError";
import { getCompanyUuid, getUserUuid } from "../../helpers/SupabaseIdResolver";

const ShowUserService = async (id: string | number, companyId?: string | number) => {
  // Resolve UUIDs for Supabase query
  const userUuid = await getUserUuid(id);
  const companyUuid = companyId ? await getCompanyUuid(companyId) : null;

  // FIX: Usando nomes de tabelas com case correto (Users, Companies, UserQueues)
  let query = supabase
    .from("users")
    .select(`
      *,
      company:companies(*, settings:companies_settings(*)),
      queues:user_queues(queue:queues(*))
    `)
    .eq("id", userUuid);

  if (companyUuid) {
    query = query.eq("company_id", companyUuid);
  }

  const { data: user, error } = await query.maybeSingle();

  if (error || !user) {
    console.error("Erro no ShowUserService:", error);
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }

  return {
    ...user,
    companyId: user.company_id,
    queues: user.queues?.map((uq: any) => uq.queue) || []
  };
};

export default ShowUserService;