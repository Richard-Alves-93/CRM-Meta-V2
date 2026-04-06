/**
 * ETAPA 9: Authentication Service
 * Centralizes authentication logic and session management
 */

import { supabase } from "@/integrations/supabase/client";
import { CrmError } from "@/services/errorHandler";

/**
 * Wrapper for Supabase auth.getUser() with automatic logout on 401
 * Centralizes all authentication checks and handles expired sessions
 */
export async function getAuthUser() {
  const { data: { user }, error } = await supabase.auth.getUser();

  // Handle 401 Unauthorized - session expired
  if (error?.status === 401 || !user) {
    console.error('[CRM] Auth error - logging out', error);

    // Sign out and redirect to login
    await supabase.auth.signOut().catch(err =>
      console.error('[CRM] Logout error:', err)
    );

    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }

    throw new CrmError(
      'Authentication failed - session expired',
      'AUTH_FAILED',
      401,
      'Sua sessão expirou. Faça login novamente.',
      { originalError: error }
    );
  }

  return user;
}

/**
 * Get authenticated user ID
 * Returns the user's unique identifier or throws if not authenticated
 */
export async function getAuthUserId(): Promise<string> {
  const user = await getAuthUser();
  return user.id;
}
