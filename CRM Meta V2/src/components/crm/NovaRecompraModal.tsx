import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Customer, Pet, Product, fetchCustomers, fetchPets, fetchProducts } from "@/lib/crm-data";
import { formatISODate } from "@/utils/date";

interface NovaRecompraModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { petId: string; productId: string; dataCompra: string; prazoRecompra: number }) => Promise<void>;
}

const NovaRecompraModal = ({ open, onClose, onSave }: NovaRecompraModalProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedPetId, setSelectedPetId] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [dataCompra, setDataCompra] = useState(() => formatISODate(new Date()));
  const [prazoRecompra, setPrazoRecompra] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      Promise.all([fetchCustomers(), fetchPets(), fetchProducts()]).then(([c, p, prod]) => {
        setCustomers(c);
        setPets(p);
        setProducts(prod);
      });
      // Reset state
      setSelectedCustomerId("");
      setSelectedPetId("");
      setSelectedCategoria("");
      setSelectedProductId("");
      setDataCompra(formatISODate(new Date()));
      setPrazoRecompra(30);
      setFormErrors({});
    }
  }, [open]);

  // Auto-fill prazo_recompra when product is selected
  useEffect(() => {
    if (selectedProductId) {
      const product = products.find(p => p.id === selectedProductId);
      if (product) {
        setPrazoRecompra(product.prazo_recompra_dias);
      }
    }
  }, [selectedProductId, products]);

  const calculateDates = () => {
    if (!dataCompra || !prazoRecompra) {
      return { proximaData: '', dataLembrete: '' };
    }

    const data = new Date(dataCompra + 'T12:00:00');
    const product = products.find(p => p.id === selectedProductId);
    const diasAviso = product?.dias_aviso_previo || 3;

    const proxima = new Date(data);
    proxima.setDate(proxima.getDate() + prazoRecompra);

    const lembrete = new Date(proxima);
    lembrete.setDate(lembrete.getDate() - diasAviso);

    return {
      proximaData: formatISODate(proxima),
      dataLembrete: formatISODate(lembrete)
    };
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!selectedPetId) errors.pet = 'Pet é obrigatório';
    if (!selectedProductId) errors.product = 'Produto é obrigatório';
    if (!dataCompra) errors.dataCompra = 'Data da compra é obrigatória';
    if (!prazoRecompra || prazoRecompra < 1) {
      errors.prazo = 'Prazo de recompra é obrigatório e deve ser maior que 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSave({
        petId: selectedPetId,
        productId: selectedProductId,
        dataCompra,
        prazoRecompra
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const filteredPets = pets.filter(p => !selectedCustomerId || p.customer_id === selectedCustomerId);
  const filteredProducts = products.filter(p => !selectedCategoria || p.categoria === selectedCategoria);
  const { proximaData, dataLembrete } = calculateDates();

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-xl shadow-lg border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Iniciar Novo Ciclo de Recompra</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tutor (Opcional - Filtro)</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                setSelectedPetId(""); // Reset pet when customer changes
              }}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos os Tutores</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Pet *</label>
            <select
              value={selectedPetId}
              onChange={(e) => setSelectedPetId(e.target.value)}
              disabled={filteredPets.length === 0}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="">Selecione o Pet</option>
              {filteredPets.map(p => {
                const tutor = customers.find(c => c.id === p.customer_id);
                return (
                  <option key={p.id} value={p.id}>{p.nome} {tutor ? `(${tutor.nome})` : ''}</option>
                );
              })}
            </select>
            {filteredPets.length === 0 && <p className="text-xs text-red-500">Nenhum pet encontrado para este tutor.</p>}
            {formErrors.pet && <p className="text-xs text-red-500">{formErrors.pet}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Categoria do Produto</label>
            <select
              value={selectedCategoria}
              onChange={(e) => {
                setSelectedCategoria(e.target.value);
                setSelectedProductId(""); // Reset product when category changes
              }}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todas as Categorias</option>
              <option value="Antipulgas">Antipulgas</option>
              <option value="Vacina">Vacina</option>
              <option value="Ração">Ração</option>
              <option value="Vermífugo">Vermífugo</option>
              <option value="Higiene">Higiene</option>
              <option value="Medicamento">Medicamento</option>
              <option value="Estética">Estética</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Produto Adquirido *</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Selecione o produto</option>
              {filteredProducts.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome} (Ciclo de {p.prazo_recompra_dias} dias)
                </option>
              ))}
            </select>
            {formErrors.product && <p className="text-xs text-red-500">{formErrors.product}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Prazo de Recompra (dias) *</label>
            <input
              type="number"
              min="1"
              value={prazoRecompra}
              onChange={(e) => setPrazoRecompra(parseInt(e.target.value) || 0)}
              placeholder="Informe em quantos dias esse produto normalmente precisa ser renovado"
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">Ex: 30=mensal, 90=trimestral, 365=anual</p>
            {formErrors.prazo && <p className="text-xs text-red-500">{formErrors.prazo}</p>}
          </div>

          {proximaData && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-1">
              <p className="text-xs text-blue-600 font-semibold">Próxima recompra: <span className="font-bold">{new Intl.DateTimeFormat('pt-BR').format(new Date(proximaData + 'T12:00:00'))}</span></p>
              <p className="text-xs text-blue-600">Data de lembrete: <span className="font-bold">{new Intl.DateTimeFormat('pt-BR').format(new Date(dataLembrete + 'T12:00:00'))}</span></p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Data da Compra Inicial *</label>
            <input
              type="date"
              value={dataCompra}
              onChange={(e) => setDataCompra(e.target.value)}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {formErrors.dataCompra && <p className="text-xs text-red-500">{formErrors.dataCompra}</p>}
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
              disabled={loading}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium transition-opacity disabled:opacity-50"
            >
              {loading ? "Iniciando..." : "Iniciar Ciclo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NovaRecompraModal;
