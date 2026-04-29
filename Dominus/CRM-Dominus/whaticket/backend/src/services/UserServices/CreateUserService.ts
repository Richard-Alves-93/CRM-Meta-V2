import * as Yup from "yup";
import { hash } from "bcryptjs";
import { supabase } from "../../libs/supabaseClient";
import AppError from "../../errors/AppError";
import { SerializeUser } from "../../helpers/SerializeUser";
import ShowUserService from "./ShowUserService";

interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  queueIds?: (number | string)[];
  companyId?: number | string;
  profile?: string;
  startWork?: string;
  endWork?: string;
  whatsappId?: number | string;
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
  canViewAllContacts?: boolean;
}

const CreateUserService = async ({
  email,
  password,
  name,
  queueIds = [],
  companyId,
  profile = "admin",
  startWork = "00:00",
  endWork = "23:59",
  whatsappId,
  allTicket = "enabled",
  defaultTheme,
  defaultMenu,
  allowGroup,
  allHistoric,
  allUserChat,
  userClosePendingTicket,
  showDashboard,
  defaultTicketsManagerWidth = 550,
  allowRealTime,
  allowConnections,
  canViewAllContacts
}: CreateUserRequest): Promise<any> => {
  
  // 1. Validar Limite de Usuários (SaaS)
  if (companyId) {
    const { data: company, error: compError } = await supabase
      .from("companies")
      .select("*, plan:plans(*)")
      .eq("id", companyId)
      .single();

    if (company && company.plan) {
      const { count } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);

      if (count !== null && count >= company.plan.users) {
        throw new AppError(`Número máximo de usuários já alcançado: ${count}`);
      }
    }
  }

  // 2. Validar Dados e E-mail Duplicado
  const schema = Yup.object().shape({
    name: Yup.string().required().min(2),
    email: Yup.string().email().required(),
    password: Yup.string().required().min(5)
  });

  try {
    await schema.validate({ email, password, name });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingUser) {
    throw new AppError("An user with this email already exists.");
  }

  // 3. Criptografar Senha
  const passwordHash = await hash(password, 8);

  // 4. Inserir no Supabase
  const { data: newUser, error: createError } = await supabase
    .from("users")
    .insert({
      email,
      password_hash: passwordHash,
      name,
      company_id: companyId,
      profile,
      start_work: startWork,
      end_work: endWork,
      whatsapp_id: whatsappId || null,
      all_ticket: allTicket,
      default_theme: defaultTheme,
      default_menu: defaultMenu,
      allow_group: !!allowGroup,
      all_historic: allHistoric,
      all_user_chat: allUserChat,
      user_close_pending_ticket: userClosePendingTicket,
      show_dashboard: showDashboard,
      default_tickets_manager_width: defaultTicketsManagerWidth,
      allow_real_time: allowRealTime,
      allow_connections: allowConnections,
      can_view_all_contacts: !!canViewAllContacts
    })
    .select()
    .single();

  if (createError || !newUser) {
    throw new AppError(`Erro ao criar usuário: ${createError?.message}`);
  }

  // 5. Vincular Filas
  if (queueIds.length > 0) {
    const uqData = queueIds.map(qId => ({
      user_id: newUser.id,
      queue_id: qId
    }));
    await supabase.from("user_queues").insert(uqData);
  }

  return SerializeUser({ ...newUser, queues: queueIds });
};

export default CreateUserService;
