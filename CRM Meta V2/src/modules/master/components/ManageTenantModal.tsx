import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertTriangle, Save, Trash2, Power, PowerOff, Plus, Copy } from "lucide-react";
import { logSystemAction } from "@/modules/master/services/LogService";
import React from "react";
import { formatPhone, formatDocument, formatCEP } from "@/lib/formatters";

class ModalErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", background: "#f8d7da", color: "#721c24", borderRadius: "8px", margin: "20px", border: "1px solid #f5c6cb" }}>
          <h2>💥 Crash Fatal Interceptado no Modal!</h2>
          <p>Copie e cole o texto abaixo para eu consertar imediatamente:</p>
          <pre style={{ whiteSpace: "pre-wrap", fontWeight: "bold" }}>{this.state.error?.toString()}</pre>
          <pre style={{ fontSize: "10px", marginTop: "10px" }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export interface Tenant {
  id: string;
  name: string;
  plan: string;
  status: string;
  created_at: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  documento?: string;
  endereco?: string;
  invite_code?: string;
  invite_code_used?: boolean;
  razao_social?: string;
  nome_fantasia?: string;
  inscricao_estadual?: string;
  data_abertura_nascimento?: string;
}

interface ManageTenantModalProps {
  tenant: Tenant | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const ManageTenantModal = ({ tenant, open, onClose, onUpdate }: ManageTenantModalProps) => {
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmDeleteInput, setConfirmDeleteInput] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    plan: "gratuito",
    status: "active",
    telefone: "",
    whatsapp: "",
    email: "",
    documento: "",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    razao_social: "",
    nome_fantasia: "",
    inscricao_estadual: "",
    data_abertura_nascimento: ""
  });

  useEffect(() => {
    if (tenant) {
      let parsedEnd: any = {};
      try {
        if (typeof tenant.endereco === 'object' && tenant.endereco !== null) {
          parsedEnd = tenant.endereco || {};
        } else if (typeof tenant.endereco === 'string' && tenant.endereco.startsWith('{')) {
          parsedEnd = JSON.parse(tenant.endereco) || {};
        } else {
          parsedEnd.rua = tenant.endereco || "";
        }
      } catch(e) {}
      
      // Fallback de segurança contra JSONs válidos que são "null"
      if (!parsedEnd) parsedEnd = {};

      setFormData({
        name: tenant.name || "",
        plan: tenant.plan || "gratuito",
        status: tenant.status || "active",
        telefone: formatPhone(tenant.telefone || ""),
        whatsapp: formatPhone(tenant.whatsapp || ""),
        email: tenant.email || "",
        documento: formatDocument(tenant.documento || ""),
        cep: parsedEnd?.cep || "",
        rua: parsedEnd?.rua || "",
        numero: parsedEnd?.numero || "",
        complemento: parsedEnd?.complemento || "",
        bairro: parsedEnd?.bairro || "",
        cidade: parsedEnd?.cidade || "",
        estado: parsedEnd?.estado || "",
        razao_social: tenant.razao_social || "",
        nome_fantasia: tenant.nome_fantasia || "",
        inscricao_estadual: tenant.inscricao_estadual || "",
        data_abertura_nascimento: tenant.data_abertura_nascimento || ""
      });
    }
  }, [tenant]);

  const handleCepChange = async (val: string) => {
    const formatted = formatCEP(val);
    setFormData(p => ({ ...p, cep: formatted }));
    
    const cleanCep = formatted.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData(p => ({
            ...p,
            rua: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf
          }));
          toast.success("Endereço localizado!");
        }
      } catch (err) {}
    }
  };

  const handleSave = async () => {
    if (!tenant) return;
    setLoading(true);
    
    try {
      const endJSON = JSON.stringify({
        cep: formData.cep,
        rua: formData.rua,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado
      });

      const { error } = await supabase
        .from('tenants')
        .update({
          name: formData.name,
          plan: formData.plan,
          status: formData.status,
          telefone: formData.telefone,
          whatsapp: formData.whatsapp,
          email: formData.email,
          documento: formData.documento,
          endereco: endJSON,
          razao_social: formData.razao_social,
          nome_fantasia: formData.nome_fantasia,
          inscricao_estadual: formData.inscricao_estadual,
          data_abertura_nascimento: formData.data_abertura_nascimento
        })
        .eq('id', tenant.id);
        
      if (error) throw error;
      
      // LOGGING DA AUDITORIA
      let actionDetails = [];
      if (tenant.status !== formData.status) actionDetails.push(`Status alterado de ${tenant.status} para ${formData.status}`);
      if (tenant.plan !== formData.plan) actionDetails.push(`Plano alterado para ${formData.plan}`);

      if (actionDetails.length > 0) {
        logSystemAction({
          action: formData.status === 'suspended' ? 'suspend_tenant' : 'update_tenant',
          entity: `Tenant: ${tenant.name}`,
          details: { changes: actionDetails }
        });
      }
      
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
    if (confirmDeleteInput !== tenant.name) {
      toast.error("Nome incorreto. A exclusão foi cancelada por segurança.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenant.id);
        
      if (error) throw error;
      
      logSystemAction({
        action: 'delete_tenant',
        entity: `Tenant: ${tenant.name}`,
        details: { danger: 'Empresa e escopo deletados permanentemente' }
      });
      
      toast.success("Empresa excluída com sucesso.");
      onUpdate();
      onClose();
    } catch (err: any) {
      toast.error("Erro ao excluir empresa: " + err.message);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setConfirmDeleteInput("");
    }
  };

  if (!tenant) return null;

  return (
    <ModalErrorBoundary>
      <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
        <DialogContent className="flex flex-col w-full max-w-[95vw] sm:max-w-[520px] max-h-[90dvh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-3 border-b shrink-0">
            <DialogTitle>Gerenciar Empresa</DialogTitle>
            <DialogDescription className="text-xs">
              ID: {tenant?.id?.slice(0, 8)}...
            </DialogDescription>
          </DialogHeader>

          {/* Overlay de confimação de exclusão */}
          {showDeleteConfirm && (
            <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-800 shadow-xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p className="font-semibold text-sm">Exclusão permanente</p>
                </div>
                <p className="text-xs text-muted-foreground">Esta ação não pode ser desfeita. Todos os dados da empresa serão apagados.</p>
                <p className="text-xs font-medium">Digite <span className="font-bold text-red-600">{tenant?.name}</span> para confirmar:</p>
                <input
                  type="text"
                  value={confirmDeleteInput}
                  onChange={e => setConfirmDeleteInput(e.target.value)}
                  placeholder={tenant?.name}
                  autoFocus
                  className="w-full h-10 rounded-lg border border-red-300 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setShowDeleteConfirm(false); setConfirmDeleteInput(""); }} disabled={loading}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" className="flex-1 gap-1.5" onClick={handleDelete} disabled={loading || confirmDeleteInput !== tenant?.name}>
                    <Trash2 className="w-3.5 h-3.5" /> Confirmar
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Nome da Empresa */}
          <div className="grid gap-2">
            <Label htmlFor="name">Nome da Empresa</Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
            />
          </div>

          {/* Link de Acesso (Convite) */}
          {!tenant?.invite_code_used ? (
            <div className="grid gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg">
              <Label className="text-blue-700 dark:text-blue-300 font-bold">Link de Acesso (Convite)</Label>
              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={`${window.location.origin}/login?invite=${tenant?.invite_code || "Processando..."}`}
                  className="bg-background/50 text-xs font-mono select-all"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    const link = `${window.location.origin}/login?invite=${tenant?.invite_code}`;
                    navigator.clipboard.writeText(link);
                    toast.success("Link copiado para a área de transferência!");
                  }}
                >
                  <Copy className="w-4 h-4 text-blue-600" /> 
                </Button>
              </div>
              <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 italic">
                Este link expira automaticamente após o primeiro uso pelo cliente.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
              <Label className="text-green-700 dark:text-green-300 font-bold flex items-center gap-1"><Power className="w-4 h-4" /> Acesso Vinculado</Label>
              <p className="text-xs text-green-700/80 dark:text-green-400/80 mt-1">
                O dono da empresa já utilizou o convite e possui acesso ativo.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="documento">CNPJ / CPF</Label>
              <Input id="documento" placeholder="00.000.000/0000-00" value={formData.documento} onChange={(e) => setFormData(p => ({ ...p, documento: formatDocument(e.target.value) }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="email@empresa.com" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" placeholder="(00) 0000-0000" value={formData.telefone} onChange={(e) => setFormData(p => ({ ...p, telefone: formatPhone(e.target.value) }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" placeholder="(00) 90000-0000" value={formData.whatsapp} onChange={(e) => setFormData(p => ({ ...p, whatsapp: formatPhone(e.target.value) }))} />
            </div>
          </div>

          <div className="grid gap-2 border-t pt-2">
            <h4 className="text-sm font-semibold">Endereço Completo</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>CEP</Label>
                <Input value={formData.cep} onChange={e => handleCepChange(e.target.value)} maxLength={9} placeholder="00000-000" />
              </div>
              <div className="grid gap-2">
                <Label>Rua</Label>
                <Input value={formData.rua} onChange={e => setFormData(p => ({...p, rua: e.target.value}))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-2">
                <Label>Nº</Label>
                <Input value={formData.numero} onChange={e => setFormData(p => ({...p, numero: e.target.value}))} />
              </div>
              <div className="grid gap-2 col-span-2">
                <Label>Complemento</Label>
                <Input value={formData.complemento} onChange={e => setFormData(p => ({...p, complemento: e.target.value}))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-2 col-span-1">
                <Label>Bairro</Label>
                <Input value={formData.bairro} onChange={e => setFormData(p => ({...p, bairro: e.target.value}))} />
              </div>
              <div className="grid gap-2">
                <Label>Cidade</Label>
                <Input value={formData.cidade} onChange={e => setFormData(p => ({...p, cidade: e.target.value}))} />
              </div>
              <div className="grid gap-2">
                <Label>UF</Label>
                <Input value={formData.estado} className="uppercase" maxLength={2} onChange={e => setFormData(p => ({...p, estado: e.target.value}))} />
              </div>
            </div>
          </div>

          {/* Separador e Dados Receita */}
          <div className="grid gap-2 border-t pt-2">
            <h4 className="text-sm font-semibold">{(formData.documento?.length || 0) > 14 || (formData.documento?.length || 0) === 0 ? "Informações Institucionais (CNPJ)" : "Informações Pessoais (CPF)"}</h4>
            
            {(formData.documento?.length || 0) > 14 || (formData.documento?.length || 0) === 0 ? (
              <>
                <div className="grid gap-2">
                  <Label>Razão Social</Label>
                  <Input value={formData.razao_social} onChange={e => setFormData(p => ({...p, razao_social: e.target.value}))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Nome Fantasia</Label>
                    <Input value={formData.nome_fantasia} onChange={e => setFormData(p => ({...p, nome_fantasia: e.target.value}))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Abertura</Label>
                    <Input type="date" value={formData.data_abertura_nascimento} onChange={e => setFormData(p => ({...p, data_abertura_nascimento: e.target.value}))} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Inscrição Estadual</Label>
                  <Input value={formData.inscricao_estadual} onChange={e => setFormData(p => ({...p, inscricao_estadual: e.target.value}))} />
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Seu Nome</Label>
                  <Input value={formData.razao_social} onChange={e => setFormData(p => ({...p, razao_social: e.target.value}))} />
                </div>
                <div className="grid gap-2">
                  <Label>Nascimento</Label>
                  <Input type="date" value={formData.data_abertura_nascimento} onChange={e => setFormData(p => ({...p, data_abertura_nascimento: e.target.value}))} />
                </div>
              </div>
            )}
          </div>
          <div className="pt-2 mt-2 border-t border-border grid grid-cols-2 gap-4">
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

          <DialogFooter className="px-4 py-3 border-t shrink-0">
            <div className="flex items-center justify-between w-full gap-2">
              <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={loading} size="sm" className="gap-1.5 shrink-0">
                <Trash2 className="w-3.5 h-3.5" /> Deletar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancelar</Button>
                <Button size="sm" onClick={handleSave} disabled={loading} className="gap-1.5">
                  <Save className="w-3.5 h-3.5" /> Salvar
                </Button>
              </div>
            </div>
          </DialogFooter>
      </DialogContent>
    </Dialog>
    </ModalErrorBoundary>
  );
};

export default ManageTenantModal;
