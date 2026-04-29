import { supabase } from "../../libs/supabaseClient";
import { getCompanyUuid } from "../../helpers/SupabaseIdResolver";

interface Request {
  companyId: string | number;
  session?: number | string;
}

const ListWhatsAppsService = async ({
  session,
  companyId
}: Request): Promise<any[]> => {
  const companyUuid = await getCompanyUuid(companyId);

  let query = supabase
    .from("whatsapps")
    .select(`
      *,
      queues:queues(id, name, color, greeting_message, integration_id),
      prompt:prompts(id, name, prompt, voice, voice_key, voice_region)
    `)
    .eq("company_id", companyUuid);

  const { data: whatsapps, error } = await query;

  if (error) {
    console.error("❌ Erro ao listar Whatsapps no Supabase:", error.message);
    return [];
  }

  // Formatação para compatibilidade com o frontend (camelCase)
  return whatsapps.map(w => ({
    ...w,
    id: w.legacy_id || w.id, // Mantemos o ID legado se existir para não quebrar o frontend antigo
    companyId: w.company_id,
    greetingMessage: w.greeting_message,
    farewellMessage: w.farewell_message,
    isDefault: w.is_default,
    queues: w.queues || [],
    prompt: w.prompt
  }));
};

export default ListWhatsAppsService;
