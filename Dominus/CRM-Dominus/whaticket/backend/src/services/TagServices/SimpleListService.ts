import { supabase } from "../../libs/supabaseClient";
import { getCompanyUuid } from "../../helpers/SupabaseIdResolver";

interface Request {
  companyId: number | string;
  searchParam?: string;
  kanban?: number;
}

const ListService = async ({
  companyId,
  searchParam,
  kanban = 0
}: Request): Promise<any[]> => {
  const companyUuid = await getCompanyUuid(companyId);

  let query = supabase
    .from("tags")
    .select(`
      *,
      contact_tags(id)
    `)
    .eq("company_id", companyUuid)
    .eq("kanban", kanban);

  if (searchParam) {
    query = query.or(`name.ilike.%${searchParam}%,color.ilike.%${searchParam}%`);
  }

  query = query.order("name", { ascending: true });

  const { data: tags, error } = await query;

  if (error) {
    console.error("Erro ao listar tags no Supabase:", error);
    return [];
  }

  return tags?.map(t => ({
    ...t,
    companyId: t.company_id,
    timeLane: t.time_lane,
    nextLaneId: t.next_lane_id,
    greetingMessageLane: t.greeting_message_lane,
    rollbackLaneId: t.rollback_lane_id,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    contactsCount: t.contact_tags ? t.contact_tags.length : 0
  })) || [];
};

export default ListService;
