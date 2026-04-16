import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { UserPlus, MapPin, Phone, CreditCard, ShieldCheck, Mail, Search, Info, KeyRound } from "lucide-react";
import { formatPhone, formatDocument, formatCEP } from "@/lib/formatters";

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
  initialData?: any;
}

const AddUserModal = ({ open, onClose, onSuccess, sectors, tenantId, initialData }: AddUserModalProps) => {
  const [loading, setLoading] = useState(false);
  const [fetchingCep, setFetchingCep] = useState(false);
  const [creationMode, setCreationMode] = useState<'invite' | 'password'>('invite');
  const [tempPassword, setTempPassword] = useState("");
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    whatsapp: "",
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
    "pdv.open": false,
    "pdv.sell": false,
    "pdv.discount": false,
    "pdv.cancel": false,
    "pdv.view": false,
  });

  useEffect(() => {
    if (initialData) {
      const end = initialData.endereco || {};
      setFormData({
        nome: initialData.display_name || "",
        email: initialData.email_temp || "",
        telefone: initialData.telefone || "",
        whatsapp: initialData.whatsapp || "",
        documento: initialData.documento || "",
        cnh: initialData.cnh || "",
        cargo: initialData.role || "user",
        sector_id: initialData.sector_id || "",
        cep: end.cep || "",
        rua: end.rua || "",
        numero: end.numero || "",
        bairro: end.bairro || "",
        cidade: end.cidade || "",
        uf: end.uf || "",
        complemento: end.complemento || ""
      });
      if (initialData.permissions) {
        setPermissions(initialData.permissions);
      }
    } else {
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        whatsapp: "",
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
  }, [initialData, open]);

  const permissionLabels: Record<string, string> = {
    view_dashboard: "Acesso ao Dashboard Principal",
    view_sales: "Ver e Lançar Vendas",
    view_goals: "Gerenciar Metas",
    view_customers: "Acesso a Clientes e Pets",
    view_logistics: "Gestão de Transportes",
    view_reports: "Ver Relatórios e Estatísticas",
    view_settings: "Configurações da Empresa",
    manage_team: "Gerenciar Equipe e Setores",
    "pdv.open": "Abrir Ponto de Venda",
    "pdv.sell": "Realizar Vendas e Pagamentos",
    "pdv.discount": "Aplicar Descontos no PDV",
    "pdv.cancel": "Cancelar Vendas (PDV)",
    "pdv.view": "Histórico de Vendas PDV",
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

  const handleLookupCepByValue = async (cleanCep: string) => {
    setFetchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
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
        toast.success("Endereço preenchido automaticamente!");
      }
    } catch (err) {
      toast.error("Erro ao buscar CEP.");
    } finally {
      setFetchingCep(false);
    }
  };

  const handleCepChange = (val: string) => {
    const formatted = formatCEP(val);
    setFormData(p => ({ ...p, cep: formatted }));
    
    const cleanCep = formatted.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      handleLookupCepByValue(cleanCep);
    }
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.email || !formData.documento || !formData.cep) {
      toast.error("Preencha todos os campos obrigatórios (Nome, E-mail, CPF e CEP)");
      return;
    }

    if (creationMode === 'password' && !tempPassword) {
      toast.error("Defina a senha provisória para o usuário.");
      return;
    }

    setLoading(true);
    try {
      const enderecoJSON = {
        cep: formData.cep,
        rua: formData.rua,
        numero: formData.numero,
        bairro: formData.bairro,
        cidade: formData.cidade,
        uf: formData.uf,
        complemento: formData.complemento
      };

      const dataToSave = {
        display_name: formData.nome,
        email_temp: formData.email, 
        role: formData.cargo,
        tenant_id: tenantId,
        sector_id: formData.sector_id || null,
        telefone: formData.whatsapp, // Salva o mesmo número em ambos para compatibilidade
        whatsapp: formData.whatsapp,
        documento: formData.documento,
        cnh: formData.cnh,
        endereco: enderecoJSON,
        permissions: permissions,
        status: creationMode === 'password' ? 'active' : (initialData ? initialData.status : 'invited')
      };

      if (creationMode === 'password' && !initialData) {
        // MODO 1: Criação direta com senha via RPC (SQL)
        const { data: userId, error: rpcError } = await supabase.rpc('create_user_admin', {
          p_email: formData.email,
          p_password: tempPassword,
          p_display_name: formData.nome,
          p_role: formData.cargo,
          p_tenant_id: tenantId,
          p_must_change: true
        });

        if (rpcError) throw rpcError;
        toast.success(`Usuário ${formData.nome} criado com sucesso com senha provisória!`);
      } else if (initialData?.id) {
        // MODO 2: Atualização de perfil existente
        const { error } = await supabase
          .from('profiles')
          .update(dataToSave)
          .eq('id', initialData.id);
        if (error) throw error;
        toast.success(`Usuário ${formData.nome} atualizado com sucesso!`);
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert(dataToSave);
        if (error) throw error;
        toast.success(`Usuário ${formData.nome} pré-cadastrado! Instrua-o a se cadastrar com o e-mail ${formData.email}.`);
      }

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
      <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto p-0 border-border bg-card">
        <DialogHeader className="p-6 pb-0">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <UserPlus className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            {initialData ? "Editar Membro" : "Adicionar Membro à Equipe"}
          </DialogTitle>
          <DialogDescription>
            {initialData 
              ? "Atualize os dados e permissões do colaborador." 
              : "Cadastre os dados do funcionário e defina exatamente o que ele pode acessar."}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-8">
          {!initialData && (
            <div className="bg-secondary/10 p-1.5 rounded-xl flex gap-1 mb-2">
              <button
                type="button"
                onClick={() => setCreationMode('invite')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${creationMode === 'invite' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Mail size={14} /> Convite por E-mail
              </button>
              <button
                type="button"
                onClick={() => setCreationMode('password')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${creationMode === 'password' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <KeyRound size={14} /> Senha Provisória
              </button>
            </div>
          )}

          {/* Seção 1: Dados Básicos */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Info className="w-4 h-4" /> Informações Pessoais
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input value={formData.nome} onChange={e => setFormData(p => ({...p, nome: e.target.value}))} className="rounded-lg h-10 border-border" />
              </div>
              <div className="space-y-2">
                <Label>E-mail Corporativo *</Label>
                <Input type="email" value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))} className="rounded-lg h-10 border-border" />
              </div>
            </div>

            {creationMode === 'password' && !initialData && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <Label>Definir Senha Provisória *</Label>
                <div className="relative group">
                  <Input 
                    type="text" 
                    value={tempPassword} 
                    onChange={e => setTempPassword(e.target.value)} 
                    className="rounded-lg h-10 border-border pr-10"
                    placeholder="Ex: Mudar123"
                  />
                  <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                </div>
                <p className="text-[10px] text-amber-600 font-medium">O usuário será forçado a trocar esta senha no primeiro login.</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tel./WhatsApp *</Label>
                <Input 
                  value={formData.whatsapp} 
                  onChange={e => setFormData(p => ({...p, whatsapp: formatPhone(e.target.value)}))} 
                  placeholder="(00) 00000-0000"
                  className="rounded-lg h-10 border-border font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>CPF *</Label>
                <Input 
                  value={formData.documento} 
                  onChange={e => setFormData(p => ({...p, documento: formatDocument(e.target.value)}))} 
                  placeholder="000.000.000-00"
                  className="rounded-lg h-10 border-border font-mono"
                />
              </div>
            </div>
            {formData.cargo === 'driver' && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <Label>CNH (Carteira de Motorista)</Label>
                <Input value={formData.cnh} onChange={e => setFormData(p => ({...p, cnh: e.target.value}))} className="rounded-lg h-10 border-border" />
              </div>
            )}
          </div>

          {/* Seção 2: Endereço (API ViaCEP) */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Endereço Residencial
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>CEP *</Label>
                <div className="flex gap-2">
                  <Input 
                    value={formData.cep} 
                    onChange={e => handleCepChange(e.target.value)} 
                    placeholder="00000-000"
                    maxLength={9}
                    className="rounded-lg h-10 border-border font-mono"
                  />
                  {fetchingCep && <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full self-center"></div>}
                </div>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Nome da Rua</Label>
                <Input value={formData.rua} onChange={e => setFormData(p => ({...p, rua: e.target.value}))} className="rounded-lg h-10 border-border" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Número</Label>
                <Input value={formData.numero} id="member-numero" onChange={e => setFormData(p => ({...p, numero: e.target.value}))} className="rounded-lg h-10 border-border" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Bairro</Label>
                <Input value={formData.bairro} onChange={e => setFormData(p => ({...p, bairro: e.target.value}))} className="rounded-lg h-10 border-border" />
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
                {initialData ? "Salvar Alterações" : "Cadastrar e Convidar"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserModal;
