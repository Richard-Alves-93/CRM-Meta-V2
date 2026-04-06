import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { PetPurchase, Product, fetchProducts } from "@/lib/crm-data";
import { formatISODate } from "@/utils/date";

interface RecompraModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { purchaseId: string; newProductId: string; dataCompra: string; restartCycle: boolean }) => Promise<void>;
  purchase?: Omit<PetPurchase, 'customer'|'pet'|'product'> & { product?: Product } | null;
}

const RecompraModal = ({ open, onClose, onSave, purchase }: RecompraModalProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [dataCompra, setDataCompra] = useState(() => formatISODate(new Date()));
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (open) {
      fetchProducts().then(setProducts);
    }
  }, [open]);

  useEffect(() => {
    if (purchase) {
      setSelectedProductId(purchase.product_id);
      setDataCompra(formatISODate(new Date()));
    }
  }, [purchase, open]);

  if (!open || !purchase) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !dataCompra) return;

    setLoading(true);
    try {
      await onSave({
        purchaseId: purchase.id,
        newProductId: selectedProductId,
        dataCompra,
        restartCycle: true // Always restarting the cycle when registering a new purchase here
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const isChangingProduct = selectedProductId !== purchase.product_id;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-xl shadow-lg border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Registrar Recompra</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="bg-secondary/30 p-3 rounded-md mb-4 text-sm text-foreground">
            Registrando recompra para o ciclo de: <strong>{purchase.product?.nome || 'Produto Atual'}</strong>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Data da Nova Compra *</label>
            <input 
              required
              type="date" 
              value={dataCompra}
              onChange={(e) => setDataCompra(e.target.value)}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Produto Comprado *</label>
            <p className="text-xs text-muted-foreground mb-1">Você pode manter o mesmo produto ou trocar caso o tutor tenha decidido mudar de ração/medicamento.</p>
            <select 
              required
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" disabled>Selecione o produto</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome} (a cada {p.prazo_recompra_dias} dias)
                </option>
              ))}
            </select>
          </div>

          {isChangingProduct && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-md text-sm border border-blue-200 dark:border-blue-900">
              <strong>Atenção:</strong> O ciclo atual será marcado como "Trocado" e um novo ciclo de compra será iniciado para este novo produto.
            </div>
          )}
          {!isChangingProduct && (
            <div className="p-3 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 rounded-md text-sm border border-green-200 dark:border-green-900">
              O ciclo atual será marcado como "Recompra Registrada" e um novo ciclo será iniciado com os mesmos prazos.
            </div>
          )}

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
              disabled={loading || !selectedProductId || !dataCompra}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium transition-opacity disabled:opacity-50"
            >
              {loading ? "Registrando..." : "Confirmar Recompra"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecompraModal;
