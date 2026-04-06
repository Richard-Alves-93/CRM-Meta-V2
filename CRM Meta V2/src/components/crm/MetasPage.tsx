import { CrmDatabase, getLancamentosDoMes, formatCurrency, getDiasMes, calcularVendasNecessarias, Meta, Lancamento } from "@/lib/crm-data";
import KpiCard from "./KpiCard";
import MetaCard from "./MetaCard";
import { useMemo, useState, useEffect, useCallback } from "react";
import { DollarSign, Activity, TrendingUp, MessageCircle } from "lucide-react";

interface MetasPageProps {
  db: CrmDatabase;
  onAdd: () => void;
  onEdit: (meta: Meta) => void;
  onDelete: (id: string) => void;
}

const MetasPage = ({ db, onAdd, onEdit, onDelete }: MetasPageProps) => {
  const lancamentosMes = useMemo(() => getLancamentosDoMes(db), [db]);
  const totalLiquido = lancamentosMes.reduce((s, l) => s + l.valorLiquido, 0);
  const mediaDiaria = lancamentosMes.length > 0 ? totalLiquido / lancamentosMes.length : 0;
  const projecao = mediaDiaria * getDiasMes();

  const handleShareAllMetas = useCallback(async () => {
    if (db.metas.length === 0) return;
    
    let text = `🎯 *Resumo Diário das Metas*\n\n`;
    
    for (const meta of db.metas) {
      const calc = await calcularVendasNecessarias(meta, lancamentosMes);
      text += `📌 *${meta.nome}*\n`;
      text += `💰 Objetivo: ${formatCurrency(meta.valor)}\n`;
      text += `✅ Vendido: ${formatCurrency(calc.totalVendido)} (${Math.round(calc.percentual)}%)\n`;
      text += `⏳ Faltam: ${formatCurrency(calc.vendasRestantes)}\n`;
      text += `📅 Necessário/dia: ${formatCurrency(calc.vendasNecessarias)}\n`;
      text += `${calc.metaBatida ? "🎉 Meta batida! 🚀" : "💪 Foco na meta!"}\n\n`;
    }

    const url = `https://wa.me/?text=${encodeURIComponent(text.trim())}`;
    window.open(url, '_blank');
  }, [db.metas, lancamentosMes]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-1">Metas</h1>
        <p className="text-muted-foreground text-sm">Crie, edite e remova metas para acompanhar quanto precisa vender por dia.</p>
        <div className="flex gap-3 mt-4 flex-wrap">
          <button onClick={onAdd} className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            + Nova Meta
          </button>
          {db.metas.length > 0 && (
            <button 
              onClick={handleShareAllMetas}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#25D366] text-white text-sm font-medium hover:bg-[#20bd5a] transition-colors"
            >
              <MessageCircle size={18} />
              Compartilhar Metas
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <KpiCard label="Total Líquido do Mês" value={formatCurrency(totalLiquido)} icon={<DollarSign size={18} />} />
        <KpiCard label="Média Diária Atual" value={formatCurrency(mediaDiaria)} icon={<Activity size={18} />} />
        <KpiCard label="Projeção Final do Mês" value={formatCurrency(projecao)} icon={<TrendingUp size={18} />} />
      </div>

      {db.metas.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          Nenhuma meta criada. Clique em "+ Nova Meta" para começar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {db.metas.map(meta => (
            <MetaCard key={meta.id} meta={meta} lancamentos={lancamentosMes} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MetasPage;
