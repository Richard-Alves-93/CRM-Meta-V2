import { supabase } from "../../libs/supabaseClient";
import { getCompanyUuid } from "../../helpers/SupabaseIdResolver";

interface Request {
  companyId: number | string;
  session?: number | string;
  channel?: string;
}

const ListFilterWhatsAppsService = async ({
  session,
  companyId,
  channel = "whatsapp"
}: Request): Promise<any[]> => {
  const companyUuid = await getCompanyUuid(companyId);

  let query = supabase
    .from("whatsapps")
    .select("*")
    .eq("company_id", companyUuid)
    .eq("channel", channel);

  const { data: whatsapps, error } = await query;

  if (error) {
    console.error("❌ Erro ao listar Whatsapps filtrados no Supabase:", error.message);
    return [];
  }

  return whatsapps;
};

export default ListFilterWhatsAppsService;
