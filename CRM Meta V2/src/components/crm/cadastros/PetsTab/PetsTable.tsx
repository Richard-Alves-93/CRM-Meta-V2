import { Edit2, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pet, Customer } from "@/lib/types";
import { useNavigate } from "react-router-dom";

interface PetsTableProps {
  pets: Pet[];
  customers: Customer[];
  loading: boolean;
  onEdit: (pet: Pet) => void;
  onDelete: (id: string) => void;
  onAttend?: (pet: Pet) => void;
}

/**
 * ETAPA 5c: PetsTable - Pure Presentation Component
 * Renders pets table with edit/delete actions
 * No state, no side effects
 */

export function PetsTable({ pets, customers, loading, onEdit, onDelete, onAttend }: PetsTableProps) {
  const navigate = useNavigate();
  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.nome || "Desconhecido";
  
  const handleAttend = (pet: Pet) => {
    if (onAttend) {
      onAttend(pet);
    } else {
      navigate(`/pdv?customerId=${pet.customer_id}&petId=${pet.id}`);
    }
  };

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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleAttend(p)}
                    className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 mr-1"
                    title="Novo Atendimento"
                  >
                    <ShoppingCart size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(p)}
                    className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 mr-1"
                    title="Editar pet"
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(p.id)}
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Deletar pet"
                  >
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
