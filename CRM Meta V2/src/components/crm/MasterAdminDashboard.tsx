import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Building2, Users, CreditCard, Plus, Search } from "lucide-react";
import ManageTenantModal, { Tenant } from "./ManageTenantModal";


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
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTenants(data || []);
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
        .insert([{ name: newTenantName }]);
      
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
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateRevenue = () => {
    return tenants.filter(t => t.status === 'active').reduce((total, t) => {
      if (t.plan === 'basico') return total + 47;
      if (t.plan === 'pro') return total + 97;
      return total;
    }, 0);
  };

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

      <div className="grid gap-4 md:grid-cols-3">
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
            <CardTitle className="text-sm font-medium">Faturamento Estimado</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {calculateRevenue().toFixed(2).replace('.', ',')}</div>
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
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left">Nome da Empresa</th>
                    <th className="p-3 text-left">Plano</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Data de Cadastro</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((t) => (
                    <tr key={t.id} className="border-b">
                      <td className="p-3 font-medium">{t.name}</td>
                      <td className="p-3 capitalize">{t.plan}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {t.status === 'active' ? 'Ativa' : 'Suspensa'}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => openManageModal(t)}>Gerenciar</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
