import { supabase } from "../../libs/supabaseClient";
import AppError from "../../errors/AppError";

const ShowWhatsAppServiceAdmin = async (
  id: string | number,
): Promise<any> => {
  const isIdUuid = typeof id === "string" && id.includes("-");

  const { data: whatsapp, error } = await supabase
    .from("whatsapps")
    .select(`
      *,
      queues:queues(id, name, color, greeting_message, integration_id, file_list_id, close_ticket, chatbots:chatbots(id, name, greeting_message, close_ticket)),
      prompt:prompts(id, name, prompt)
    `)
    .eq(isIdUuid ? "id" : "legacy_id", id)
    .maybeSingle();

  if (error || !whatsapp) {
    throw new AppError("ERR_NO_WAPP_FOUND", 404);
  }

  // Format to camelCase
  return {
    ...whatsapp,
    greetingMessage: whatsapp.greeting_message,
    farewellMessage: whatsapp.farewell_message,
    isDefault: whatsapp.is_default,
    queues: whatsapp.queues || [],
    prompt: whatsapp.prompt
  };
};

export default ShowWhatsAppServiceAdmin;
