import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Plus, Sparkles, Mail, KeyRound, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logSystemAction } from "@/modules/master/services/LogService";
import { SystemPlan } from "../components/PlanManagement";

interface CreateTenantModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTenantModal = ({ open, onClose, onSuccess }: CreateTenantModalProps) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [plans, setPlans] = useState<SystemPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("essencial");
  const [creationMode, setCreationMode] = useState<'invite' | 'password'>('invite');
  const [tempPassword, setTempPassword] = useState("");

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('system_plans')
        .select('*')
        .order('price', { ascending: true });
      if (!error && data) setPlans(data as SystemPlan[]);
    } catch (err) {
      console.error("Erro ao buscar planos:", err);
    }
  };

  useState(() => {
    fetchPlans();
  });

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

    if (!adminEmail.trim()) {
      toast.error("Por favor, insira o e-mail do administrador da empresa.");
      return;
    }

    if (creationMode === 'password' && !tempPassword) {
      toast.error("Defina a senha provisória para o novo administrador.");
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
          plan_id: selectedPlanId,
          status: 'active'
        } as any)
        .select()
        .single();

      if (error) throw error;

      if (creationMode === 'password') {
        // MODO 1: Criação direta com senha via RPC
        const { error: rpcError } = await supabase.rpc('create_user_admin', {
          p_email: adminEmail.trim(),
          p_password: tempPassword,
          p_display_name: `Adm ${name.trim()}`,
          p_role: 'tenant_admin',
          p_tenant_id: data.id,
          p_must_change: true
        });
        if (rpcError) throw rpcError;
      } else {
        // MODO 2: Convite (pré-cadastro de perfil)
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            tenant_id: data.id,
            email_temp: adminEmail.trim(),
            role: 'tenant_admin',
            status: 'invited',
            display_name: `Administrador ${name}`
          });
        if (profileError) throw profileError;
      }

      await logSystemAction({
        action: 'create_tenant',
        entity: `Tenant: ${name}`,
        details: { id: data.id, schema: 'public' }
      });

      toast.success("Empresa e Administrador cadastrados com sucesso!");
      setName("");
      setSlug("");
      setAdminEmail("");
      setTempPassword("");
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

        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="bg-secondary/10 p-1.5 rounded-xl flex gap-1 mb-2">
            <button
              type="button"
              onClick={() => setCreationMode('invite')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-lg transition-all ${creationMode === 'invite' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Mail size={12} /> Convite via Email
            </button>
            <button
              type="button"
              onClick={() => setCreationMode('password')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-lg transition-all ${creationMode === 'password' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <KeyRound size={12} /> Senha Direta
            </button>
          </div>

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

          <div className="grid gap-2">
            <Label htmlFor="adminEmail" className="text-sm font-semibold">E-mail do Administrador</Label>
            <Input 
              id="adminEmail" 
              type="email"
              placeholder="admin@empresa.com" 
              value={adminEmail} 
              onChange={(e) => setAdminEmail(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-sm font-semibold">Plano da Empresa</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger className="h-11 rounded-xl bg-background border-border">
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                {plans.map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-xs font-medium">
                    {p.name} - R$ {Number(p.price).toLocaleString('pt-BR')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {creationMode === 'password' && (
            <div className="grid gap-2 animate-in slide-in-from-top-2">
              <Label className="text-sm font-semibold">Definir Senha Provisória *</Label>
              <div className="relative group">
                <Input 
                  type="text" 
                  value={tempPassword} 
                  onChange={e => setTempPassword(e.target.value)} 
                  className="rounded-xl h-11 border-border pr-10"
                  placeholder="Ex: Senha123!"
                />
                <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/30" />
              </div>
              <p className="text-[10px] text-amber-600 font-medium italic leading-none">Obrigará o usuário a trocar no primeiro login.</p>
            </div>
          )}
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
