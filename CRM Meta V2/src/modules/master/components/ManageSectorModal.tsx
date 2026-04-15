import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Layers, ShieldCheck, Save, Trash2 } from "lucide-react";

interface Sector {
  id: string;
  name: string;
  permissions: any;
  tenant_id: string;
}

interface ManageSectorModalProps {
  sector: Sector | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantId: string | null;
}

const ManageSectorModal = ({ sector, open, onClose, onSuccess, tenantId }: ManageSectorModalProps) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    view_dashboard: true,
    view_sales: false,
    view_goals: false,
    view_customers: false,
    view_logistics: false,
    view_reports: false,
    view_settings: false,
    manage_team: false,
  });

  const permissionLabels: Record<string, string> = {
    view_dashboard: "Acesso ao Dashboard Principal",
    view_sales: "Ver e Lançar Vendas",
    view_goals: "Gerenciar Metas",
    view_customers: "Acesso a Clientes e Pets",
    view_logistics: "Gestão de Transportes",
    view_reports: "Ver Relatórios e Estatísticas",
    view_settings: "Configurações da Empresa",
    manage_team: "Gerenciar Equipe e Setores",
  };

  useEffect(() => {
    if (sector) {
      setName(sector.name);
      setPermissions({ ...permissions, ...sector.permissions });
    } else {
      setName("");
      setPermissions({
        view_dashboard: true,
        view_sales: false,
        view_goals: false,
        view_customers: false,
        view_logistics: false,
        view_reports: false,
        view_settings: false,
        manage_team: false,
      });
    }
  }, [sector, open]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Insira o nome do setor.");
      return;
    }

    setLoading(true);
    try {
      if (sector) {
        const { error } = await supabase
          .from('sectors')
          .update({ name: name.trim(), permissions })
          .eq('id', sector.id);
        if (error) throw error;
        toast.success("Setor atualizado!");
      } else {
        const { error } = await supabase
          .from('sectors')
          .insert({ name: name.trim(), permissions, tenant_id: tenantId } as any);
        if (error) throw error;
        toast.success("Setor criado!");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error("Erro ao salvar setor: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!sector) return;
    if (!confirm("Tem certeza que deseja excluir este setor? Isso não afetará os usuários já cadastrados, mas eles ficarão sem setor vinculado.")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('sectors')
        .delete()
        .eq('id', sector.id);
      if (error) throw error;
      toast.success("Setor removido!");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error("Erro ao remover setor: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Layers className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-bold">{sector ? 'Editar Setor' : 'Novo Setor'}</DialogTitle>
          <DialogDescription>
            Defina o nome do departamento e quais permissões padrão seus membros terão.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Setor</Label>
            <Input 
              id="name" 
              placeholder="Ex: Logística, Vendas, Veterinária..." 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="rounded-xl h-11"
            />
          </div>

          <div className="bg-secondary/20 p-4 rounded-xl space-y-3">
             <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Permissões Padrão do Setor</p>
             </div>
             <div className="grid grid-cols-1 gap-3">
                {Object.keys(permissionLabels).map(key => (
                  <div key={key} className="flex items-center space-x-3 bg-background/50 p-2 rounded-lg border border-border/50">
                    <Checkbox 
                      id={`ps-${key}`} 
                      checked={permissions[key]} 
                      onCheckedChange={(checked) => setPermissions(p => ({...p, [key]: !!checked}))}
                    />
                    <label 
                      htmlFor={`ps-${key}`}
                      className="text-sm font-medium leading-none cursor-pointer flex-1"
                    >
                      {permissionLabels[key]}
                    </label>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {sector && (
            <Button variant="ghost" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50" disabled={loading}>
              <Trash2 className="w-4 h-4 mr-2" /> Excluir
            </Button>
          )}
          <div className="flex gap-2 flex-1 justify-end">
            <Button variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} disabled={loading} className="rounded-xl gap-2 font-bold px-6">
              <Save className="w-4 h-4" />
              {sector ? 'Salvar Alterações' : 'Criar Setor'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageSectorModal;
