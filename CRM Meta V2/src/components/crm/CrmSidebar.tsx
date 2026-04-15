import { BarChart3, FileText, Target, TrendingUp, Settings, X, Users, RefreshCw, Moon, Sun, Truck, Calendar } from "lucide-react";
import { APP_VERSION } from "@/config/version";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/modules/auth/hooks/useAuth";

export type CrmPage = "dashboard" | "lancamentos" | "metas" | "cadastros" | "recompras" | "relatorios" | "configuracoes" | "agendamentos" | "equipe";

interface CrmSidebarProps {
  currentPage: CrmPage;
  onNavigate: (page: CrmPage) => void;
  logoUrl?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const CrmSidebar = ({ currentPage, onNavigate, logoUrl, isOpen, onClose }: CrmSidebarProps) => {
  const { theme, toggleTheme } = useTheme();
  const { hasPermission, role } = useAuth();

  const navItems: { page: CrmPage; label: string; icon: React.ReactNode; permission?: string }[] = [
    { page: "dashboard", label: "Dashboard", icon: <BarChart3 size={20} />, permission: "view_dashboard" },
    { page: "lancamentos", label: "Lançamentos", icon: <FileText size={20} />, permission: "view_sales" },
    { page: "metas", label: "Metas", icon: <Target size={20} />, permission: "view_goals" },
    { page: "cadastros", label: "Cadastros", icon: <Users size={20} />, permission: "view_customers" },
    { page: "recompras", label: "Recompras", icon: <RefreshCw size={20} />, permission: "view_sales" }, // Recompras são ligadas a vendas
    { page: "agendamentos", label: "Agendamentos", icon: <Calendar size={20} />, permission: "view_logistics" },
    { page: "relatorios", label: "Relatórios", icon: <TrendingUp size={20} />, permission: "view_reports" },
  ];

  // Filtra itens baseados em permissões
  const filteredItems = navItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-screen w-[250px] bg-card border-r border-border flex flex-col justify-between z-50 transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center justify-between px-6 py-6 h-[88px]">
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onNavigate("dashboard")}
            title="Ir para o Dashboard"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo CRM"
                className="max-h-12 w-auto max-w-full object-contain"
              />
            ) : (
              <img
                src="/logo-full.png"
                alt="CRM Pets Logo"
                className="max-h-10 w-auto max-w-full object-contain brightness-0 dark:brightness-100 invert-1 dark:invert-0"
              />
            )}
          </div>
          <button
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3 flex-1 overflow-y-auto">
          {filteredItems.map((item) => (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left
              ${currentPage === item.page
                  ? "bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5"
                  : "text-sidebar-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
            >
              <div className={currentPage === item.page ? "text-primary" : "text-muted-foreground"}>
                {item.icon}
              </div>
              {item.label}
            </button>
          ))}

          {/* Item de Equipe para Admins */}
          {(role === 'tenant_admin' || role === 'master_admin') && (
            <button
              onClick={() => onNavigate("equipe")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left mt-2 border-t pt-5
              ${currentPage === "equipe"
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-sidebar-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
            >
              <Users size={20} className={currentPage === "equipe" ? "text-primary" : "text-muted-foreground"} />
              Equipe
            </button>
          )}
        </nav>
        
        <div className="relative px-4 pb-6 pt-4 flex items-center justify-center opacity-70 transition-opacity hover:opacity-100">
          <button
            onClick={toggleTheme}
            className="absolute left-4 p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <span className="text-xs font-mono text-muted-foreground tracking-tighter" title="Versão do sistema">VERSION {APP_VERSION}</span>
        </div>
      </aside>
    </>
  );
};

export default CrmSidebar;
