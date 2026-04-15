import { useState, useCallback, useEffect, lazy } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CrmSidebar, { CrmPage } from "@/components/crm/CrmSidebar";
import { PageSuspense } from "@/components/common/PageSuspense";
import DashboardPage from "@/components/crm/DashboardPage";
import MetaModal from "@/components/crm/MetaModal";
import LancamentoModal from "@/components/crm/LancamentoModal";
import GoalReminderModal from "@/components/crm/GoalReminderModal";
import BlockedAccess from "@/components/crm/BlockedAccess";
import { getConfirmedGoalsMonth, setConfirmedGoalsMonth, shouldAskNextMonthGoals, getCurrentMonthStr } from "@/services/goalService";
import {
  fetchDatabase, addMeta, updateMeta, deleteMeta,
  addLancamento, updateLancamento, deleteLancamento,
  exportarDadosJSON, exportarExcel,
  Meta, Lancamento, CrmDatabase
} from "@/lib/crm-data";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { toast } from "sonner";
import { LogOut, Menu } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

// Lazy-loaded pages for code splitting
const LancamentosPage = lazy(() => import("@/components/crm/LancamentosPage"));
const MetasPage = lazy(() => import("@/components/crm/MetasPage"));
const CadastrosPage = lazy(() => import("@/components/crm/cadastros"));
const RecomprasPage = lazy(() => import("@/components/crm/RecomprasPage"));
const RelatoriosPage = lazy(() => import("@/components/crm/RelatoriosPage"));
const ConfiguracoesPage = lazy(() => import("@/components/crm/ConfiguracoesPage"));
const AgendaTransportePage = lazy(() => import("@/pages/AgendaTransportePage"));
import MasterAdminDashboard from "./MasterControl";
import DriverDashboard from "./DriverDashboard";
const Index = () => {
  const { user, role, tenantId, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const routeToPage = (pathname: string): CrmPage | 'admin' => {
    const path = pathname === "/" ? "dashboard" : pathname.replace(/^\//, "");
    if (path.startsWith('admin')) return 'admin';
    const validPages: (CrmPage | 'admin')[] = ["dashboard", "lancamentos", "metas", "cadastros", "recompras", "transportes", "relatorios", "configuracoes", "admin"];
    return validPages.includes(path as any) ? (path as any) : "dashboard";
  };

  const page = routeToPage(location.pathname);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [db, setDb] = useState<CrmDatabase>({ metas: [], lancamentos: [] });
  const [loading, setLoading] = useState(true);
  const [tenantStatus, setTenantStatus] = useState<string | null>(null);
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    return localStorage.getItem('crm_custom_logo');
  });

  useEffect(() => {
    const userLogo = user?.user_metadata?.logo_url;
    if (userLogo && userLogo !== customLogo) {
      setCustomLogo(userLogo);
      localStorage.setItem('crm_custom_logo', userLogo);
    }
  }, [user, customLogo]);

  const [metaModalOpen, setMetaModalOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null);
  const [lancModalOpen, setLancModalOpen] = useState(false);
  const [editingLanc, setEditingLanc] = useState<Lancamento | null>(null);
  const [goalReminderOpen, setGoalReminderOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      if (page === 'admin') {
        setLoading(false);
        return;
      }
      
      if (tenantId) {
        const { data: tData, error: tErr } = await supabase
          .from('tenants')
          .select('status')
          .eq('id', tenantId)
          .single();
          
        if (!tErr && tData) {
          setTenantStatus(tData.status);
          if (tData.status === 'suspended') {
            setLoading(false);
            return;
          }
        }
      }

      const data = await fetchDatabase();
      setDb(data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [page, tenantId]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (loading) return;

    const checkGoals = () => {
      if (db.metas.length === 0) return;

      if (shouldAskNextMonthGoals()) {
        setGoalReminderOpen(true);
        
        if ('Notification' in window && Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              const currentMonth = getCurrentMonthStr();
              const notifiedKey = 'crm_notified_month_' + currentMonth;
              if (!localStorage.getItem(notifiedKey)) {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification("🎯 Novo Mês! Atualize suas Metas", {
                      body: "Chegou o dia 1. Abra o sistema para manter ou atualizar as suas metas financeiras deste novo mês.",
                      icon: "/icon-192x192.png",
                      vibrate: [200, 100, 200]
                    });
                  });
                } else {
                  new Notification("🎯 Novo Mês! Atualize suas Metas", {
                    body: "Chegou o dia 1. Abra o sistema para manter ou atualizar as suas metas financeiras."
                  });
                }
                localStorage.setItem(notifiedKey, 'true');
              }
            }
          });
        }
      }
    };

    checkGoals();
    const interval = setInterval(checkGoals, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, [db.metas.length, loading]);

  const handleSaveMeta = async (nome: string, valor: number, descricao: string) => {
    if (editingMeta) await updateMeta(editingMeta.id, nome, valor, descricao);
    else await addMeta(nome, valor, descricao);
    await refresh();
    setMetaModalOpen(false);
    setEditingMeta(null);
    toast.success(editingMeta ? "Meta atualizada!" : "Meta criada!");
  };

  const handleEditMeta = (meta: Meta) => { setEditingMeta(meta); setMetaModalOpen(true); };
  const handleDeleteMeta = async (id: string) => {
    if (confirm("Tem certeza que deseja remover esta meta?")) {
      await deleteMeta(id); await refresh(); toast.success("Meta removida!");
    }
  };

  const handleSaveLanc = async (data: string, bruto: number, desconto: number) => {
    try {
      if (editingLanc) await updateLancamento(editingLanc.id, data, bruto, desconto);
      else await addLancamento(data, bruto, desconto);

      await refresh();
      setLancModalOpen(false);
      setEditingLanc(null);
      toast.success(editingLanc ? "Lançamento atualizado!" : "Lançamento salvo!");
    } catch (error: any) {
      console.error("Erro ao salvar lançamento:", error);
      toast.error("Erro ao salvar lançamento.");
    }
  };

  const handleAddLancInline = async (data: string, bruto: number, desconto: number) => {
    try {
      await addLancamento(data, bruto, desconto);
      await refresh();
      toast.success("Lançamento salvo!");
    } catch (error: any) {
      console.error("Erro ao salvar lançamento:", error);
      toast.error("Erro ao salvar lançamento.");
    }
  };

  const handleEditLanc = (l: Lancamento) => { setEditingLanc(l); setLancModalOpen(true); };
  const handleDeleteLanc = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este lançamento?")) {
      await deleteLancamento(id); await refresh(); toast.success("Lançamento removido!");
    }
  };

  const handleGoalReminderUpdate = () => {
    setConfirmedGoalsMonth(getCurrentMonthStr());
    setGoalReminderOpen(false);
    navigate('/metas', { replace: true });
    setEditingMeta(null);
    setMetaModalOpen(true);
  };

  const handleGoalReminderKeep = () => {
    setConfirmedGoalsMonth(getCurrentMonthStr());
    setGoalReminderOpen(false);
    toast.success("Metas renovadas!");
  };

  const handleExportExcel = async () => { await exportarExcel(); };

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "";
  const avatarUrl = user?.user_metadata?.avatar_url || "";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (tenantStatus === 'suspended' && role !== 'master_admin') {
    return <BlockedAccess />;
  }

  if (role === 'driver') {
    return (
      <PageSuspense>
        <DriverDashboard />
      </PageSuspense>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <CrmSidebar 
        currentPage={page === 'admin' ? 'dashboard' : page} 
        isOpen={isSidebarOpen}
        onNavigate={(p) => { 
          if (p === 'dashboard' && role === 'master_admin' && location.pathname.startsWith('/admin')) {
             navigate('/admin');
          } else {
             navigate(p === "dashboard" ? "/" : `/${p}`); 
          }
          setIsSidebarOpen(false); 
        }} 
        onClose={() => setIsSidebarOpen(false)}
        logoUrl={customLogo}
      />

      <main className="flex-1 flex flex-col min-w-0 transition-all duration-300 md:ml-[250px]">
        <header className="bg-card border-b border-border px-4 md:px-8 h-16 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-secondary text-foreground"
            >
              <Menu size={20} />
            </button>
            {role === 'master_admin' && (
              <Button 
                variant={page === 'admin' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => navigate('/admin')}
                className="hidden md:flex"
              >
                Painel Master
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-card-foreground hidden sm:block">{displayName}</span>
            <button
              onClick={signOut}
              className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:bg-border transition-colors"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {page === "admin" && (
            <PageSuspense>
              <MasterAdminDashboard />
            </PageSuspense>
          )}
          {page === "dashboard" && (
            <DashboardPage db={db} onOpenLancamento={() => { setEditingLanc(null); setLancModalOpen(true); }}
              onEditMeta={handleEditMeta} onDeleteMeta={handleDeleteMeta}
              onNavigateToRecompras={() => { navigate('/recompras'); setIsSidebarOpen(false); }} />
          )}
          {page === "lancamentos" && (
            <PageSuspense>
              <LancamentosPage db={db} onAdd={handleAddLancInline}
                onEdit={handleEditLanc} onDelete={handleDeleteLanc}
                onOpenModal={() => { setEditingLanc(null); setLancModalOpen(true); }} />
            </PageSuspense>
          )}
          {page === "metas" && (
            <PageSuspense>
              <MetasPage db={db} onAdd={() => { setEditingMeta(null); setMetaModalOpen(true); }}
                onEdit={handleEditMeta} onDelete={handleDeleteMeta} />
            </PageSuspense>
          )}
          {page === "cadastros" && (
            <PageSuspense>
              <CadastrosPage />
            </PageSuspense>
          )}
          {page === "recompras" && (
            <PageSuspense>
              <RecomprasPage />
            </PageSuspense>
          )}
          {page === "relatorios" && (
            <PageSuspense>
              <RelatoriosPage db={db} onExportExcel={handleExportExcel} />
            </PageSuspense>
          )}
          {page === "transportes" && (
            <PageSuspense>
              <AgendaTransportePage />
            </PageSuspense>
          )}
          {page === "configuracoes" && (
            <PageSuspense>
              <ConfiguracoesPage db={db} onRefresh={refresh} customLogo={customLogo} onLogoChange={setCustomLogo} />
            </PageSuspense>
          )}
        </div>

        <footer className="bg-card border-t border-border py-4 px-8 text-center text-[11px] sm:text-xs text-muted-foreground">
          © {new Date().getFullYear()} CRM Dashboard • Desenvolvido por Richard Alves
        </footer>
      </main>

      <GoalReminderModal
        open={goalReminderOpen}
        onUpdate={handleGoalReminderUpdate}
        onKeep={handleGoalReminderKeep}
      />
      <MetaModal open={metaModalOpen} onClose={() => { setMetaModalOpen(false); setEditingMeta(null); }}
        onSave={handleSaveMeta} editingMeta={editingMeta} />
      <LancamentoModal open={lancModalOpen} onClose={() => { setLancModalOpen(false); setEditingLanc(null); }}
        onSave={handleSaveLanc} editingLancamento={editingLanc} />
    </div>
  );
};

export default Index;
