import { supabase } from "../../libs/supabaseClient";
import AppError from "../../errors/AppError";
import ShowUserService from "./ShowUserService";

interface Request {
  userId: string | number;
  defaultTicketsManagerWidth: number | string;
}

const ToggleChangeWidthService = async ({
  userId,
  defaultTicketsManagerWidth
}: Request): Promise<any> => {
  const { error } = await supabase
    .from("users")
    .update({
      default_tickets_manager_width: Number(defaultTicketsManagerWidth)
    })
    .eq("id", userId);

  if (error) {
    throw new AppError(`Erro ao atualizar preferência de largura: ${error.message}`);
  }

  // Retorna o usuário completo via Supabase para atualizar o estado no frontend
  return ShowUserService(userId);
};

export default ToggleChangeWidthService;
