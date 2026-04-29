import { verify } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import authConfig from "../config/auth";
import ShowUserService from "../services/UserServices/ShowUserService";

interface TokenPayload {
  id: string; 
  username: string;
  profile: string;
  companyId: number | string;
  iat: number;
  exp: number;
}

const isAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  const [, token] = authHeader.split(" ");

  try {
    const decoded = verify(token, authConfig.secret);
    const { id, profile, companyId } = decoded as TokenPayload;

    const fullUser = await ShowUserService(id, companyId);

    // CENTRALIZED FIX: Resolve legacy integer IDs for compatibility with Sequelize models
    // We store the integer legacy_id in 'id' and 'companyId' for legacy code,
    // and store the Supabase UUIDs in 'uuid' and 'companyUuid' for new code.
    const legacyUserId = (fullUser as any).legacy_id;
    const legacyCompanyId = (fullUser as any).company?.legacy_id;

    req.user = {
      id: legacyUserId ? Number(legacyUserId) : id,
      uuid: id.toString(),
      profile,
      companyId: legacyCompanyId ? Number(legacyCompanyId) : companyId,
      companyUuid: companyId.toString(),
      canViewAllContacts: !!fullUser.can_view_all_contacts || !!fullUser.canViewAllContacts
    };
  } catch (err: any) {
    console.error("Erro no isAuth middleware:", err);
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  return next();
};

export default isAuth;