import { supabase } from "../../libs/supabaseClient";
import AppError from "../../errors/AppError";
import Ticket from "../../models/Ticket";
import UpdateDeletedUserOpenTicketsStatus from "../../helpers/UpdateDeletedUserOpenTicketsStatus";

const DeleteUserService = async (
  id: string | number,
  companyId: string | number
): Promise<void> => {
  // 1. Verificar se usuário existe no Supabase
  const { data: user, error: findError } = await supabase
    .from("users")
    .select("id")
    .eq("id", id)
    .eq("company_id", companyId)
    .single();

  if (findError || !user) {
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }

  // 2. Tratar Tickets Abertos (Mantendo lógica legada se Tickets ainda estiverem no Sequelize)
  // Nota: Se Tickets já estiverem no Supabase, esta parte precisará de refatoração futura.
  const userOpenTickets = await Ticket.findAll({
    where: { userId: id, companyId, status: "open" }
  });

  if (userOpenTickets.length > 0) {
    UpdateDeletedUserOpenTicketsStatus(userOpenTickets, Number(companyId));
  }

  // 3. Deletar do Supabase (O Cascade no banco deve cuidar das tabelas vinculadas como user_queues)
  const { error: deleteError } = await supabase
    .from("users")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);

  if (deleteError) {
    throw new AppError(`Erro ao deletar usuário: ${deleteError.message}`);
  }
};

export default DeleteUserService;
