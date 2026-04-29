import { supabase } from "../../libs/supabaseClient";

interface Request {
  session?: number | string;
}

const ListAllWhatsAppsService = async ({
  session,
}: Request): Promise<any[]> => {
  let query = supabase
    .from("whatsapps")
    .select(`
      *,
      queues:queues(id, name, color, greeting_message)
    `);

  const { data: whatsapps, error } = await query;

  if (error) {
    console.error("❌ Erro ao listar todos os Whatsapps no Supabase:", error.message);
    return [];
  }

  return whatsapps.map(w => ({
    ...w,
    queues: w.queues || []
  }));
};

export default ListAllWhatsAppsService;
