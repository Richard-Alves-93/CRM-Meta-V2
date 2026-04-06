import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertTriangle, Save, Trash2, Power, PowerOff } from "lucide-react";

export interface Tenant {
  id: string;
  name: string;
  plan: string;
  status: string;
  created_at: string;
}

interface ManageTenantModalProps {
  tenant: Tenant | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const ManageTenantModal = ({ tenant, open, onClose, onUpdate }: ManageTenantModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    plan: "gratuito",
    status: "active"
  });

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || "",
        plan: tenant.plan || "gratuito",
        status: tenant.status || "active"
      });
    }
  }, [tenant]);

  const handleSave = async () => {
    if (!tenant) return;
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name: formData.name,
          plan: formData.plan,
          status: formData.status
        })
        .eq('id', tenant.id);
        
      if (error) throw error;
      
      toast.success("Empresa atualizada com sucesso!");
      onUpdate();
      onClose();
    } catch (err: any) {
      toast.error("Erro ao atualizar empresa: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!tenant) return;
    
    // Confirmação de segurança (Double check)
    const confirmName = prompt(`ZONA DE PERIGO!\nIsso apagará a empresa "${tenant.name}" e TODOS os seus dados vinculados para sempre.\n\nDigite o nome da empresa para confirmar a exclusão:`);
    
    if (confirmName !== tenant.name) {
      if (confirmName !== null) toast.error("Nome incorreto. A exclusão foi cancelada por segurança.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenant.id);
        
      if (error) throw error;
      
      toast.success("Empresa destruída com sucesso.");
      onUpdate();
      onClose();
    } catch (err: any) {
      toast.error("Erro ao excluir empresa: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!tenant) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Empresa</DialogTitle>
          <DialogDescription>
            ID: {tenant.id.slice(0, 8)}...
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome da Empresa</Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Plano de Assinatura</Label>
              <Select value={formData.plan} onValueChange={(val) => setFormData(p => ({ ...p, plan: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gratuito">Avaliação Grátis</SelectItem>
                  <SelectItem value="basico">Plano Básico</SelectItem>
                  <SelectItem value="pro">Plano PRO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Status de Acesso</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData(p => ({ ...p, status: val }))}>
                <SelectTrigger className={formData.status === 'active' ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <span className="flex items-center text-green-600"><Power className="w-4 h-4 mr-2"/> Ativa (Livre)</span>
                  </SelectItem>
                  <SelectItem value="suspended">
                    <span className="flex items-center text-red-600"><PowerOff className="w-4 h-4 mr-2"/> Suspensa (Inadimplente)</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between border-t pt-4">
          <Button variant="destructive" onClick={handleDelete} disabled={loading} className="gap-2">
            <Trash2 className="w-4 h-4" /> Deletar Empresa
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading} className="gap-2">
              <Save className="w-4 h-4" /> Salvar Alterações
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageTenantModal;
