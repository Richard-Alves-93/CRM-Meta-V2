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
  Activity,
  MoreVertical,
  Trash2,
  Edit2
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
  const { tenantId, role } = useAuth();
  const [activeTab, setActiveTab] = useState("members");
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      // Buscar Membros
      const { data: mData, error: mErr } = await supabase
        .from('profiles')
        .select(`
          *,
          sectors ( name )
        `)
        .eq('tenant_id', tenantId);
        
      if (mErr) throw mErr;
      setMembers(mData || []);

      // Buscar Setores
      const { data: sData, error: sErr } = await supabase
        .from('sectors')
        .select('*')
        .eq('tenant_id', tenantId);
        
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Gestão de Equipe
          </h1>
          <p className="text-muted-foreground mt-1">Organize seus colaboradores, defina setores e gerencie permissões de acesso.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => { setSelectedSector(null); setIsSectorModalOpen(true); }} className="rounded-xl gap-2 font-bold">
              <Plus className="w-4 h-4" /> Setor
           </Button>
           <Button onClick={() => setIsAddUserOpen(true)} className="rounded-xl gap-2 font-bold shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" /> Adicionar Membro
           </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-secondary/20 p-1 rounded-xl mb-6">
          <TabsTrigger value="members" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Colaboradores
          </TabsTrigger>
          <TabsTrigger value="sectors" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Setores / Departamentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          <Card className="border-border shadow-sm overflow-hidden">
            <CardHeader className="bg-card/50 border-b p-6">
               <div className="flex items-center justify-between gap-4">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar membro..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10 h-10 rounded-xl"
                    />
                  </div>
                  <Badge variant="secondary" className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-primary/70">
                    {filteredMembers.length} {filteredMembers.length === 1 ? 'Membro' : 'Membros'}
                  </Badge>
               </div>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                 <TableHeader className="bg-secondary/10">
                   <TableRow>
                     <TableHead className="font-bold py-4">Nome</TableHead>
                     <TableHead className="font-bold py-4">Cargo / Setor</TableHead>
                     <TableHead className="font-bold py-4">Status</TableHead>
                     <TableHead className="font-bold py-4">Permissões</TableHead>
                     <TableHead className="text-right py-4 px-6"></TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {loading ? (
                     <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground">Carregando membros...</TableCell></TableRow>
                   ) : filteredMembers.length === 0 ? (
                     <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground">Nenhum membro encontrado.</TableCell></TableRow>
                   ) : (
                     filteredMembers.map((m) => (
                       <TableRow key={m.id} className="hover:bg-secondary/5 transition-colors group">
                         <TableCell className="py-4 font-medium">
                            <div className="flex flex-col">
                               <span className="font-bold text-foreground">{m.display_name}</span>
                               <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail size={12}/> {m.email_temp || 'Sem e-mail'}</span>
                            </div>
                         </TableCell>
                         <TableCell className="py-4">
                            <div className="flex flex-col gap-1">
                                <Badge variant="outline" className={`w-fit text-[10px] uppercase font-bold ${
                                    m.role === 'tenant_admin' ? 'border-primary/20 text-primary bg-primary/5' : 
                                    m.role === 'driver' ? 'border-blue-500/20 text-blue-500 bg-blue-500/5' : 
                                    'border-slate-500/20 text-slate-500'
                                }`}>
                                    {m.role === 'tenant_admin' ? 'Admin' : m.role === 'driver' ? 'Motorista' : 'Membro'}
                                </Badge>
                                <span className="text-[10px] font-semibold text-muted-foreground ml-1">
                                    {m.sectors?.name || 'Sem Setor'}
                                </span>
                            </div>
                         </TableCell>
                         <TableCell className="py-4">
                            {!m.user_id ? (
                                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-bold">CONVITE PENDENTE</Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-200 text-[10px] font-bold">ATIVO</Badge>
                            )}
                         </TableCell>
                         <TableCell className="py-4">
                            <div className="flex gap-1 flex-wrap">
                                {Object.entries(m.permissions || {}).filter(([_, v]) => v === true).slice(0, 3).map(([k, _]) => (
                                    <div key={k} className="w-2 h-2 rounded-full bg-primary/40" title={k} />
                                ))}
                                {(Object.values(m.permissions || {}).filter(v => v === true).length > 3) && (
                                    <span className="text-[10px] text-muted-foreground">+{Object.values(m.permissions || {}).filter(v => v === true).length - 3}</span>
                                )}
                            </div>
                         </TableCell>
                         <TableCell className="text-right py-4 px-6 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><MoreVertical size={16}/></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl">
                                    <DropdownMenuItem className="gap-2"><Edit2 size={14}/> Editar Dados</DropdownMenuItem>
                                    <DropdownMenuItem className="gap-2"><ShieldCheck size={14}/> Permissões</DropdownMenuItem>
                                    <DropdownMenuItem className="gap-2 text-red-500"><Trash2 size={14}/> Remover</DropdownMenuItem>
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
                <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl border-border bg-secondary/5">
                    <Layers className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-foreground">Nenhum setor cadastrado</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">Divida sua empresa em departamentos para organizar melhor o fluxo de trabalho.</p>
                    <Button variant="secondary" onClick={() => { setSelectedSector(null); setIsSectorModalOpen(true); }} className="mt-6 rounded-xl gap-2 font-bold">
                        <Plus size={16}/> Criar Primeiro Setor
                    </Button>
                </div>
            ) : (
                sectors.map(s => (
                    <Card key={s.id} className="border-border shadow-sm hover:shadow-md transition-all group overflow-hidden cursor-pointer" onClick={() => { setSelectedSector(s); setIsSectorModalOpen(true); }}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-secondary/5 border-b mb-3 px-6 py-4">
                            <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{s.name}</CardTitle>
                            <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                                <Layers size={18} />
                            </div>
                        </CardHeader>
                        <CardContent className="px-6 py-4">
                            <div className="space-y-4">
                               <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground font-medium">Permissões Ativas</span>
                                  <span className="font-bold text-foreground">{Object.values(s.permissions || {}).filter(v => v === true).length} áreas</span>
                               </div>
                               <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground font-medium">Pessoas no Setor</span>
                                  <span className="font-bold text-foreground">{members.filter(m => m.sector_id === s.id).length} colaboradores</span>
                               </div>
                               <div className="pt-2 flex gap-1 flex-wrap">
                                  {Object.entries(s.permissions || {}).filter(([_, v]) => v === true).map(([k, _]) => (
                                      <Badge key={k} variant="secondary" className="px-2 py-0 h-5 text-[9px] uppercase tracking-tighter bg-secondary/40 text-muted-foreground font-bold">
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

      {/* Modais */}
      <AddUserModal 
        open={isAddUserOpen} 
        onClose={() => setIsAddUserOpen(false)} 
        onSuccess={fetchData} 
        sectors={sectors}
        tenantId={tenantId}
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
