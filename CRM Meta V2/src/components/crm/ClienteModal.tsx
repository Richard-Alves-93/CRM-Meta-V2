import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Customer } from "@/lib/crm-data";
import { toast } from "sonner";
import { formatPhone, formatCEP } from "@/lib/formatters";

interface ClienteModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id'>) => Promise<void>;
  editingCustomer?: Customer | null;
}

const ClienteModal = ({ open, onClose, onSave, editingCustomer }: ClienteModalProps) => {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [complemento, setComplemento] = useState("");
  const [loading, setLoading] = useState(false);

  const numberInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCustomer) {
      setNome(editingCustomer.nome);
      setTelefone(editingCustomer.telefone || "");
      setWhatsapp(editingCustomer.whatsapp || "");
      setEmail(editingCustomer.email || "");
      setObservacoes(editingCustomer.observacoes || "");
      setCep(editingCustomer.cep || "");
      setEndereco(editingCustomer.endereco || "");
      setNumero(editingCustomer.numero || "");
      setBairro(editingCustomer.bairro || "");
      setCidade(editingCustomer.cidade || "");
      setComplemento(editingCustomer.complemento || "");
    } else {
      setNome("");
      setTelefone("");
      setWhatsapp("");
      setEmail("");
      setObservacoes("");
      setCep("");
      setEndereco("");
      setNumero("");
      setBairro("");
      setCidade("");
      setComplemento("");
    }
  }, [editingCustomer, open]);

  if (!open) return null;

  const handlePhoneChange = (field: 'whatsapp' | 'telefone', value: string) => {
    const formatted = formatPhone(value);
    if (field === 'whatsapp') setWhatsapp(formatted);
    else setTelefone(formatted);
  };

  const handleCEPChange = async (value: string) => {
    const formattedCEP = formatCEP(value);
    setCep(formattedCEP);

    const cleanCEP = formattedCEP.replace(/\D/g, "");
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data = await response.json();
        
        if (data.erro) {
          toast.error("CEP não encontrado.");
          return;
        }

        setEndereco(data.logradouro || "");
        setBairro(data.bairro || "");
        setCidade(data.localidade || "");
        
        setTimeout(() => numberInputRef.current?.focus(), 150);
        toast.success("Endereço preenchido!");
      } catch (error) {
        toast.error("Erro ao buscar CEP.");
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setLoading(true);
    try {
      await onSave({
        nome,
        telefone: telefone || null,
        whatsapp: whatsapp || null,
        email: email || null,
        observacoes: observacoes || null,
        cep: cep || null,
        endereco: endereco || null,
        numero: numero || null,
        bairro: bairro || null,
        cidade: cidade || null,
        complemento: complemento || null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-2xl rounded-xl shadow-lg border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {editingCustomer ? "Editar Tutor" : "Novo Tutor"}
          </h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-2.5">
          {/* Fila 1: Nome e WhatsApp */}
          <div className="grid grid-cols-12 gap-2 sm:gap-3">
            <div className="col-span-12 sm:col-span-8 space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Nome do Tutor *</label>
              <input 
                required
                type="text" 
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full flex h-8 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              />
            </div>
            <div className="col-span-12 sm:col-span-4 space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">WhatsApp *</label>
              <input 
                required
                type="text" 
                value={whatsapp}
                onChange={(e) => handlePhoneChange('whatsapp', e.target.value)}
                placeholder="(51) 99999-9999"
                className="w-full flex h-8 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              />
            </div>
          </div>

          {/* Fila 2: E-mail e Outro Tel */}
          <div className="grid grid-cols-12 gap-2 sm:gap-3">
            <div className="col-span-7 sm:col-span-7 space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">E-mail</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joao@email.com"
                className="w-full flex h-8 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              />
            </div>
            <div className="col-span-5 sm:col-span-5 space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Outro Tel.</label>
              <input 
                type="text" 
                value={telefone}
                onChange={(e) => handlePhoneChange('telefone', e.target.value)}
                placeholder="(51) 3333-3333"
                className="w-full flex h-8 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              />
            </div>
          </div>

          {/* Fila 3 Mobile: CEP + Nº na mesma linha, Rua abaixo
              Fila 3 Desktop: CEP | Rua | Nº na mesma linha */}
          <div className="grid grid-cols-12 gap-2 sm:gap-3">
            {/* CEP: mobile col-4, desktop col-3 */}
            <div className="col-span-4 sm:col-span-3 space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">CEP *</label>
              <input 
                type="text" 
                value={cep}
                onChange={(e) => handleCEPChange(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                className="w-full flex h-8 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              />
            </div>
            {/* Rua: mobile col-12 (quebra linha), desktop col-7 (mesma linha) */}
            <div className="col-span-12 sm:col-span-7 space-y-1 order-last sm:order-none">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Rua *</label>
              <input 
                type="text" 
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Logradouro..."
                className="w-full flex h-8 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              />
            </div>
            {/* Nº: mobile col-8 (ao lado do CEP), desktop col-2 */}
            <div className="col-span-8 sm:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase text-primary">Nº *</label>
              <input 
                ref={numberInputRef}
                type="text" 
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="123"
                className="w-full flex h-8 rounded-md border border-primary/30 bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              />
            </div>
          </div>

          {/* Fila 4: Bairro, Cidade e Compl — na mesma linha no mobile também */}
          <div className="grid grid-cols-12 gap-2 sm:gap-3">
            <div className="col-span-6 sm:col-span-4 space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Bairro *</label>
              <input 
                type="text" 
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                placeholder="..."
                className="w-full flex h-8 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              />
            </div>
            <div className="col-span-6 sm:col-span-5 space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Cidade *</label>
              <input 
                type="text" 
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="..."
                className="w-full flex h-8 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              />
            </div>
            <div className="col-span-12 sm:col-span-3 space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Compl.</label>
              <input 
                type="text" 
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                placeholder="Apto, sala..."
                className="w-full flex h-8 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Observações</label>
            <textarea 
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais..."
              className="w-full flex min-h-[40px] max-h-[40px] rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none text-[12px] leading-tight" 
            />
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-border mt-1">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-1.5 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading || !nome.trim()}
              className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium transition-opacity disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClienteModal;
