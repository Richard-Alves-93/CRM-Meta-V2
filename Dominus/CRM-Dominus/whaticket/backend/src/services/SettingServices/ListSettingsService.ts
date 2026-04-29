import { supabase } from "../../libs/supabaseClient";
import { getCompanyUuid } from "../../helpers/SupabaseIdResolver";

interface Request {
  companyId: number | string;
}

const ListSettingsService = async ({
  companyId
}: Request): Promise<any[] | undefined> => {
  const companyUuid = await getCompanyUuid(companyId);

  const { data: settings, error } = await supabase
    .from("settings")
    .select("*")
    .eq("company_id", companyUuid);

  if (error) {
    console.error("Erro ao listar settings:", error);
    return [];
  }

  // Formatando para camelCase para manter compatibilidade
  return settings?.map((s: any) => ({
    ...s,
    companyId: s.company_id,
    createdAt: s.created_at,
    updatedAt: s.updated_at
  }));
};

export default ListSettingsService;
