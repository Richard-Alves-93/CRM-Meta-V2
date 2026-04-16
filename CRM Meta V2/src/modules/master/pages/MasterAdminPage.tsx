import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, 
  Search, 
  Plus, 
  ExternalLink, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  LayoutDashboard,
  Users,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ManageTenantModal, { Tenant } from "@/modules/master/components/ManageTenantModal";
import CreateTenantModal from "@/modules/master/components/CreateTenantModal";
import PlanManagement from "@/modules/master/components/PlanManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const MasterAdminPage = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data as Tenant[] || []);
    } catch (err: any) {
      console.error("Erro ao buscar empresas:", err.message);
      toast.error("Erro ao carregar lista de empresas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    suspended: tenants.filter(t => t.status === 'suspended').length,
    pro: tenants.filter(t => t.plan === 'pro').length
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Painel Master</h1>
        <p className="text-muted-foreground text-sm">Gerenciamento global de empresas e instâncias no CRM.</p>
      </div>

      <Tabs defaultValue="empresas" className="w-full">
        <TabsList className="bg-secondary/20 p-1 rounded-xl mb-6">
          <TabsTrigger value="empresas" className="rounded-lg px-6 gap-2">
            <Building2 size={16} /> Empresas
          </TabsTrigger>
          <TabsTrigger value="planos" className="rounded-lg px-6 gap-2">
            <ShieldCheck size={16} /> Planos SaaS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresas" className="space-y-8 outline-none">
          <div className="flex gap-3 mb-8 flex-wrap">
            <Button onClick={() => setIsCreateModalOpen(true)} className="rounded-lg font-medium transition-all px-6 gap-2 h-11">
              <Plus size={18} /> Nova Empresa
            </Button>
          </div>

      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total de Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Instâncias totais na plataforma</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Empresas Ativas</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.active}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">Operando sem restrições</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow cursor-help" title="Inadimplentes ou Canceladas">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Suspensas</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.suspended}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium uppercase tracking-tighter">Acesso bloqueado via app</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Faturamento Estimado</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ {(stats.pro * 297 + (stats.total - stats.pro) * 97).toLocaleString('pt-BR')}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">Projeção mensal baseada em planos</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Empresas */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-card/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome, slug ou e-mail..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-xl border-border bg-background"
            />
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            Exibindo <span className="text-foreground">{filteredTenants.length}</span> de {tenants.length} registros
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/20">
              <TableRow>
                <TableHead className="font-bold py-4">Empresa</TableHead>
                <TableHead className="font-bold py-4">Plano</TableHead>
                <TableHead className="font-bold py-4">Status</TableHead>
                <TableHead className="font-bold py-4">Faturamento (30d)</TableHead>
                <TableHead className="text-right font-bold py-4 px-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground py-10">Carregando dados...</TableCell>
                </TableRow>
              ) : filteredTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground py-10">Nenhuma empresa encontrada.</TableCell>
                </TableRow>
              ) : (
                filteredTenants.map((t) => (
                  <TableRow key={t.id} className="hover:bg-secondary/10 transition-colors group">
                    <TableCell className="py-4 font-medium">
                      <div className="flex flex-col">
                        <span className="text-foreground font-bold">{t.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{t.slug}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className={`rounded-lg uppercase text-[9px] px-2 py-0 border-2 font-bold ${
                        t.plan === 'pro' ? 'border-amber-500/20 text-amber-600 bg-amber-500/5' : 
                        t.plan === 'basico' ? 'border-blue-500/20 text-blue-600 bg-blue-500/5' : 
                        'border-slate-500/10 text-slate-500'
                      }`}>
                        {t.plan || 'Gratuito'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${t.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                        <span className={`text-[10px] uppercase font-bold tracking-tight ${t.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.status === 'active' ? 'Ativo' : 'Suspenso'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                       <span className="text-xs font-semibold text-muted-foreground italic">Cálculo desativado</span>
                    </TableCell>
                    <TableCell className="text-right py-4 px-6">
                      <div className="flex items-center justify-end gap-2 outline-none">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="h-9 px-4 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-bold text-xs"
                          onClick={() => {
                            setSelectedTenant(t);
                            setIsManageModalOpen(true);
                          }}
                        >
                          Gerenciar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
          </div>
        </TabsContent>

        <TabsContent value="planos" className="outline-none">
          <PlanManagement />
        </TabsContent>
      </Tabs>

      {/* Modais */}
      <ManageTenantModal 
        tenant={selectedTenant}
        open={isManageModalOpen}
        onClose={() => {
          setIsManageModalOpen(false);
          setSelectedTenant(null);
        }}
        onUpdate={fetchTenants}
      />

      <CreateTenantModal 
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchTenants}
      />
    </div>
  );
};

export default MasterAdminPage;
