import { Edit2, Trash2, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Service } from "@/lib/types";
import { formatCurrency } from "@/lib/formatters";

interface ServicosTableProps {
  services: Service[];
  loading: boolean;
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
}

export function ServicosTable({ services, loading, onEdit, onDelete }: ServicosTableProps) {
  const activeServices = (services || []).filter(s => s.ativo !== false);

  if (loading && (!services || services.length === 0)) {
    return <div className="text-center py-8 text-muted-foreground animate-pulse">Carregando serviços...</div>;
  }

  if (activeServices.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-secondary/10">
        <p className="text-muted-foreground">Nenhum serviço cadastrado.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-background shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left text-xs font-bold text-muted-foreground py-3 px-4 uppercase tracking-wider">Serviço</th>
              <th className="text-left text-xs font-bold text-muted-foreground py-3 px-4 uppercase tracking-wider">Preço</th>
              <th className="text-left text-xs font-bold text-muted-foreground py-3 px-4 uppercase tracking-wider">Duração</th>
              <th className="text-left text-xs font-bold text-muted-foreground py-3 px-4 uppercase tracking-wider">Categoria</th>
              <th className="text-center text-xs font-bold text-muted-foreground py-3 px-4 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody>
            {activeServices.map((s) => (
              <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors group">
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-foreground">{s.nome}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {s.requires_professional && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded font-bold uppercase">
                          <ShieldCheck size={10} /> Requer Profissional
                        </span>
                      )}
                      {s.requires_pet && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase">
                          Pet
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono font-bold text-sm text-primary">
                  {formatCurrency(s.preco)}
                </td>
                <td className="py-3 px-4">
                   <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                     <Clock size={12} />
                     {s.duration_minutes || 0} min
                   </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full border border-border">
                    {s.categoria || "Geral"}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(s)}
                      className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      title="Editar serviço"
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(s.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Deletar serviço"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
