import { Customer } from "@/lib/crm-data";
import { Edit2, Trash2 } from "lucide-react";

interface ClientesTableProps {
  customers: Customer[];
  loading: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

/**
 * ETAPA 5b: ClientesTable - Pure Presentation Component
 * Renders customers table with edit/delete actions
 * No state, no side effects - completely reusable
 */

export function ClientesTable({ customers, loading, onEdit, onDelete }: ClientesTableProps) {
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
                  <button
                    onClick={() => onEdit(c)}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors mr-2"
                    title="Editar tutor"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(c.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    title="Deletar tutor"
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
