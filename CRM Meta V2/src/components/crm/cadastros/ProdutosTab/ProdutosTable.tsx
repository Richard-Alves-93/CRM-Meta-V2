import { Product } from "@/lib/crm-data";
import { Edit2, Trash2 } from "lucide-react";

interface ProdutosTableProps {
  products: Product[];
  loading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

/**
 * ETAPA 5c: ProdutosTable - Pure Presentation Component
 * Renders products table with edit/delete actions
 * No state, no side effects
 */

export function ProdutosTable({ products, loading, onEdit, onDelete }: ProdutosTableProps) {
  const activeProducts = products.filter(p => p.ativo !== false);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">Produto</th>
            <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">Categoria</th>
            <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">Prazo Padrão</th>
            <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4 hidden md:table-cell">Aviso (Dias)</th>
            <th className="text-center text-xs font-semibold text-muted-foreground py-3 px-4">Ações</th>
          </tr>
        </thead>
        <tbody>
          {activeProducts.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                {loading ? "Carregando..." : "Nenhum produto cadastrado"}
              </td>
            </tr>
          ) : (
            activeProducts.map(p => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                <td className="py-3 px-4 text-sm font-medium">{p.nome}</td>
                <td className="py-3 px-4 text-sm">
                  <span className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                    {p.categoria || 'Geral'}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm">{p.prazo_recompra_dias} dias</td>
                <td className="py-3 px-4 text-sm hidden md:table-cell">{p.dias_aviso_previo} dias antes</td>
                <td className="py-3 px-4 text-sm text-center">
                  <button
                    onClick={() => onEdit(p)}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors mr-2"
                    title="Editar produto"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(p.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    title="Deletar produto"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
