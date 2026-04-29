import { supabase } from "../../libs/supabaseClient";
import { getCompanyUuid, getUserUuid } from "../../helpers/SupabaseIdResolver";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  companyId: number | string;
  userId?: number | string;
}

interface Response {
  records: any[];
  count: number;
  hasMore: boolean;
}

const ListService = async ({
  searchParam = "",
  pageNumber = "1",
  companyId,
  userId
}: Request): Promise<Response> => {
  const companyUuid = await getCompanyUuid(companyId);
  const userUuid = userId ? await getUserUuid(userId) : null;
  const sanitizedSearchParam = searchParam.toLocaleLowerCase().trim();

  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  let query = supabase
    .from("quick_messages")
    .select("*", { count: "exact" })
    .eq("company_id", companyUuid);

  if (userUuid) {
    // Logic: visao = true OR user_id = userId
    query = query.or(`visao.eq.true,user_id.eq.${userUuid}`);
  }

  if (sanitizedSearchParam) {
    query = query.ilike("shortcode", `%${sanitizedSearchParam}%`);
  }

  query = query
    .order("shortcode", { ascending: true })
    .range(offset, offset + limit - 1);

  const { data: records, count, error } = await query;

  if (error) {
    console.error("❌ Erro ao listar mensagens rápidas no Supabase:", error.message);
    return { records: [], count: 0, hasMore: false };
  }

  const hasMore = (count || 0) > offset + (records?.length || 0);

  return {
    records: records || [],
    count: count || 0,
    hasMore
  };
};

export default ListService;
