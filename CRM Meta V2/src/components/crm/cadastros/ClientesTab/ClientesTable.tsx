import { Edit2, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Customer } from "@/lib/types";

interface ClientesTableProps {
  customers: Customer[];
  loading: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onAttend: (customer: Customer) => void;
}

/**
 * ETAPA 5b: ClientesTable - Pure Presentation Component
 * Renders customers table with edit/delete actions
 * No state, no side effects - completely reusable
 */

export function ClientesTable({ customers, loading, onEdit, onDelete, onAttend }: ClientesTableProps) {
  const activeCustomers = customers.filter(c => c.ativo !== false);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">Nome</th>
            <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">WhatsApp</th>
            <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4 hidden md:table-cell">Email</th>
            <th className="text-center text-xs font-semibold text-muted-foreground py-3 px-4">Ações</th>
          </tr>
        </thead>
        <tbody>
          {activeCustomers.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                {loading ? "Carregando..." : "Nenhum tutor cadastrado"}
              </td>
            </tr>
          ) : (
            activeCustomers.map(c => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                <td className="py-3 px-4 text-sm font-medium">{c.nome}</td>
                <td className="py-3 px-4 text-sm">{c.whatsapp || c.telefone || '-'}</td>
                <td className="py-3 px-4 text-sm hidden md:table-cell">{c.email || '-'}</td>
                <td className="py-3 px-4 text-sm text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onAttend(c)}
                    className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 mr-1"
                    title="Atendimento / Ver Pets"
                  >
                    <ShoppingCart size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(c)}
                    className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 mr-1"
                    title="Editar tutor"
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(c.id)}
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Deletar tutor"
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
