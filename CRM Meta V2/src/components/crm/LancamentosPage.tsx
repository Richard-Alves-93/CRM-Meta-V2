import { useState, useMemo } from "react";
import { CrmDatabase, formatCurrency, formatDate, Lancamento } from "@/lib/crm-data";
import { parseLocalDate, formatISODate } from "@/utils/date";
import { useCurrencyInput } from "@/hooks/useCurrencyInput";
import KpiCard from "./KpiCard";
import { Pencil, Trash2, DollarSign, TrendingDown, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LancamentosPageProps {
  db: CrmDatabase;
  onAdd: (data: string, bruto: number, desconto: number) => void;
  onEdit: (lancamento: Lancamento) => void;
  onDelete: (id: string) => void;
  onOpenModal: () => void;
}

const LancamentosPage = ({ db, onAdd, onEdit, onDelete, onOpenModal }: LancamentosPageProps) => {
  const [filterMonth, setFilterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [data, setData] = useState(() => formatISODate(new Date()));
  const bruto = useCurrencyInput(0);
  const desconto = useCurrencyInput(0);

  const filtered = useMemo(() => {
    if (!db?.lancamentos) return [];
    let list = db.lancamentos;
    if (filterMonth) {
      try {
        const [y, m] = filterMonth.split("-");
        list = list.filter(l => {
          if (!l.data) return false;
          const d = parseLocalDate(l.data);
          return d.getFullYear() === parseInt(y) && d.getMonth() + 1 === parseInt(m);
        });
      } catch (e) {
        console.error("Erro ao filtrar lançamentos:", e);
      }
    }
    return [...list].sort((a, b) => {
      const dateA = a.data ? new Date(a.data).getTime() : 0;
      const dateB = b.data ? new Date(b.data).getTime() : 0;
      return dateB - dateA;
    });
  }, [db, filterMonth]);

  const totalBruto = filtered.reduce((s, l) => s + (Number(l.valorBruto) || 0), 0);
  const totalDesconto = filtered.reduce((s, l) => s + (Number(l.desconto) || 0), 0);
  const totalLiquido = filtered.reduce((s, l) => s + (Number(l.valorLiquido) || 0), 0);

  const handleSave = () => {
    const v = bruto.rawValue;
    if (!data || !v || v <= 0) return;
    onAdd(data, v, desconto.rawValue);
    setData(formatISODate(new Date()));
    bruto.setValue(0);
    desconto.setValue(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Lançamentos</h1>
        <p className="text-muted-foreground text-sm">Registre o faturamento diário. Um lançamento por dia atualiza todas as metas.</p>
      </div>

      <div className="flex gap-3 mb-8 flex-wrap">
        <Button onClick={onOpenModal} className="rounded-lg font-medium transition-all px-6">
          + Lançar venda do dia
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 mb-6 flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Filtrar por mês:</span>
        <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
          className="px-3 py-2 border border-input rounded-lg text-sm bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-6">
        <h3 className="font-semibold text-card-foreground mb-4">Lançar venda do dia</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">Data</label>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)}
              className="w-full px-3 py-2.5 border border-input rounded-lg text-sm bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">Valor Bruto (R$)</label>
            <input
              type="text"
              inputMode="numeric"
              value={bruto.displayValue}
              onChange={bruto.handleChange}
              placeholder="R$ 0,00"
              className="w-full px-3 py-2.5 border border-input rounded-lg text-sm bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">Desconto (R$)</label>
            <input
              type="text"
              inputMode="numeric"
              value={desconto.displayValue}
              onChange={desconto.handleChange}
              placeholder="R$ 0,00"
              className="w-full px-3 py-2.5 border border-input rounded-lg text-sm bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="bg-success/10 border border-success/30 text-success rounded-lg p-3 text-sm mb-4">
          ✓ Ao salvar, todas as metas serão atualizadas automaticamente.
        </div>
        <div className="flex gap-3">
          <button onClick={handleSave} className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            Salvar lançamento
          </button>
          <button onClick={() => { bruto.setValue(0); desconto.setValue(0); }} className="px-4 py-2.5 rounded-lg bg-card border border-border text-muted-foreground text-sm font-medium hover:bg-secondary transition-colors">
            Limpar
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${totalDesconto > 0 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-6 mb-6`}>
        <KpiCard label="Total Bruto" value={formatCurrency(totalBruto)} icon={<DollarSign size={18} />} />
        {totalDesconto > 0 && (
          <KpiCard label="Total Desconto" value={formatCurrency(totalDesconto)} icon={<TrendingDown size={18} />} />
        )}
        <KpiCard label="Total Líquido" value={formatCurrency(totalLiquido)} icon={<Wallet size={18} />} />
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-card-foreground mb-4">Lançamentos</h3>
        <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 pb-4">
          <div className="min-w-[700px]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4 w-1/5">Data</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4 w-1/5">Valor Bruto</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4 w-1/5">Desconto</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4 w-1/5">Valor Líquido</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4 w-1/5">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">Nenhum lançamento registrado</td></tr>
                ) : filtered.map(l => (
                  <tr key={l.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="py-3 px-4 text-sm">{l.data ? formatDate(l.data) : "-"}</td>
                    <td className="py-3 px-4 text-sm">{formatCurrency(l.valorBruto)}</td>
                    <td className="py-3 px-4 text-sm text-warning">{formatCurrency(l.desconto)}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-success">{formatCurrency(l.valorLiquido)}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button onClick={() => onEdit(l)} className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:bg-border transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => onDelete(l.id)} className="p-1.5 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LancamentosPage;
