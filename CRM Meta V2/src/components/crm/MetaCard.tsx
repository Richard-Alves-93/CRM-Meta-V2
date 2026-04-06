import { useState, useEffect } from 'react';
import { Meta, Lancamento, calcularVendasNecessarias, formatCurrency } from "@/lib/crm-data";
import { Pencil, Trash2 } from "lucide-react";

interface MetaCardProps {
  meta: Meta;
  lancamentos: Lancamento[];
  onEdit?: (meta: Meta) => void;
  onDelete?: (id: string) => void;
}

interface CalcResult {
  totalVendido: number;
  vendasRestantes: number;
  diasRestantes: number;
  vendasNecessarias: number;
  percentual: number;
  metaBatida: boolean;
}

const MetaCard = ({ meta, lancamentos, onEdit, onDelete }: MetaCardProps) => {
  const [calc, setCalc] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculate = async () => {
      try {
        setLoading(true);
        // Call with useWorkingDays = true by default
        const result = await calcularVendasNecessarias(meta, lancamentos, true);
        setCalc(result);
      } catch (error) {
        console.error('Error calculating sales:', error);
        // Fallback to synchronous calculation if RLS or other error
        try {
          const result = await calcularVendasNecessarias(meta, lancamentos, false);
          setCalc(result);
        } catch (fallbackError) {
          console.error('Fallback calculation also failed:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    calculate();
  }, [meta, lancamentos]);

  if (!calc || loading) {
    return (
      <div className={`bg-card border rounded-xl p-6 shadow-sm animate-pulse`}>
        <div className="h-4 bg-secondary rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-secondary rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-secondary rounded w-full"></div>
          <div className="h-4 bg-secondary rounded w-full"></div>
          <div className="h-4 bg-secondary rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card border rounded-xl p-6 shadow-sm transition-all relative group ${calc.metaBatida ? "border-success/40 bg-success/5" : "border-border"}`}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-card-foreground pr-8">{meta.nome}</h3>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${calc.metaBatida ? "bg-success/15 text-success" : "bg-accent text-accent-foreground"}`}>
            {calc.metaBatida ? "Meta batida ✓" : "Ativa"}
          </span>
        </div>
      </div>

      <div className="text-xl font-bold text-primary mb-4">{formatCurrency(meta.valor)}</div>

      <div className="space-y-2 pb-4 mb-4 border-b border-border text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Vendido:</span>
          <span className="font-semibold text-success">{formatCurrency(calc.totalVendido)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Faltam:</span>
          <span className="font-semibold text-card-foreground">{formatCurrency(calc.vendasRestantes)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Necessário/dia de trabalho:</span>
          <span className="font-semibold text-primary">{formatCurrency(calc.vendasNecessarias)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Dias de trabalho restantes:</span>
          <span className="font-semibold text-primary">{calc.diasRestantes}</span>
        </div>
      </div>

      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${calc.metaBatida ? "bg-success" : "bg-primary"}`}
          style={{ width: `${calc.percentual}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{Math.round(calc.percentual)}% da meta</span>

      {(onEdit || onDelete) && (
        <div className="flex gap-2 mt-4">
          {onEdit && (
            <button onClick={() => onEdit(meta)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-secondary text-muted-foreground hover:bg-border transition-colors">
              <Pencil size={14} /> Editar
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(meta.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
              <Trash2 size={14} /> Remover
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MetaCard;
