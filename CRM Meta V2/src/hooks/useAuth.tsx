import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({ user: null, session: null, loading: true, signOut: async () => {} });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const validateSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.access_token) {
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error || !user) {
            console.warn('[Auth] Sessão inválida detectada. Limpando tokens antigos.', error);
            await supabase.auth.signOut().catch((signOutError) =>
              console.error('[Auth] Erro ao limpar sessão inválida:', signOutError)
            );
            if (isMounted) {
              setUser(null);
              setSession(null);
            }
          } else if (isMounted) {
            setUser(user);
            setSession(session);
          }
        }
      } catch (err) {
        console.error('[Auth] Falha ao validar sessão inicial:', err);
        await supabase.auth.signOut().catch((signOutError) =>
          console.error('[Auth] Erro ao limpar sessão no init:', signOutError)
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' && session?.provider_token) {
        localStorage.setItem('google_provider_token', session.provider_token);
      }

      setLoading(false);
    });

    validateSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
