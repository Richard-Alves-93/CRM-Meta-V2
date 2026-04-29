// @ts-nocheck
import { supabase } from "../../libs/supabaseClient";

interface Request {
  searchParam?: string;
  pageNumber?: string | number;
  companyId?: number | string;
  profile?: string;
}

interface Response {
  users: any[];
  count: number;
  hasMore: boolean;
}

const ListUsersService = async ({
  searchParam = "",
  pageNumber = "1",
  companyId,
  profile
}: Request): Promise<Response> => {
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const companyUuid = await getCompanyUuid(companyId);

  let query = supabase
    .from("users")
    .select(`
      id, name, email, profile, online, 
      start_work, end_work, profile_image, 
      last_login, is_active,
      company:companies(id, name),
      queues:user_queues(queue:queues(id, name, color))
    `, { count: "exact" })
    .eq("company_id", companyUuid)
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (profile) {
    query = query.eq("profile", profile);
  }

  if (searchParam) {
    query = query.or(`name.ilike.%${searchParam}%,email.ilike.%${searchParam}%`);
  }

  const { data: users, count, error } = await query;

  if (error) {
    console.error("❌ Erro ao listar usuários no Supabase:", error.message);
    return { users: [], count: 0, hasMore: false };
  }

  // Formatação para manter compatibilidade com o frontend (campos em camelCase se necessário)
  const formattedUsers = users.map(u => ({
    ...u,
    companyId: (u.company as any)?.[0]?.id || (u.company as any)?.id,
    startWork: u.start_work,
    endWork: u.end_work,
    profileImage: u.profile_image,
    lastLogin: u.last_login,
    queues: u.queues?.map((uq: any) => uq.queue) || []
  }));

  const hasMore = (count || 0) > offset + formattedUsers.length;

  return {
    users: formattedUsers,
    count: count || 0,
    hasMore
  };
};

export default ListUsersService;
