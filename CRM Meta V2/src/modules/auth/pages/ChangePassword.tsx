import { useState } from "react";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { KeyRound, ShieldAlert, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ChangePassword = () => {
  const { user, profileId, branding, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      // 1. Atualiza no Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: password
      });

      if (authError) throw authError;

      // 2. Atualiza a flag no perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', profileId);

      if (profileError) throw profileError;

      toast.success("Senha atualizada com sucesso! Bem-vindo ao sistema.");
      
      // Pequeno delay para o perfil atualizar no contexto
      setTimeout(() => {
        window.location.href = "/"; // Força recarga para limpar os guardas de rota
      }, 1000);

    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao atualizar senha: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            {branding.logo_url ? (
              <img src={branding.logo_url} alt="Logo" className="h-12 w-auto object-contain" />
            ) : (
               <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                 {branding.company_name?.charAt(0) || "C"}
               </div>
            )}
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Primeiro Acesso</h1>
            <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
              Sua segurança é prioridade. Por favor, crie uma senha pessoal para continuar.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl mb-6">
            <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-tight">
              <b>Importante:</b> Você está usando uma senha provisória. Ela expira assim que você definir a nova.
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nova Senha</Label>
              <div className="relative group">
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all pr-10 text-sm"
                  placeholder="Mínimo 6 caracteres"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirmar Senha</Label>
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm"
                placeholder="Repita a nova senha"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-11 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              Salvar e Entrar no Sistema
            </Button>

            <button
               type="button"
               onClick={() => signOut()}
               className="w-full text-xs text-muted-foreground hover:text-red-500 transition-colors pt-2"
            >
              Sair da conta
            </button>
          </form>
        </div>
        
        <p className="text-center text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} {branding.company_name} - CRM Meta
        </p>
      </div>
    </div>
  );
};

export default ChangePassword;
