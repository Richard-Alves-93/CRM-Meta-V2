import { BarChart3, FileText, Target, TrendingUp, Settings, X, Users, RefreshCw, Moon, Sun } from "lucide-react";
import { APP_VERSION } from "@/config/version";
import { useTheme } from "@/hooks/useTheme";

export type CrmPage = "dashboard" | "lancamentos" | "metas" | "cadastros" | "recompras" | "relatorios" | "configuracoes";

interface CrmSidebarProps {
  currentPage: CrmPage;
  onNavigate: (page: CrmPage) => void;
  logoUrl?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const navItems: { page: CrmPage; label: string; icon: React.ReactNode }[] = [
  { page: "dashboard", label: "Dashboard", icon: <BarChart3 size={20} /> },
  { page: "lancamentos", label: "Lançamentos", icon: <FileText size={20} /> },
  { page: "metas", label: "Metas", icon: <Target size={20} /> },
  { page: "cadastros", label: "Cadastros", icon: <Users size={20} /> },
  { page: "recompras", label: "Recompras", icon: <RefreshCw size={20} /> },
  { page: "relatorios", label: "Relatórios", icon: <TrendingUp size={20} /> },
  { page: "configuracoes", label: "Configurações", icon: <Settings size={20} /> },
];

const CrmSidebar = ({ currentPage, onNavigate, logoUrl, isOpen, onClose }: CrmSidebarProps) => {
  const { theme, toggleTheme } = useTheme();

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
              <>
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <span className="text-primary-foreground text-xs font-bold">CR</span>
                </div>
                <span className="font-bold text-card-foreground text-lg truncate">CRM</span>
              </>
            )}
          </div>
          <button
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3 flex-1">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left
              ${currentPage === item.page
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-sidebar-foreground hover:bg-secondary hover:text-foreground"
                }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="relative px-4 pb-6 pt-4 flex items-center justify-center opacity-70 transition-opacity hover:opacity-100">
          <button
            onClick={toggleTheme}
            className="absolute left-4 p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <span className="text-xs text-muted-foreground" title="Versão do sistema">V {APP_VERSION}</span>
        </div>
      </aside>
    </>
  );
};

export default CrmSidebar;
