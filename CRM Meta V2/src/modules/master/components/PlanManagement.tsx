import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Settings2, 
  Trash2, 
  CircleDollarSign, 
  Users2, 
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export interface SystemPlan {
  id: string;
  name: string;
  price: number;
  max_users: number;
  description: string;
}

const PlanManagement = () => {
  const [plans, setPlans] = useState<SystemPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SystemPlan | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    price: 0,
    max_users: 5,
    description: ""
  });

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data as SystemPlan[] || []);
    } catch (err: any) {
      toast.error("Erro ao carregar planos: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleOpenModal = (plan?: SystemPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        max_users: plan.max_users,
        description: plan.description || ""
      });
    } else {
      setEditingPlan(null);
      setFormData({
        id: "",
        name: "",
        price: 0,
        max_users: 5,
        description: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!formData.id || !formData.name) {
        throw new Error("ID e Nome são obrigatórios.");
      }

      const planData = {
        id: formData.id.toLowerCase().trim(),
        name: formData.name,
        price: formData.price,
        max_users: formData.max_users,
        description: formData.description,
        updated_at: new Date().toISOString()
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('system_plans')
          .update(planData)
          .eq('id', editingPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('system_plans')
          .insert([planData]);
        if (error) throw error;
      }

      toast.success("Plano salvo com sucesso!");
      fetchPlans();
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error("Erro ao salvar plano: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza? Isso pode afetar empresas vinculadas a este plano.")) return;
    
    try {
      const { error } = await supabase
        .from('system_plans')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success("Plano removido.");
      fetchPlans();
    } catch (err: any) {
      toast.error("Erro ao remover: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex flex-col">
           <h2 className="text-xl font-bold flex items-center gap-2">
             <CircleDollarSign className="text-primary" size={20} />
             Catálogo de Planos SaaS
           </h2>
           <p className="text-xs text-muted-foreground">Gerencie os pacotes e limites oferecidos aos seus clientes.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2 rounded-lg font-bold">
          <Plus size={16} /> Novo Plano
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/20">
            <TableRow>
              <TableHead className="font-bold py-4">ID / Identificador</TableHead>
              <TableHead className="font-bold py-4">Nome Social</TableHead>
              <TableHead className="font-bold py-4">Valor Mensal</TableHead>
              <TableHead className="font-bold py-4">Limite Usuários</TableHead>
              <TableHead className="text-right font-bold py-4 px-6">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin h-4 w-4" /> Carregando planos...
                  </div>
                </TableCell>
              </TableRow>
            ) : plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">Nenhum plano cadastrado.</TableCell>
                </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id} className="hover:bg-secondary/10 transition-colors group">
                  <TableCell className="py-4 font-mono text-[10px] items-center gap-2 underline decoration-primary/20">{plan.id}</TableCell>
                  <TableCell className="py-4 font-bold">{plan.name}</TableCell>
                  <TableCell className="py-4">
                     <span className="bg-primary/5 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/10">
                       R$ {Number(plan.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                     </span>
                  </TableCell>
                  <TableCell className="py-4">
                     <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                       <Users2 size={14} /> {plan.max_users} usuários
                     </div>
                  </TableCell>
                  <TableCell className="text-right py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal(plan)} className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary">
                        <Settings2 size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(plan.id)} className="h-8 w-8 p-0 rounded-lg hover:bg-red-500/10 hover:text-red-500">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <form onSubmit={handleSave}>
            <DialogHeader className="p-8 pb-0">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                {editingPlan ? "Editar Plano" : "Novo Plano SaaS"}
              </DialogTitle>
            </DialogHeader>

            <div className="p-8 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ID do Plano (Único e sem espaços)</Label>
                <Input 
                  disabled={!!editingPlan}
                  required
                  value={formData.id}
                  onChange={e => setFormData(p => ({...p, id: e.target.value}))}
                  className="rounded-xl h-11 border-slate-200 focus:ring-primary/20"
                  placeholder="ex: plus_v1"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome de Exibição</Label>
                <Input 
                  required
                  value={formData.name}
                  onChange={e => setFormData(p => ({...p, name: e.target.value}))}
                  className="rounded-xl h-11 border-slate-200"
                  placeholder="ex: Plano Essencial"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preço Mensal (R$)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={e => setFormData(p => ({...p, price: Number(e.target.value)}))}
                    className="rounded-xl h-11 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Limite de Usuários</Label>
                  <Input 
                    type="number"
                    required
                    value={formData.max_users}
                    onChange={e => setFormData(p => ({...p, max_users: Number(e.target.value)}))}
                    className="rounded-xl h-11 border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição Curta</Label>
                <Input 
                  value={formData.description}
                  onChange={e => setFormData(p => ({...p, description: e.target.value}))}
                  className="rounded-xl h-11 border-slate-200"
                  placeholder="Vantagens deste plano..."
                />
              </div>
            </div>

            <DialogFooter className="p-8 bg-slate-50 dark:bg-slate-900/50 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
              <Button type="submit" disabled={saving} className="rounded-xl font-bold px-8 shadow-lg shadow-primary/20 gap-2">
                {saving ? <Loader2 className="animate-spin size-4" /> : <CheckCircle2 size={16} />}
                Confirmar e Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlanManagement;
