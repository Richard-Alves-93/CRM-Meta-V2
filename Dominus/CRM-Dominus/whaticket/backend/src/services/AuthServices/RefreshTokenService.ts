import { verify } from "jsonwebtoken";
import { Response as Res } from "express";
import { supabase } from "../../libs/supabaseClient";
import AppError from "../../errors/AppError";
import authConfig from "../../config/auth";
import {
  createAccessToken,
  createRefreshToken
} from "../../helpers/CreateTokens";

interface RefreshTokenPayload {
  id: string | number;
  tokenVersion?: number;
  companyId: string | number;
}

interface Response {
  user: any;
  newToken: string;
  refreshToken: string;
}

export const RefreshTokenService = async (
  res: Res,
  token: string
): Promise<Response> => {
  try {
    const decoded = verify(token, authConfig.refreshSecret);
    const { id, tokenVersion, companyId } = decoded as RefreshTokenPayload;

    // CORREÇÃO: detectar se o token é legado (id numérico) ou novo (UUID)
    const isLegacyToken = !isNaN(Number(id));

    let user: any = null;

    if (isLegacyToken) {
      // Token antigo: id=1, companyId=1 — buscar pelo legacy_id no Supabase
      console.log(`[RefreshToken] Token legado detectado (id=${id}). Buscando por legacy_id...`);

      const { data, error } = await supabase
        .from("users")
        .select(`
          *,
          company:companies(*, settings:companies_settings(*)),
          queues:user_queues(queue:queues(*))
        `)
        .eq("legacy_id", Number(id))
        .maybeSingle();

      if (error || !data) {
        console.error(`[RefreshToken] Usuário com legacy_id=${id} não encontrado no Supabase.`);
        res.clearCookie("jrt");
        throw new AppError("ERR_SESSION_EXPIRED", 401);
      }

      user = {
        ...data,
        companyId: data.company_id,
        queues: data.queues?.map((uq: any) => uq.queue) || []
      };

      console.log(`[RefreshToken] Usuário encontrado via legacy_id. Novo UUID: ${user.id}`);
    } else {
      // Token novo: id é UUID — fluxo normal
      const { data, error } = await supabase
        .from("users")
        .select(`
          *,
          company:companies(*, settings:companies_settings(*)),
          queues:user_queues(queue:queues(*))
        `)
        .eq("id", id)
        .single();

      if (error || !data) {
        res.clearCookie("jrt");
        throw new AppError("ERR_SESSION_EXPIRED", 401);
      }

      // Validação de tokenVersion (apenas tokens novos têm isso confiável)
      if (tokenVersion !== undefined && data.token_version !== undefined) {
        if (data.token_version !== tokenVersion) {
          res.clearCookie("jrt");
          throw new AppError("ERR_SESSION_EXPIRED", 401);
        }
      }

      user = {
        ...data,
        companyId: data.company_id,
        queues: data.queues?.map((uq: any) => uq.queue) || []
      };
    }

    // Gerar tokens NOVOS com UUID real (independente de ser token legado ou novo)
    const newToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    return { user, newToken, refreshToken };
  } catch (err: any) {
    // Não limpar cookie se já foi limpo acima
    if (err instanceof AppError) throw err;
    res.clearCookie("jrt");
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }
};
