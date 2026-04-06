import { useState } from "react";
import { Product } from "@/lib/crm-data";
import { Plus } from "lucide-react";
import ProdutoModal from "../../ProdutoModal";
import { ProdutosTable } from "./ProdutosTable";

interface ProdutosTabProps {
  products: Product[];
  loading: boolean;
  onSaveProduto: (product: Omit<Product, 'id'>, id?: string) => Promise<void>;
  onDeleteProduto: (id: string) => Promise<void>;
}

/**
 * ETAPA 5c: ProdutosTab - Tab Container for Produtos
 * Manages modal state and coordinates between table and modal
 */

export function ProdutosTab({
  products,
  loading,
  onSaveProduto,
  onDeleteProduto
}: ProdutosTabProps) {
  const [produtoModalOpen, setProdutoModalOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Product | null>(null);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduto(product);
    } else {
      setEditingProduto(null);
    }
    setProdutoModalOpen(true);
  };

  const handleCloseModal = () => {
    setProdutoModalOpen(false);
    setEditingProduto(null);
  };

  const handleSave = async (product: Omit<Product, 'id'>) => {
    await onSaveProduto(product, editingProduto?.id);
    handleCloseModal();
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-foreground">Produtos Recorrentes</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Novo Produto
        </button>
      </div>

      <ProdutosTable
        products={products}
        loading={loading}
        onEdit={handleOpenModal}
        onDelete={onDeleteProduto}
      />

      <ProdutoModal
        open={produtoModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        editingProduct={editingProduto}
      />
    </>
  );
}
