import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { Product } from "@/lib/crm-data";
import { toast } from "sonner";

interface ProdutoModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'>) => Promise<void>;
  editingProduct?: Product | null;
}

const ProdutoModal = ({ open, onClose, onSave, editingProduct }: ProdutoModalProps) => {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("Ração");
  const [prazoRecompra, setPrazoRecompra] = useState("");
  const [diasAviso, setDiasAviso] = useState("3");
  const [mensagem, setMensagem] = useState("Olá {tutor}, a reposição do(a) {produto} do(a) {pet} está próxima! Quer que eu já separe para você?");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setNome(editingProduct.nome);
      setCategoria(editingProduct.categoria || "Ração");
      setPrazoRecompra(editingProduct.prazo_recompra_dias.toString());
      setDiasAviso(editingProduct.dias_aviso_previo.toString());
      setMensagem(editingProduct.mensagem_padrao || "");
    } else {
      setNome("");
      setCategoria("Ração");
      setPrazoRecompra("");
      setDiasAviso("3");
      setMensagem("Olá {tutor}, a reposição do(a) {produto} do(a) {pet} está próxima! Quer que eu já separe para você?");
    }
  }, [editingProduct, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !prazoRecompra) return;

    const numericPrazo = Number(prazoRecompra);
    const numericAviso = Number(diasAviso);

    if (isNaN(numericPrazo) || numericPrazo <= 0) {
      toast.error("O prazo de recompra deve ser maior que zero.");
      return;
    }

    setLoading(true);
    try {
      await onSave({
        nome,
        categoria: categoria || null,
        prazo_recompra_dias: numericPrazo,
        dias_aviso_previo: isNaN(numericAviso) ? 3 : numericAviso,
        mensagem_padrao: mensagem || null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-xl shadow-lg border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {editingProduct ? "Editar Produto" : "Novo Produto"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nome do Produto *</label>
            <input
              required
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Ração Golden 15kg"
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Highlighted Prazo Recompra Section */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={18} className="text-amber-600" />
              <label className="text-sm font-semibold text-amber-900">Prazo de Recompra (dias) *</label>
            </div>
            <input
              required
              type="number"
              min="1"
              value={prazoRecompra}
              onChange={(e) => setPrazoRecompra(e.target.value)}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-semibold"
            />
            <p className="text-xs text-amber-700 font-medium">
              Padrão para novas recompras: este valor será usado quando o produto for selecionado em "Iniciar Novo Ciclo"
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Categoria</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="Ração">Ração</option>
              <option value="Antipulgas">Antipulgas</option>
              <option value="Vacina">Vacina</option>
              <option value="Vermífugo">Vermífugo</option>
              <option value="Higiene">Higiene</option>
              <option value="Medicamento">Medicamento</option>
              <option value="Estética">Estética</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Aviso Prévio (dias) *</label>
            <input
              required
              type="number"
              min="0"
              value={diasAviso}
              onChange={(e) => setDiasAviso(e.target.value)}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">Quantos dias antes enviar lembretes</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Mensagem Padrão (WhatsApp)</label>
            <p className="text-xs text-muted-foreground">Variáveis: {'{tutor}, {produto}, {pet}'}</p>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="w-full flex min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !nome.trim() || !prazoRecompra}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium transition-opacity disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProdutoModal;
