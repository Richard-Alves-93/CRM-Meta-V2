import { supabase } from "../../libs/supabaseClient";
import AppError from "../../errors/AppError";
import { getCompanyUuid } from "../../helpers/SupabaseIdResolver";

const ShowWhatsAppService = async (
  id: string | number,
  companyId: number | string,
  session?: any
): Promise<any> => {
  const companyUuid = await getCompanyUuid(companyId);
  const isIdUuid = typeof id === "string" && id.includes("-");

  let query = supabase
    .from("whatsapps")
    .select(`
      *,
      queues:queues(id, name, color, greeting_message, integration_id),
      prompt:prompts(id, name, prompt, voice, voice_key, voice_region)
    `)
    .eq(isIdUuid ? "id" : "legacy_id", id)
    .eq("company_id", companyUuid);

  const { data: whatsapp, error } = await query.maybeSingle();

  if (error || !whatsapp) {
    throw new AppError("ERR_NO_WAPP_FOUND", 404);
  }

  // Formatação para compatibilidade com o frontend (camelCase)
  return {
    ...whatsapp,
    id: whatsapp.legacy_id || whatsapp.id,
    companyId: whatsapp.company_id,
    greetingMessage: whatsapp.greeting_message,
    farewellMessage: whatsapp.farewell_message,
    isDefault: whatsapp.is_default,
    queues: whatsapp.queues || [],
    prompt: whatsapp.prompt
  };
};

export default ShowWhatsAppService;
