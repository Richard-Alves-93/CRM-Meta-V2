import { useAuth } from "@/modules/auth/hooks/useAuth";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomePageProps {
  logoUrl?: string | null;
}

const WelcomePage = ({ logoUrl }: WelcomePageProps) => {
  const { user, signOut } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in zoom-in duration-700">
      <div className="mb-12 relative group">
        <div className="absolute -inset-4 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-700"></div>
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt="Logo da Empresa" 
            className="max-h-48 w-auto relative object-contain drop-shadow-2xl"
          />
        ) : (
          <img 
            src="/logo-full.png" 
            alt="Dominus Logo" 
            className="max-h-32 w-auto relative object-contain brightness-0 dark:brightness-100"
          />
        )}
      </div>

      <div className="max-w-md space-y-4">
        <h1 className="text-4xl font-black text-foreground tracking-tight">
          Bem-vindo, <span className="text-primary">{displayName.split(' ')[0]}</span>!
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Você está conectado ao portal corporativo. Use o menu lateral para navegar entre suas ferramentas de trabalho.
        </p>
      </div>

      <div className="mt-12 flex items-center gap-4">
        <div className="flex -space-x-2">
           {[1,2,3].map(i => (
             <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-primary/20 animate-pulse"></div>
             </div>
           ))}
        </div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Sua equipe está online</p>
      </div>

      <div className="mt-12 md:hidden">
        <Button variant="outline" onClick={signOut} className="gap-2 rounded-xl">
          <LogOut size={16} />
          Sair do Sistema
        </Button>
      </div>
    </div>
  );
};

export default WelcomePage;
