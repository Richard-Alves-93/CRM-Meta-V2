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
    view_dashboard: "Dashboard",
    view_sales: "Vendas",
    view_goals: "Metas",
    view_customers: "Clientes",
    view_logistics: "Logística",
    view_reports: "Relatórios",
    view_settings: "Ajustes",
    manage_team: "Equipe",
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
    if (!confirm("Tem certeza que deseja excluir este setor?")) return;

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
      <DialogContent className="sm:max-w-[480px] rounded-xl border-border">
        <DialogHeader>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">{sector ? 'Editar Setor' : 'Novo Setor'}</DialogTitle>
          <DialogDescription className="text-sm">
            Defina o nome do departamento e as permissões de acesso.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="mathrm whitespace-nowrap text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome do Setor</Label>
            <Input 
              id="name" 
              placeholder="Ex: Logística, Vendas, Veterinária..." 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="rounded-lg h-10 border-border bg-background"
            />
          </div>

          <div className="bg-secondary/20 p-4 rounded-lg border border-border/50">
             <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Matriz de Acessos</p>
             </div>
             
             <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {Object.keys(permissionLabels).map(key => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`ps-${key}`} 
                      checked={permissions[key]} 
                      onCheckedChange={(checked) => setPermissions(p => ({...p, [key]: !!checked}))}
                      className="rounded border-border"
                    />
                    <label 
                      htmlFor={`ps-${key}`}
                      className="text-xs font-medium leading-none cursor-pointer"
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
            <Button variant="ghost" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg" disabled={loading}>
              <Trash2 className="w-4 h-4 mr-2" /> Excluir
            </Button>
          )}
          <div className="flex gap-2 flex-1 justify-end">
            <Button variant="outline" onClick={onClose} disabled={loading} className="rounded-lg font-bold">Cancelar</Button>
            <Button onClick={handleSave} disabled={loading} className="rounded-lg font-bold px-6">
              <Save className="w-4 h-4 mr-2" />
              {sector ? 'Salvar' : 'Criar Setor'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageSectorModal;
