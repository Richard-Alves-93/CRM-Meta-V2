import removeAccents from "remove-accents";
import { supabase } from "../../libs/supabaseClient";
import { getCompanyUuid } from "../../helpers/SupabaseIdResolver";

interface Request {
  companyId: number | string;
  searchParam?: string;
  pageNumber?: string | number;
  kanban?: number;
  tagId?: number;
}

interface Response {
  tags: any[];
  count: number;
  hasMore: boolean;
}

const ListService = async ({
  companyId,
  searchParam = "",
  pageNumber = "1",
  kanban = 0,
  tagId = 0
}: Request): Promise<Response> => {
  const companyUuid = await getCompanyUuid(companyId);

  const limit = 20;
  const offset = limit * (+pageNumber - 1);
  const sanitizedSearchParam = removeAccents(searchParam.toLocaleLowerCase().trim());

  // Kanban no Supabase (0 = normal, 1 = kanban). Adaptar p/ boolean se necessário, assumindo tinyint/int16 = number
  let query = supabase
    .from("tags")
    .select(`
      id, name, color,
      contacts:contact_tags(contact:contacts(*)),
      ticketTags:ticket_tags(*)
    `, { count: "exact" })
    .eq("company_id", companyUuid)
    .eq("kanban", kanban);

  if (searchParam) {
    query = query.or(`name.ilike.%${sanitizedSearchParam}%,color.ilike.%${sanitizedSearchParam}%`);
  }

  if (Number(kanban) !== 0 && tagId > 0) {
    query = query.neq("id", tagId);
  }

  query = query
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  const { data: tags, count, error } = await query;

  if (error) {
    console.error("Erro ao listar tags no Supabase:", error);
    return { tags: [], count: 0, hasMore: false };
  }

  const hasMore = (count || 0) > offset + (tags?.length || 0);

  // Mapear p/ camelCase e achatar relações se necessário
  const formattedTags = tags?.map((t: any) => ({
    ...t,
    contacts: t.contacts ? t.contacts.map((ct: any) => ct.contact) : [],
    ticketTags: t.ticketTags || []
  })) || [];

  return {
    tags: formattedTags,
    count: count || 0,
    hasMore
  };
};

export default ListService;
