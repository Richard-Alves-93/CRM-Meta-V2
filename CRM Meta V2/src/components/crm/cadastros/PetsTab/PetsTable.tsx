import { Pet, Customer } from "@/lib/crm-data";
import { Edit2, Trash2 } from "lucide-react";

interface PetsTableProps {
  pets: Pet[];
  customers: Customer[];
  loading: boolean;
  onEdit: (pet: Pet) => void;
  onDelete: (id: string) => void;
}

/**
 * ETAPA 5c: PetsTable - Pure Presentation Component
 * Renders pets table with edit/delete actions
 * No state, no side effects
 */

export function PetsTable({ pets, customers, loading, onEdit, onDelete }: PetsTableProps) {
  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.nome || "Desconhecido";
  const activePets = pets.filter(p => p.ativo !== false);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">Nome do Pet</th>
            <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">Tutor</th>
            <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4 hidden sm:table-cell">Espécie/Raça</th>
            <th className="text-center text-xs font-semibold text-muted-foreground py-3 px-4">Ações</th>
          </tr>
        </thead>
        <tbody>
          {activePets.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                {loading ? "Carregando..." : "Nenhum pet cadastrado"}
              </td>
            </tr>
          ) : (
            activePets.map(p => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                <td className="py-3 px-4 text-sm font-medium">{p.nome}</td>
                <td className="py-3 px-4 text-sm">{getCustomerName(p.customer_id)}</td>
                <td className="py-3 px-4 text-sm hidden sm:table-cell">{p.especie}{p.raca ? ` - ${p.raca}` : ''}</td>
                <td className="py-3 px-4 text-sm text-center">
                  <button
                    onClick={() => onEdit(p)}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors mr-2"
                    title="Editar pet"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(p.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    title="Deletar pet"
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
