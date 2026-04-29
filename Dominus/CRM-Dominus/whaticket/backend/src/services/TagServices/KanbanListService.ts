import { supabase } from "../../libs/supabaseClient";
import { getCompanyUuid } from "../../helpers/SupabaseIdResolver";

interface Request {
  companyId: number | string;
}

const KanbanListService = async ({
  companyId
}: Request): Promise<any[]> => {
  const companyUuid = await getCompanyUuid(companyId);

  const { data: tags, error } = await supabase
    .from("tags")
    .select("*")
    .eq("kanban", 1)
    .eq("company_id", companyUuid)
    .order("id", { ascending: true });

  if (error) {
    console.error("Erro ao buscar tags kanban no Supabase:", error);
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
    updatedAt: t.updated_at
  })) || [];
};

export default KanbanListService;