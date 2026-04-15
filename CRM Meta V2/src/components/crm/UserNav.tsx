import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, ShieldCheck, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserNavProps {
  user: any;
  role: string | null;
  onSignOut: () => void;
}

export function UserNav({ user, role, onSignOut }: UserNavProps) {
  const navigate = useNavigate();
  
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "Usuário";
  const email = user?.email || "";
  const avatarUrl = user?.user_metadata?.avatar_url || "";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full border-2 border-primary/10 p-0 hover:bg-primary/5 transition-all overflow-hidden group">
          <Avatar className="h-9 w-9 transition-transform group-hover:scale-105">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1 py-1">
            <p className="text-sm font-bold leading-none text-foreground">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground pt-1">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer gap-2 py-2.5" onClick={() => navigate('/configuracoes')}>
            <User className="h-4 w-4 text-muted-foreground" />
            <span>Meu Perfil</span>
          </DropdownMenuItem>
          
          {role === 'master_admin' && (
            <DropdownMenuItem className="cursor-pointer gap-2 py-2.5 text-primary focus:text-primary active:bg-primary/5" onClick={() => navigate('/admin')}>
              <ShieldCheck className="h-4 w-4" />
              <span className="font-semibold">Painel Master</span>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem className="cursor-pointer gap-2 py-2.5" onClick={() => navigate('/configuracoes')}>
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span>Configurações</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer gap-2 py-2.5 text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/20" onClick={onSignOut}>
          <LogOut className="h-4 w-4" />
          <span>Sair da conta</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
