import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: string | null;
  tenantId: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({ 
  user: null, 
  session: null, 
  loading: true, 
  role: null, 
  tenantId: null,
  signOut: async () => {},
  refreshProfile: async () => {} 
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string, currentUser?: User) => {
    try {
      console.log('[Auth] Buscando perfil do usuário:', uid);
      const { data, error } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('user_id', uid)
        .single();
      
      if (data) {
        let currentTenantId = data.tenant_id;
        const inviteCode = localStorage.getItem('pending_invite_code');

        if (data.role === 'master_admin') {
          localStorage.removeItem('pending_invite_code');
        }

        // --- SISTEMA DE CONVITES ---
        if (!currentTenantId && inviteCode && data.role !== 'master_admin') {
          const { data: tenantData } = await (supabase
            .from('tenants')
            .select('id, name, invite_code_used') as any)
            .eq('invite_code', inviteCode)
            .single();

          if (tenantData && !tenantData.invite_code_used) {
            currentTenantId = tenantData.id;
            await supabase.from('profiles').update({ 
               tenant_id: currentTenantId,
               role: 'tenant_admin' 
            }).eq('user_id', uid);

            await (supabase.from('tenants').update({ 
               invite_code_used: true 
            } as any) as any).eq('id', currentTenantId);

            localStorage.removeItem('pending_invite_code');
          }
        }
        
        // --- ONBOARDING AUTOMÁTICO ---
        if (!currentTenantId && data.role !== 'master_admin') {
          const authUser = currentUser || user;
          const currentEmail = authUser?.email || 'novo_usuario';
          const userName = authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || currentEmail.split('@')[0];
          
          if (!sessionStorage.getItem(`creating_tenant_${uid}`)) {
            sessionStorage.setItem(`creating_tenant_${uid}`, 'locked');
            const { data: newTenant } = await supabase
              .from('tenants')
              .insert({ name: `Empresa de ${userName}`, status: 'active', plan: 'gratuito', email: currentEmail })
              .select('id')
              .single();
               
            if (newTenant) {
               currentTenantId = newTenant.id;
               await supabase.from('profiles').update({ tenant_id: currentTenantId }).eq('user_id', uid);
            }
            sessionStorage.removeItem(`creating_tenant_${uid}`);
          }
        }
        
        setRole(data.role);
        setTenantId(currentTenantId);
      }
    } catch (err) {
      console.error('[Auth] Erro crítico no fetchProfile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      // 1. Check current session immediately (Fix for F5 hang)
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      if (isMounted) {
        if (initialSession) {
          console.log('[Auth] Sessão inicial detectada via getSession');
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchProfile(initialSession.user.id, initialSession.user);
        } else {
          console.log('[Auth] Nenhuma sessão inicial encontrada');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // 2. Monitora mudanças de autenticação futuras
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      console.log(`[Auth] Evento Supabase: ${event}`);
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setRole(null);
        setTenantId(null);
        setLoading(false);
      } else if (session) {
        setSession(session);
        setUser(session.user);
        // Only fetch if we are not already loading or if user changed
        fetchProfile(session.user.id, session.user);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setTenantId(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, role, tenantId, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
