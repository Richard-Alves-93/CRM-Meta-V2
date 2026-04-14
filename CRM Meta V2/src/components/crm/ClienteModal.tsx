import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Customer } from "@/lib/crm-data";

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
      <div className="bg-card w-full max-w-lg rounded-xl shadow-lg border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Linha 1: Nome */}
          <div className="space-y-1">
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

          {/* Linha 2: WhatsApp e CEP */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">WhatsApp *</label>
              <input 
                type="text" 
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(51) 99999-9999"
                className="w-full flex h-8 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">CEP *</label>
              <input 
                type="text" 
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="00000-000"
                className="w-full flex h-8 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              />
            </div>
          </div>

          {/* Linha 3: Rua e Número */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 sm:col-span-9 space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Rua *</label>
              <input 
                type="text" 
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Logradouro..."
                className="w-full flex h-8 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              />
            </div>
            <div className="col-span-12 sm:col-span-3 space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Nº *</label>
              <input 
                type="text" 
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="123"
                className="w-full flex h-8 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              />
            </div>
          </div>

          {/* Linha 4: Compl, Bairro, Cidade */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-4 space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Compl.</label>
              <input 
                type="text" 
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                placeholder="..."
                className="w-full flex h-8 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              />
            </div>
            <div className="col-span-4 space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Bairro *</label>
              <input 
                type="text" 
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                placeholder="..."
                className="w-full flex h-8 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              />
            </div>
            <div className="col-span-4 space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Cidade *</label>
              <input 
                type="text" 
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="..."
                className="w-full flex h-8 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              />
            </div>
          </div>

          {/* Linha 5: Outros */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">E-mail</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joao@email.com"
                className="w-full flex h-8 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Telefone</label>
              <input 
                type="text" 
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="..."
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
              className="w-full flex min-h-[40px] max-h-[40px] rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" 
            />
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-border mt-2">
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
