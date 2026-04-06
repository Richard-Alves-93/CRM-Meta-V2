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

  const fetchProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('user_id', uid)
        .single();
      
      if (error) throw error;
      if (data) {
        let currentTenantId = data.tenant_id;
        
        // --- ONBOARDING AUTOMÁTICO ---
        if (!currentTenantId && data.role !== 'master_admin') {
          console.log('[Auth] Usuário novo sem empresa detectado. Gerando cadastro...');
          const currentEmail = user?.email || 'novo_usuario';
          const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || currentEmail.split('@')[0];
          const companyName = `Empresa de ${userName}`;
          
          const { data: newTenant, error: tenantErr } = await supabase
            .from('tenants')
            .insert({ name: companyName, status: 'active', plan: 'gratuito' })
            .select('id')
            .single();
            
          if (tenantErr) {
             console.error('[Auth] Erro na criação da empresa:', tenantErr);
          } else if (newTenant) {
             currentTenantId = newTenant.id;
             // Atualiza o perfil para amarrar a empresa
             await supabase.from('profiles').update({ tenant_id: currentTenantId }).eq('user_id', uid);
             console.log('[Auth] Empresa criada e vinculada com sucesso.');
          }
        }
        
        setRole(data.role);
        setTenantId(currentTenantId);
      }
    } catch (err) {
      console.warn('[Auth] Não foi possível carregar o perfil:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Monitora mudanças de autenticação (Simples e Direto)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      console.log(`[Auth] Evento: ${event}`);
      setSession(session);
      setUser(session?.user ?? null);
      
      // Libera a tela imediatamente se já temos resposta do Supabase
      setLoading(false);
    });

    // 2. Busca o Perfil em paralelo quando o usuário mudar (Fora do lock do Auth)
    if (user && !role) {
      fetchProfile(user.id);
    }

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Efeito extra para garantir que o perfil seja buscado sempre que o usuário logar
  useEffect(() => {
    if (user) {
      fetchProfile(user.id);
    } else {
      setRole(null);
      setTenantId(null);
    }
  }, [user]);

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
