import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { 
  Users, 
  Layers, 
  Search, 
  Plus, 
  Mail, 
  ShieldCheck, 
  MoreVertical,
  Trash2,
  Edit2,
  Phone,
  Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import AddUserModal from "@/modules/master/components/AddUserModal";
import ManageSectorModal from "@/modules/master/components/ManageSectorModal";

const EquipePage = () => {
  const { tenantId } = useAuth();
  const [activeTab, setActiveTab] = useState("members");
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState<any>(null);

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja remover o colaborador ${name}? Esta ação não pode ser desfeita.`)) return;
    
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      toast.success("Colaborador removido com sucesso!");
      fetchData();
    } catch (err: any) {
      toast.error("Erro ao remover: " + err.message);
    }
  };

  const handleCopyInviteLink = (email: string) => {
    const link = `${window.location.origin}/login?email=${encodeURIComponent(email)}`;
    navigator.clipboard.writeText(link);
    toast.success("Link de convite copiado! Envie para o colaborador.");
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let mQuery = supabase.from('profiles').select(`*, sectors ( name )`);
      if (tenantId) {
        mQuery = mQuery.eq('tenant_id', tenantId);
      } else {
        mQuery = mQuery.is('tenant_id', null);
      }
      const { data: mData, error: mErr } = await mQuery;
      if (mErr) throw mErr;
      setMembers(mData || []);

      let sQuery = supabase.from('sectors').select('*');
      if (tenantId) {
        sQuery = sQuery.eq('tenant_id', tenantId);
      } else {
        sQuery = sQuery.is('tenant_id', null);
      }
      const { data: sData, error: sErr } = await sQuery;
      if (sErr) throw sErr;
      setSectors(sData || []);
    } catch (err: any) {
      toast.error("Erro ao carregar dados da equipe.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredMembers = members.filter(m => 
    m.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email_temp?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestão de Equipe</h1>
        <p className="text-muted-foreground text-sm">Organize seus colaboradores, setores e permissões</p>
      </div>

      <div className="flex gap-3 mb-8 flex-wrap">
        <Button onClick={() => { setEditingMember(null); setIsAddUserOpen(true); }} className="rounded-lg font-medium transition-all px-6 gap-2">
          <Plus size={18} /> Adicionar Membro
        </Button>
        <Button variant="outline" onClick={() => { setSelectedSector(null); setIsSectorModalOpen(true); }} className="rounded-lg font-medium transition-all px-6 gap-2 border-border">
          <Layers size={18} /> Novo Setor
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-card border border-border p-1 h-auto self-start sm:self-auto flex flex-wrap sm:flex-nowrap gap-1">
          <TabsTrigger 
            value="members" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-2 px-4 transition-all rounded-lg"
          >
            <Users size={18} />
            <span>Colaboradores</span>
          </TabsTrigger>
          <TabsTrigger 
            value="sectors" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-2 px-4 transition-all rounded-lg"
          >
            <Layers size={18} />
            <span>Setores / Departamentos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card className="border border-border rounded-xl shadow-sm overflow-hidden">
            <CardHeader className="bg-card/50 border-b p-6">
               <div className="flex items-center justify-between gap-4">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar por nome ou e-mail..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10 h-10 rounded-lg border-border"
                    />
                  </div>
                  <Badge variant="secondary" className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-secondary text-muted-foreground">
                    {filteredMembers.length} MEMBROS
                  </Badge>
               </div>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                 <TableHeader className="bg-secondary/10">
                   <TableRow>
                     <TableHead className="font-bold py-4 px-6">COLABORADOR</TableHead>
                     <TableHead className="font-bold py-4 px-6">CARGO / SETOR</TableHead>
                     <TableHead className="font-bold py-4 px-6">ACESSO</TableHead>
                     <TableHead className="font-bold py-4 px-6">STATUS</TableHead>
                     <TableHead className="text-right py-4 px-6"></TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {loading ? (
                     <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground py-10">Carregando dados da equipe...</TableCell></TableRow>
                   ) : filteredMembers.length === 0 ? (
                     <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground py-10">Nenhum membro encontrado.</TableCell></TableRow>
                   ) : (
                     filteredMembers.map((m) => (
                       <TableRow key={m.id} className="hover:bg-secondary/10 transition-colors group">
                         <TableCell className="py-4 px-6">
                            <div className="flex flex-col">
                               <span className="font-bold text-foreground text-sm">{m.display_name}</span>
                               <div className="flex flex-col gap-0.5 mt-1">
                                 <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail size={10}/> {m.email_temp || 'Sem e-mail'}</span>
                                 {m.whatsapp && (
                                   <span className="text-[10px] text-primary flex items-center gap-1 font-medium"><Phone size={10}/> {m.whatsapp}</span>
                                 )}
                               </div>
                            </div>
                         </TableCell>
                         <TableCell className="py-4 px-6">
                            <div className="flex flex-col gap-1">
                                <Badge variant="outline" className={`w-fit text-[9px] px-2 py-0 border-2 font-bold uppercase ${
                                    m.role === 'tenant_admin' ? 'border-primary/20 text-primary bg-primary/5' : 
                                    m.role === 'driver' ? 'border-blue-500/20 text-blue-500 bg-blue-500/5' : 
                                    'border-slate-500/10 text-slate-500'
                                }`}>
                                    {m.role === 'tenant_admin' ? 'Admin' : m.role === 'driver' ? 'Motorista' : 'Comum'}
                                </Badge>
                                <span className="text-[10px] font-semibold text-muted-foreground ml-1">
                                    {m.sectors?.name || 'Geral'}
                                </span>
                            </div>
                         </TableCell>
                         <TableCell className="py-4 px-6">
                            <div className="flex gap-1">
                                {Object.entries(m.permissions || {}).filter(([_, v]) => v === true).slice(0, 4).map(([k, _]) => (
                                    <div key={k} className="w-1.5 h-1.5 rounded-full bg-primary/50" title={k} />
                                ))}
                            </div>
                         </TableCell>
                         <TableCell className="py-4 px-6">
                            {!m.user_id ? (
                                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-bold rounded-md">PENDENTE</Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-200 text-[10px] font-bold rounded-md">ATIVO</Badge>
                            )}
                         </TableCell>
                         <TableCell className="text-right py-4 px-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><MoreVertical size={16}/></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-lg">
                                    <DropdownMenuItem className="gap-2 text-sm" onClick={() => { setEditingMember(m); setIsAddUserOpen(true); }}>
                                        <Edit2 size={14}/> Editar
                                    </DropdownMenuItem>
                                    {!m.user_id && (
                                      <DropdownMenuItem className="gap-2 text-sm text-primary" onClick={() => handleCopyInviteLink(m.email_temp)}>
                                          <Link2 size={14}/> Copiar Link de Convite
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem className="gap-2 text-sm text-red-500" onClick={() => handleDeleteMember(m.id, m.display_name)}>
                                        <Trash2 size={14}/> Remover
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                         </TableCell>
                       </TableRow>
                     ))
                   )}
                 </TableBody>
               </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sectors" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
                <div className="col-span-full py-20 text-center text-muted-foreground">Carregando setores...</div>
            ) : sectors.length === 0 ? (
                <div className="col-span-full py-20 text-center border border-dashed rounded-xl border-border bg-secondary/5">
                    <Layers className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-foreground">Sem setores cadastrados</h3>
                    <p className="text-sm text-muted-foreground mt-1">Divida sua equipe em departamentos para gerenciar acessos</p>
                    <Button variant="secondary" onClick={() => { setSelectedSector(null); setIsSectorModalOpen(true); }} className="mt-6 rounded-lg gap-2 font-bold">
                        <Plus size={16}/> Criar Setor
                    </Button>
                </div>
            ) : (
                sectors.map(s => (
                    <Card key={s.id} className="border border-border bg-card rounded-xl shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => { setSelectedSector(s); setIsSectorModalOpen(true); }}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <div className="flex flex-col">
                               <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{s.name}</CardTitle>
                               <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Dep. de Gestão</span>
                            </div>
                            <Layers className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                               <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Membros Ativos</span>
                                  <span className="font-bold text-foreground">{members.filter(m => m.sector_id === s.id).length}</span>
                               </div>
                               <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Permissões</span>
                                  <span className="font-bold text-foreground">{Object.values(s.permissions || {}).filter(v => v === true).length}</span>
                               </div>
                               <div className="pt-2 flex gap-1 flex-wrap">
                                  {Object.entries(s.permissions || {}).filter(([_, v]) => v === true).slice(0, 3).map(([k, _]) => (
                                      <Badge key={k} variant="secondary" className="px-1.5 py-0 h-4 text-[9px] uppercase bg-secondary text-muted-foreground/70 font-bold border-none">
                                          {k.replace('view_', '')}
                                      </Badge>
                                  ))}
                               </div>
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </TabsContent>
      </Tabs>

      <AddUserModal 
        open={isAddUserOpen} 
        onClose={() => { setIsAddUserOpen(false); setEditingMember(null); }} 
        onSuccess={fetchData} 
        sectors={sectors}
        tenantId={tenantId}
        initialData={editingMember}
      />

      <ManageSectorModal 
        sector={selectedSector}
        open={isSectorModalOpen}
        onClose={() => { setSelectedSector(null); setIsSectorModalOpen(false); }}
        onSuccess={fetchData}
        tenantId={tenantId}
      />
    </div>
  );
};

export default EquipePage;
