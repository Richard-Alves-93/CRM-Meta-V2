import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { BarChart3, Info, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { SystemSettingsService, SystemSettings } from "@/services/SystemSettingsService";
import { useEffect } from "react";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await SystemSettingsService.getSettings();
      if (data) setSettings(data);
    };
    fetchSettings();
  }, []);
  
  const urlParams = new URLSearchParams(window.location.search);
  const isInvited = urlParams.has('invite');
  const inviteCode = urlParams.get('invite');
  const inviteEmail = urlParams.get('email');

  if (inviteCode && typeof window !== 'undefined') {
    localStorage.setItem('pending_invite_code', inviteCode);
  }

  const [isRegisterMode, setIsRegisterMode] = useState(isInvited || !!inviteEmail);

  useEffect(() => {
    if (inviteEmail) {
      setEmail(inviteEmail);
    }
  }, [inviteEmail]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegisterMode) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: inviteCode ? `${window.location.origin}/login?invite=${inviteCode}` : window.location.origin,
            data: {
              company_name: companyName || "Minha Empresa",
              full_name: email.split('@')[0]
            }
          }
        });

        if (error) throw error;

        if (data?.session) {
          toast.success("Conta criada e login realizado com sucesso!");
        } else {
          toast.success(
            "Conta criada! Verifique seu e-mail para confirmar o acesso."
          );
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        if (!data?.session) {
          throw new Error(
            "Login realizado, mas nenhuma sessão foi criada. Tente novamente."
          );
        }

        toast.success("Login realizado com sucesso!");
      }
    } catch (err: any) {
      console.error("Erro login:", err);
      toast.error("Erro ao autenticar. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: inviteCode ? `${window.location.origin}/login?invite=${inviteCode}` : window.location.origin,
          scopes: "https://www.googleapis.com/auth/drive.file",
        }
      });
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-background flex flex-col md:flex-row overflow-hidden font-sans">
      {/* LADO VISUAL (Desktop Only) */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-slate-900 overflow-hidden relative group border-r border-slate-200/10">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] group-hover:scale-105"
          style={{ backgroundImage: 'url("/img/login-visual.png")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/60 to-transparent" />
        
        <div className="relative z-10 w-full h-full flex flex-col justify-between p-10 lg:p-16 text-white text-left">
          <div /> {/* Spacer superior */}
          
          <div className="max-w-xl space-y-4 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary-foreground text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
              SaaS Pro Versão 4.0
            </div>
            <h2 className="text-3xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              A inteligência que seu <br />
              <span className="text-primary italic">negócio</span> merece.
            </h2>
            <p className="text-base text-slate-300 max-w-md leading-relaxed opacity-90">
              Monitore metas e gerencie seus clientes com a plataforma líder em performance.
            </p>
            
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Multi-Tenant Seguro
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Backup Automático
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Dados em Tempo Real
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Suporte 24/7
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* LADO DO FORMULÁRIO (Minimalist & Compact) */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 relative">
        <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
          <div className="w-full max-w-[320px] space-y-5 animate-in fade-in zoom-in-95 duration-700 relative z-20">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center mb-6 transition-transform hover:scale-105">
                <img 
                  src={settings?.login_logo_url || "/logo-full.png"} 
                  alt="CRM Logo" 
                  className="h-16 w-auto object-contain drop-shadow-sm"
                />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {isRegisterMode ? "Criar conta" : "Entrar no sistema"}
              </h1>
              <p className="text-[11px] text-muted-foreground font-medium opacity-70">
                {isRegisterMode 
                  ? "Comece a gerenciar seu negócio agora." 
                  : "Acesse sua gestão inteligente."}
              </p>
            </div>

            {isInvited && (
              <div className="p-2.5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-md flex gap-2">
                <Info className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-tight">
                  Convite ativo para nova organização.
                </p>
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isRegisterMode && !isInvited && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-semibold text-muted-foreground/80 ml-0.5">Nome da Empresa</label>
                  <input 
                    type="text" 
                    required={isRegisterMode && !isInvited}
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50 px-3 text-xs transition-all focus:bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none"
                    placeholder="Ex: Pet Shop Pro"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground/80 ml-0.5">E-mail</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50 px-3 text-xs transition-all focus:bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none"
                  placeholder="Seu e-mail profissional"
                />
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-0.5">
                  <label className="text-[10px] font-semibold text-muted-foreground/80">Senha</label>
                  {!isRegisterMode && (
                    <button type="button" className="text-[9px] font-bold text-primary hover:underline transition-colors uppercase tracking-tight">Esqueceu?</button>
                  )}
                </div>
                <div className="relative group">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50 px-3 pr-10 text-xs transition-all focus:bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-9 flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-bold text-[11px] shadow-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading
                  ? (isRegisterMode ? "Processando..." : "Entrando...")
                  : (isRegisterMode ? "Registrar agora" : "Acessar Dashboard")}
              </button>
            </form>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100 dark:border-slate-900"></span>
              </div>
              <div className="relative flex justify-center text-[9px] uppercase">
                <span className="bg-white dark:bg-slate-950 px-2 text-muted-foreground/40 font-bold">Ou entrar com</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              type="button"
              disabled={loading}
              className="w-full h-9 flex items-center justify-center gap-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-[10px] transition-all active:scale-[0.98]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google Account
            </button>

            <div className="text-center pt-1">
              <p className="text-[10px] text-muted-foreground/80 font-medium">
                {isRegisterMode ? "Já tem acesso?" : "Novo por aqui?"}{' '}
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  className="font-bold text-primary hover:underline transition-all"
                >
                  {isRegisterMode ? "Faça Login" : "Criar Conta"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER GLOBAL REPOSICIONADO (Referência: Entre Pesquisar e Chrome) */}
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 md:left-[25%] md:right-auto py-1 text-center z-30 pointer-events-none w-full md:w-auto">
        <p className="text-[11px] text-slate-400 md:text-white/50 font-normal whitespace-nowrap pointer-events-auto">
          © {new Date().getFullYear()} CRM Dashboard • Desenvolvido por{' '}
          <a href="https://wa.me/5551991840532" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors font-medium">Richard Alves</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
