import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export interface BrandingData {
  logoLight: string | null;
  logoDark: string | null;
  logoLogin: string | null;
  favicon: string | null;
  primaryColor: string | null;
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: string | null;
  tenantId: string | null;
  profileId: string | null;
  permissions: any;
  sectorId: string | null;
  mustChangePassword: boolean;
  branding: BrandingData;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPermission: (key: string) => boolean;
}

const DEFAULT_BRANDING: BrandingData = {
  logoLight: "/logo-full.png",
  logoDark: "/logo-full.png",
  logoLogin: "/logo-full.png",
  favicon: "/favicon.ico",
  primaryColor: "#3b82f6"
};

const AuthContext = createContext<AuthCtx>({ 
  user: null, 
  session: null, 
  loading: true, 
  role: null, 
  tenantId: null,
  profileId: null,
  permissions: {},
  sectorId: null,
  mustChangePassword: false,
  branding: DEFAULT_BRANDING,
  signOut: async () => {},
  refreshProfile: async () => {},
  hasPermission: () => false
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<any>({});
  const [sectorId, setSectorId] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [branding, setBranding] = useState<BrandingData>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string, currentUser?: User) => {
    try {
      console.log('[Auth] Buscando perfil do usuário:', uid);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, tenant_id, permissions, sector_id, status, must_change_password')
        .eq('user_id', uid)
        .single();
      
      if (error) throw error;

      if (data) {
        // Busca o tenant separadamente para ser mais resiliente
        let tenantInfo = null;
        if (data.tenant_id) {
          const { data: tData } = await supabase
            .from('tenants')
            .select('status, plan_id')
            .eq('id', data.tenant_id)
            .single();
          tenantInfo = tData;
        }

        // --- VALIDAÇÃO DE STATUS E SEGURANÇA ---
        const isTenantActive = !tenantInfo || tenantInfo.status === 'active';
        const isProfileActive = data.status === 'active';
        const planId = tenantInfo?.plan_id || 'gratuito';

        if (!isProfileActive || !isTenantActive) {
          console.error('[Auth] Acesso bloqueado: Perfil ou Empresa inativa.');
          toast.error("Sua conta ou empresa está inativa. Entre em contato com o suporte.");
          await signOut();
          return;
        }

        setProfileId(data.id);
        let currentTenantId = data.tenant_id;
        const inviteCode = localStorage.getItem('pending_invite_code');

        if (data.role === 'master_admin') {
          localStorage.removeItem('pending_invite_code');
        }

        // --- SISTEMA DE VÍNCULO POR E-MAIL (PRE-CADASTRO) ---
        if (!currentTenantId && data.role !== 'master_admin') {
          console.log('[Auth] Perfil sem tenant. Buscando pré-cadastro por e-mail...');
          const { data: preRegistered } = await supabase
            .from('profiles')
            .select('*')
            .eq('email_temp', currentUser?.email || '')
            .is('user_id', null) // Apenas perfis ainda não vinculados
            .maybeSingle();

          if (preRegistered && preRegistered.tenant_id) {
            console.log('[Auth] Pré-cadastro encontrado! Vinculando ao tenant:', preRegistered.tenant_id);
            currentTenantId = preRegistered.tenant_id;
            
            // Atualiza o perfil atual com os dados do pré-cadastro e remove o antigo para evitar duplicidade
            const { error: linkErr } = await supabase
              .from('profiles')
              .update({ 
                tenant_id: preRegistered.tenant_id,
                role: preRegistered.role,
                display_name: preRegistered.display_name || data.display_name,
                whatsapp: preRegistered.whatsapp,
                telefone: preRegistered.telefone,
                documento: preRegistered.documento,
                cnh: preRegistered.cnh,
                endereco: preRegistered.endereco,
                sector_id: preRegistered.sector_id,
                permissions: preRegistered.permissions
              })
              .eq('user_id', uid);

            if (!linkErr) {
               // Remove o registro temporário de pré-cadastro agora que vinculamos
               await supabase.from('profiles').delete().eq('id', preRegistered.id);
               
               // Atualiza o estado local com os novos dados
               setRole(preRegistered.role);
               setPermissions(preRegistered.permissions || {});
               setSectorId(preRegistered.sector_id);
            }
          }
        }

        // --- FALLBACK PARA MASTER ADMIN SEM TENANT ---
        if (data.role === 'master_admin' && !currentTenantId) {
          console.log('[Auth] Master Admin sem Tenant. Buscando fallback...');
          const { data: fallbackTenant } = await supabase
            .from('tenants')
            .select('id')
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
          
          if (fallbackTenant) {
            console.log('[Auth] Fallback aplicado:', fallbackTenant.id);
            currentTenantId = fallbackTenant.id;
          }
        }

        setRole(data.role);
        setTenantId(currentTenantId);
        setPermissions(data.permissions || {});
        setSectorId(data.sector_id);
        setMustChangePassword(data.must_change_password || false);

        // --- FETCH BRANDING ---
        let finalBranding = { ...DEFAULT_BRANDING };

        // 1. Fetch Global Settings (Fallback Master)
        try {
          const { data: globalSettings, error: globalErr } = await supabase
            .from('system_settings' as any)
            .select('*')
            .single();
          
          if (!globalErr && globalSettings) {
            finalBranding = {
              logoLight: globalSettings.logo_light_url || finalBranding.logoLight,
              logoDark: globalSettings.logo_dark_url || finalBranding.logoDark,
              logoLogin: globalSettings.logo_login_url || finalBranding.logoLogin,
              favicon: globalSettings.favicon_url || finalBranding.favicon,
              primaryColor: globalSettings.primary_color || finalBranding.primaryColor,
            };
          }
        } catch (e) {
          console.warn('[Branding] Erro ao buscar configurações globais:', e);
        }

        // 2. Fetch Tenant Specific Settings
        if (currentTenantId) {
          try {
            const { data: tenantBranding, error: tenantErr } = await supabase
              .from('tenants')
              .select('logo_light_url, logo_dark_url, logo_login_url, favicon_url, primary_color')
              .eq('id', currentTenantId)
              .single();
            
            if (!tenantErr && tenantBranding) {
              finalBranding = {
                logoLight: tenantBranding.logo_light_url || finalBranding.logoLight,
                logoDark: tenantBranding.logo_dark_url || finalBranding.logoDark,
                logoLogin: tenantBranding.logo_login_url || finalBranding.logoLogin,
                favicon: tenantBranding.favicon_url || finalBranding.favicon,
                primaryColor: tenantBranding.primary_color || finalBranding.primaryColor,
              };
            }
          } catch (e) {
            console.warn('[Branding] Erro ao buscar branding do tenant:', e);
          }
        }

        setBranding(finalBranding);
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      console.log(`[Auth] Evento Supabase: ${event}`);
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setRole(null);
        setTenantId(null);
        setProfileId(null);
        setPermissions({});
        setSectorId(null);
        setMustChangePassword(false);
        setBranding(DEFAULT_BRANDING);
        setLoading(false);
      } else if (session) {
        setSession(session);
        setUser(session.user);
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
    setProfileId(null);
    setPermissions({});
    setSectorId(null);
    setBranding(DEFAULT_BRANDING);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const hasPermission = (key: string) => {
    // Master admin tem acesso a tudo
    if (role === 'master_admin') return true;
    
    // Admins da empresa também têm acesso amplo por padrão, 
    // a menos que queiramos restringi-los via JSON também.
    // Para simplificar: tenant_admin tem tudo, exceto o que for explicitamente FALSE no JSON (se quisermos).
    // Mas o usuário pediu "admin pode customizar cada usuário", então vamos checar o JSON sem distinção.
    
    // Se não houver permissões definidas, mas for admin, retornamos true (ou tratamos como whitelist)
    if (role === 'tenant_admin' && (!permissions || Object.keys(permissions).length === 0)) {
        return true;
    }

    return permissions[key] === true;
  };

  return (
    <AuthContext.Provider value={{ 
      user, session, loading, role, tenantId, profileId, permissions, sectorId, branding,
      signOut, refreshProfile, hasPermission 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const useBranding = () => {
  const context = useContext(AuthContext);
  return context.branding;
};
