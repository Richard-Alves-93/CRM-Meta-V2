import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Building2, Users, CreditCard, Plus, Search } from "lucide-react";
import ManageTenantModal from "../components/ManageTenantModal";

export interface TenantSubscription {
  id: string;
  status: string;
  payment_status: string;
  next_billing_date: string;
  plans: {
    id: string;
    name: string;
    price: number;
  };
}

export interface Tenant {
  id: string;
  name: string;
  plan: string;
  status: string;
  created_at: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  documento?: string;
  endereco?: string;
  invite_code?: string;
  invite_code_used?: boolean;
  razao_social?: string;
  nome_fantasia?: string;
  inscricao_estadual?: string;
  data_abertura_nascimento?: string;
  subscriptions?: TenantSubscription[];
}

const MasterAdminDashboard = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTenantName, setNewTenantName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          subscriptions (
            id, status, payment_status, next_billing_date,
            plans ( id, name, price )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTenants((data as any) || []);
    } catch (err: any) {
      toast.error("Erro ao carregar empresas: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenantName) return;
    try {
      const { error } = await supabase
        .from('tenants')
        .insert([{ name: newTenantName }])
        .select();
      
      if (error) throw error;
      toast.success("Empresa cadastrada com sucesso!");
      setNewTenantName("");
      fetchTenants();
    } catch (err: any) {
      toast.error("Erro ao criar empresa: " + err.message);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const openManageModal = (t: Tenant) => {
    setSelectedTenant(t);
    setModalOpen(true);
  };

  const filteredTenants = tenants.filter(t => 
    (t.name || "").toLowerCase().includes((searchQuery || "").toLowerCase())
  );

  const calculateRevenue = () => {
    return tenants.filter(t => t.status === 'active').reduce((total, t) => {
      // Prioriza a tabela real de faturamento, caso contrário usa fallback antigo
      if (t.subscriptions && t.subscriptions.length > 0) {
        const activeSub = t.subscriptions.find(s => s.status === 'active' || s.status === 'trial');
        if (activeSub && activeSub.plans) {
          return total + Number(activeSub.plans.price);
        }
      } else {
        const planStr = (t.plan || "").toLowerCase();
        if (planStr === 'basico') return total + 47;
        if (planStr === 'pro') return total + 97;
      }
      return total;
    }, 0);
  };

  const newTenantsCount = tenants.filter(t => {
    if (!t.created_at) return false;
    const diffDays = (new Date().getTime() - new Date(t.created_at).getTime()) / (1000 * 3600 * 24);
    return diffDays <= 7;
  }).length;

  const churnRate = tenants.length 
    ? ((tenants.filter(t => t.status === 'suspended').length / tenants.length) * 100).toFixed(1) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <h1 className="text-3xl font-bold tracking-tight">Painel Master Admin</h1>
      </div>
      <div className="flex flex-col md:flex-row gap-4 mb-4 items-center justify-between">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Input 
            placeholder="Nome da Nova Empresa..." 
            value={newTenantName}
            onChange={(e) => setNewTenantName(e.target.value)}
            className="w-[200px]"
          />
          <Button onClick={handleCreateTenant}>
            <Plus className="mr-2 h-4 w-4" /> Nova Empresa
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
            <Building2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.filter(t => t.status === 'active').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR (Recorrente)</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {calculateRevenue().toFixed(2).replace('.', ',')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos (7 dias)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">+{newTenantsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{churnRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Empresas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando empresas...</p>
          ) : filteredTenants.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground">Nenhuma empresa encontrada no sistema.</p>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Empresa</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status Geral</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="capitalize">{t.plan}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {t.status === 'active' ? 'Ativa' : 'Suspensa'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${(!t.subscriptions || t.subscriptions.length === 0 || t.subscriptions[0].payment_status === 'paid') ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                          {(!t.subscriptions || t.subscriptions.length === 0 || t.subscriptions[0].payment_status === 'paid') ? 'Em Dia' : 'Pendente / Atrasado'}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(t.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => openManageModal(t)}>Gerenciar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ManageTenantModal 
        tenant={selectedTenant}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUpdate={fetchTenants}
      />
    </div>
  );
};

export default MasterAdminDashboard;
