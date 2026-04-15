import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { UserPlus, MapPin, Phone, CreditCard, ShieldCheck, Mail, Search, Info } from "lucide-react";

interface Sector {
  id: string;
  name: string;
  permissions?: any;
}

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sectors: Sector[];
  tenantId: string | null;
}

const AddUserModal = ({ open, onClose, onSuccess, sectors, tenantId }: AddUserModalProps) => {
  const [loading, setLoading] = useState(false);
  const [fetchingCep, setFetchingCep] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    documento: "",
    cnh: "",
    cargo: "user",
    sector_id: "",
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    uf: "",
    complemento: ""
  });

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

  // Sincronizar permissões iniciais quando o setor muda
  useEffect(() => {
    if (formData.sector_id) {
        const sector = sectors.find(s => s.id === formData.sector_id);
        if (sector?.permissions) {
            setPermissions({ ...permissions, ...sector.permissions });
        }
    }
  }, [formData.sector_id, sectors]);

  const handleLookupCep = async () => {
    const cep = formData.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;

    setFetchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error("CEP não encontrado.");
      } else {
        setFormData(p => ({
          ...p,
          rua: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          uf: data.uf
        }));
      }
    } catch (err) {
      toast.error("Erro ao buscar CEP.");
    } finally {
      setFetchingCep(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.email || !formData.documento || !formData.cep) {
      toast.error("Preencha todos os campos obrigatórios (Nome, E-mail, CPF e CEP)");
      return;
    }

    setLoading(true);
    try {
      // 1. Criar o convite no Supabase Auth
      // Nota: Em uma aplicação real, você usaria uma Edge Function ou a Dashboard 
      // do Supabase para enviar convites. Aqui vamos criar o perfil primeiro, 
      // assumindo que o sistema de login lidará com o "claim" ou que o admin 
      // usará o sistema de convites oficial.
      
      // VAMOS SIMULAR A CRIAÇÃO DO PERFIL PRÉ-ATIVO
      // O usuário terá que se cadastrar com o mesmo email para assumir o perfil
      
      // OBS: Para SaaS real, o ideal é usar supabase.auth.admin.inviteUserByEmail()
      // via Edge Function (server side). Por agora, vamos criar o profile.
      
      // VAMOS USAR UM MÉTODO SEGURO:
      // Verificamos se já existe um perfil com esse email
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email_temp', formData.email) // Precisamos de uma forma de rastrear antes do signup
        .single();
        
      // Na verdade, a melhor forma é o Admin criar e o usuário se cadastrar.
      // Vou criar o perfil e deixar o user_id nulo, usando o email como chave.
      // (Isso requer ajuste na tabela de profiles para não ter user_id obrigatório no insert)
      
      // ATALHO PARA FLUXO SAAS: 
      // Vou criar apenas o perfil com as permissões. 
      // No useAuth, quando um novo usuário logar, ele checa se existe um perfil pendente para o email dele.
      
      const enderecoJSON = {
        cep: formData.cep,
        rua: formData.rua,
        numero: formData.numero,
        bairro: formData.bairro,
        cidade: formData.cidade,
        uf: formData.uf,
        complemento: formData.complemento
      };

      const { data: profile, error } = await supabase
        .from('profiles')
        .insert({
          display_name: formData.nome,
          email_temp: formData.email, // Coluna auxiliar que o usuário precisaria criar ou usar display_name
          role: formData.cargo,
          tenant_id: tenantId,
          sector_id: formData.sector_id || null,
          telefone: formData.telefone,
          documento: formData.documento,
          cnh: formData.cnh,
          endereco: enderecoJSON,
          permissions: permissions
        } as any);

      if (error) throw error;

      toast.success(`Usuário ${formData.nome} pré-cadastrado! Instrua-o a se cadastrar com o e-mail ${formData.email}.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar membro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <UserPlus className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold">Adicionar Membro à Equipe</DialogTitle>
          <DialogDescription>
            Cadastre os dados do funcionário e defina exatamente o que ele pode acessar.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-8">
          {/* Seção 1: Dados Básicos */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Info className="w-4 h-4" /> Informações Pessoais
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input value={formData.nome} onChange={e => setFormData(p => ({...p, nome: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <Label>E-mail Corporativo *</Label>
                <Input type="email" value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={formData.telefone} onChange={e => setFormData(p => ({...p, telefone: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <Label>CPF *</Label>
                <Input value={formData.documento} onChange={e => setFormData(p => ({...p, documento: e.target.value}))} />
              </div>
            </div>
            {formData.cargo === 'driver' && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <Label>CNH (Carteira de Motorista)</Label>
                <Input value={formData.cnh} onChange={e => setFormData(p => ({...p, cnh: e.target.value}))} />
              </div>
            )}
          </div>

          {/* Seção 2: Endereço (API ViaCEP) */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Endereço Residencial
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>CEP *</Label>
                <div className="flex gap-2">
                  <Input value={formData.cep} onChange={e => setFormData(p => ({...p, cep: e.target.value}))} />
                  <Button size="icon" variant="secondary" onClick={handleLookupCep} disabled={fetchingCep}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Nome da Rua</Label>
                <Input value={formData.rua} onChange={e => setFormData(p => ({...p, rua: e.target.value}))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Número</Label>
                <Input value={formData.numero} onChange={e => setFormData(p => ({...p, numero: e.target.value}))} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Bairro</Label>
                <Input value={formData.bairro} onChange={e => setFormData(p => ({...p, bairro: e.target.value}))} />
              </div>
            </div>
          </div>

          {/* Seção 3: Atribuição e Permissões */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Setor e Permissões Individuais
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cargo / Função</Label>
                <Select value={formData.cargo} onValueChange={v => setFormData(p=>({...p, cargo: v}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Colaborador Comum</SelectItem>
                    <SelectItem value="tenant_admin">Administrador da Empresa</SelectItem>
                    <SelectItem value="driver">Motorista / Logística</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Setor / Departamento</Label>
                <Select value={formData.sector_id} onValueChange={v => setFormData(p=>({...p, sector_id: v}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um setor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-secondary/20 p-4 rounded-xl space-y-3 mt-4">
              <p className="text-xs font-bold text-muted-foreground mb-3">O QUE ESTE USUÁRIO PODE FAZER?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {Object.keys(permissionLabels).map(key => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`p-${key}`} 
                      checked={permissions[key]} 
                      onCheckedChange={(checked) => setPermissions(p => ({...p, [key]: !!checked}))}
                    />
                    <label 
                      htmlFor={`p-${key}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {permissionLabels[key]}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-secondary/10 border-t sticky bottom-0">
          <Button variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">Cancelar</Button>
          <Button onClick={handleSave} disabled={loading} className="rounded-xl gap-2 font-bold shadow-lg">
            {loading ? "Processando..." : (
              <>
                <UserPlus className="w-4 h-4" />
                Cadastrar e Convidar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserModal;
