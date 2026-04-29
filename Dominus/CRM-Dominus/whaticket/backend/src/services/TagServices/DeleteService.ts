import AppError from "../../errors/AppError";
import { supabase } from "../../libs/supabaseClient";

const DeleteService = async (id: string | number): Promise<void> => {
  const { data: tag, error: fetchError } = await supabase
    .from("tags")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !tag) {
    throw new AppError("ERR_NO_TAG_FOUND", 404);
  }

  const { error: deleteError } = await supabase
    .from("tags")
    .delete()
    .eq("id", id);

  if (deleteError) {
    throw new AppError("Erro ao deletar tag no Supabase", 500);
  }
};

export default DeleteService;
