import { LogOut, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const BlockedAccess = () => {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-destructive/20 rounded-2xl p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Efeito de perigo estético no topo */}
        <div className="absolute top-0 left-0 w-full h-2 bg-destructive" />
        
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <AlertOctagon className="text-destructive w-10 h-10" />
        </div>
        
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
          Acesso Bloqueado
        </h1>
        
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Olá, <strong className="text-foreground">{user?.user_metadata?.name || user?.email?.split('@')[0]}</strong>. 
          O uso da sua plataforma foi temporariamente suspenso por <strong>falta de pagamento</strong> ou inatividade.
        </p>

        <div className="bg-secondary/50 rounded-xl p-4 mb-8">
          <p className="text-sm text-foreground font-medium mb-1">Deseja regularizar sua situação?</p>
          <p className="text-xs text-muted-foreground">
            Entre em contato com o suporte ou realize o pagamento da fatura em aberto para ter o acesso liberado imediatamente.
          </p>
        </div>

        <div className="space-y-3">
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12"
            onClick={() => window.open('https://wa.me/5551991840532', '_blank')}
          >
            Falar com o Suporte
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full text-muted-foreground hover:text-foreground h-12"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair da Conta
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BlockedAccess;
