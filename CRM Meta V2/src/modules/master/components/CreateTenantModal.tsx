import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Plus, Sparkles } from "lucide-react";
import { logSystemAction } from "@/modules/master/services/LogService";

interface CreateTenantModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTenantModal = ({ open, onClose, onSuccess }: CreateTenantModalProps) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const generateSlug = (val: string) => {
    return val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-t0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(generateSlug(val));
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Por favor, insira o nome da empresa.");
      return;
    }

    setLoading(true);
    try {
      const inviteCode = Math.random().toString(36).substring(2, 12).toUpperCase();
      
      const { data, error } = await supabase
        .from('tenants')
        .insert({
          name: name.trim(),
          slug: slug || generateSlug(name),
          plan: 'gratuito',
          status: 'active'
        } as any)
        .select()
        .single();

      if (error) throw error;

      await logSystemAction({
        action: 'create_tenant',
        entity: `Tenant: ${name}`,
        details: { id: data.id, schema: 'public' }
      });

      toast.success("Empresa cadastrada com sucesso!");
      setName("");
      setSlug("");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erro ao criar empresa:", err);
      toast.error("Erro ao cadastrar empresa: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-bold">Cadastrar Nova Empresa</DialogTitle>
          <DialogDescription>
            Crie um novo ambiente isolado para um cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-sm font-semibold">Nome da Empresa</Label>
            <Input 
              id="name" 
              placeholder="Ex: Pet Shop do Richard" 
              value={name} 
              onChange={(e) => handleNameChange(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="slug" className="text-sm font-semibold flex items-center gap-1.5">
                Identificador (Slug)
                <Sparkles className="w-3 h-3 text-amber-500" />
              </Label>
              <span className="text-[10px] text-muted-foreground italic">Usado em URLs internas</span>
            </div>
            <Input 
              id="slug" 
              placeholder="pet-shop-do-richard" 
              value={slug} 
              onChange={(e) => setSlug(e.target.value)}
              className="h-11 rounded-xl bg-secondary/30 font-mono text-xs"
            />
          </div>
        </div>

        <DialogFooter className="bg-secondary/10 -mx-6 -mb-6 p-6 mt-2">
          <Button variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={loading} className="rounded-xl gap-2 font-bold shadow-lg shadow-primary/20">
            {loading ? "Cadastrando..." : (
              <>
                <Plus className="w-4 h-4" />
                Criar Empresa
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTenantModal;
