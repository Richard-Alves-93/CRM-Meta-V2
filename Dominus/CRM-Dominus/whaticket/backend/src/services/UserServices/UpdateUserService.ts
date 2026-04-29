import * as Yup from "yup";
import { hash } from "bcryptjs";
import { supabase } from "../../libs/supabaseClient";
import AppError from "../../errors/AppError";
import ShowUserService from "./ShowUserService";

interface UserData {
  email?: string;
  password?: string;
  name?: string;
  profile?: string;
  companyId?: number | string;
  queueIds?: (number | string)[];
  startWork?: string;
  endWork?: string;
  whatsappId?: number | string | null;
  allTicket?: string;
  defaultTheme?: string;
  defaultMenu?: string;
  allowGroup?: boolean;
  allHistoric?: string;
  allUserChat?: string;
  userClosePendingTicket?: string;
  showDashboard?: string;
  defaultTicketsManagerWidth?: number;
  allowRealTime?: string;
  allowConnections?: string;
  profileImage?: string;
  canViewAllContacts?: boolean;
}

interface UpdateUserRequest {
  userData: UserData;
  userId: string | number;
  companyId: number | string;
  requestUserId?: number | string;
}

const UpdateUserService = async ({
  userData,
  userId,
  companyId,
  requestUserId
}: UpdateUserRequest): Promise<any> => {
  const user = await ShowUserService(userId, companyId);

  const schema = Yup.object().shape({
    name: Yup.string().min(2),
    email: Yup.string().email(),
    profile: Yup.string(),
    password: Yup.string()
  });

  const { name, email, password, profile, queueIds } = userData;

  try {
    await schema.validate({ name, email, password, profile });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const dataToUpdate: any = {
    updated_at: new Date().toISOString()
  };

  if (name) dataToUpdate.name = name;
  if (email) dataToUpdate.email = email;
  if (profile) dataToUpdate.profile = profile;
  if (password) {
    dataToUpdate.password_hash = await hash(password, 8);
  }
  if (userData.startWork) dataToUpdate.start_work = userData.startWork;
  if (userData.endWork) dataToUpdate.end_work = userData.endWork;
  if (userData.allTicket) dataToUpdate.all_ticket = userData.allTicket;
  if (userData.profileImage) dataToUpdate.profile_image = userData.profileImage;
  if (userData.defaultTheme) dataToUpdate.default_theme = userData.defaultTheme;
  if (userData.defaultMenu) dataToUpdate.default_menu = userData.defaultMenu;
  if (userData.allowGroup !== undefined) dataToUpdate.allow_group = userData.allowGroup;
  if (userData.canViewAllContacts !== undefined) dataToUpdate.can_view_all_contacts = userData.canViewAllContacts;
  if (userData.whatsappId !== undefined) dataToUpdate.whatsapp_id = userData.whatsappId;

  // 1. Atualizar Usuário
  const { error: updateError } = await supabase
    .from("users")
    .update(dataToUpdate)
    .eq("id", userId)
    .eq("company_id", companyId);

  if (updateError) {
    throw new AppError(`Erro ao atualizar usuário: ${updateError.message}`);
  }

  // 2. Atualizar Filas (UserQueues)
  if (queueIds !== undefined) {
    // Remove vínculos antigos
    await supabase.from("user_queues").delete().eq("user_id", userId);
    
    // Insere novos vínculos
    const uqData = queueIds.map(qId => ({
      user_id: userId,
      queue_id: qId
    }));
    
    if (uqData.length > 0) {
      await supabase.from("user_queues").insert(uqData);
    }
  }

  // 3. Retornar usuário atualizado
  return ShowUserService(userId, companyId);
};

export default UpdateUserService;
