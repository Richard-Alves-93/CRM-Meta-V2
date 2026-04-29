// index.d.ts
import "express";

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;          // Supabase ID (UUID)
        legacyId?: number;    // Legacy ID (integer)
        profile: string;
        companyId: string;   // Supabase Company ID (UUID)
        legacyCompanyId?: number; // Legacy Company ID (integer)
        canViewAllContacts?: boolean;
      };
    }
  }
}

export {};
