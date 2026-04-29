import { supabase } from "../../libs/supabaseClient";
import { getCompanyUuid } from "../../helpers/SupabaseIdResolver";

interface Request {
  searchParam?: string;
  pageNumber?: string | number;
  companyId: string | number;
}

interface Response {
  prompts: any[];
  count: number;
  hasMore: boolean;
}

const ListPromptsService = async ({
  searchParam = "",
  pageNumber = "1",
  companyId,
}: Request): Promise<Response> => {
  const companyUuid = await getCompanyUuid(companyId);
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  let query = supabase
    .from("prompts")
    .select(`
      *,
      queue:queues(id, name)
    `, { count: "exact" })
    .eq("company_id", companyUuid);

  if (searchParam) {
    query = query.ilike("name", `%${searchParam}%`);
  }

  query = query
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  const { data: prompts, count, error } = await query;

  if (error) {
    console.error("❌ Erro ao listar prompts no Supabase:", error.message);
    return { prompts: [], count: 0, hasMore: false };
  }

  const hasMore = (count || 0) > offset + (prompts?.length || 0);

  return {
    prompts: prompts || [],
    count: count || 0,
    hasMore,
  };
};

export default ListPromptsService;