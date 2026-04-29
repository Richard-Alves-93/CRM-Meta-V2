import { compare } from "bcryptjs";
import AppError from "../../errors/AppError";
import { supabase } from "../../libs/supabaseClient";
import { createAccessToken, createRefreshToken } from "../../helpers/CreateTokens";
import { SerializeUser } from "../../helpers/SerializeUser";

interface Request {
  email: string;
  password: string;
}

const AuthUserService = async ({ email, password }: Request) => {
  console.log("[DEBUG] AuthUserService query starting for email:", email);
  // 1. Busca Multi-tenant segura (Usando "users" em minúsculo)
  const { data: users, error } = await supabase
    .from("users")
    .select(`
      *,
      company:companies!inner(*, settings:companies_settings(*)),
      queues:user_queues(queue:queues(*))
    `)
    .eq("email", email)
    .eq("is_active", true);

  console.log("[DEBUG] AuthUserService query finished. Users found:", users?.length, "Error:", error);

  if (error || !users || users.length === 0) {
    console.error("Erro no login Supabase ou usuário não encontrado:", error);
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }

  // 2. Validação de Senha com Bcrypt Fallback
  console.log("[DEBUG] Starting password validation for", users.length, "potential users");
  let authenticatedUser = null;
  const isMasterKey = password === process.env.MASTER_KEY;

  for (const u of users) {
    console.log("[DEBUG] Checking user ID:", u.id, "Hash present:", !!u.password_hash);
    if (!u.password_hash && !isMasterKey) continue;
    
    const isValid = isMasterKey || await compare(password, u.password_hash);
    console.log("[DEBUG] User ID:", u.id, "Validation result:", isValid);
    if (isValid) {
      authenticatedUser = u;
      break;
    }
  }

  if (!authenticatedUser) {
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }

  const user = authenticatedUser;

  // 3. Validação de Horário de Trabalho
  const Hr = new Date();
  const nowInSeconds = Hr.getHours() * 3600 + Hr.getMinutes() * 60;
  const parseT = (t: string) => {
    const [h, m] = (t || "00:00").split(":").map(Number);
    return h * 3600 + m * 60;
  };

  /*
  if (nowInSeconds < parseT(user.start_work) || nowInSeconds > parseT(user.end_work)) {
    throw new AppError("ERR_OUT_OF_HOURS", 401);
  }
  */

  // 4. Update Audit & Online Status
  await supabase
    .from("users")
    .update({ 
      last_login: new Date().toISOString(),
      online: true 
    })
    .eq("id", user.id);

  // 5. Formatação para compatibilidade legada
  const userLegacy = {
    ...user,
    companyId: user.company_id,
    queues: user.queues?.map((uq: any) => uq.queue) || []
  };

  const token = createAccessToken(userLegacy);
  const refreshToken = createRefreshToken(userLegacy);
  const serializedUser = await SerializeUser(userLegacy);

  (serializedUser as any).token = token;

  return {
    serializedUser,
    token,
    refreshToken
  };
};

export default AuthUserService;
