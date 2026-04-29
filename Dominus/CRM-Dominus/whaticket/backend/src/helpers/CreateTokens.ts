import { sign } from "jsonwebtoken";
import authConfig from "../config/auth";

export const createAccessToken = (user: any): string => {
  const { secret, expiresIn } = authConfig;

  return sign(
    {
      username: user.name,
      profile: user.profile,
      id: user.id,
      companyId: user.company_id || user.companyId
    },
    secret,
    {
      expiresIn
    }
  );
};

export const createRefreshToken = (user: any): string => {
  const { refreshSecret, refreshExpiresIn } = authConfig;

  return sign(
    { 
      id: user.id, 
      tokenVersion: user.token_version || user.tokenVersion, 
      companyId: user.company_id || user.companyId 
    },
    refreshSecret,
    {
      expiresIn: refreshExpiresIn
    }
  );
};
