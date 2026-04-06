import { useState, useMemo } from "react";
import { CrmDatabase, formatCurrency, formatDate, getDiasMes } from "@/lib/crm-data";
import { parseLocalDate } from "@/utils/date";
import KpiCard from "./KpiCard";
import { DollarSign, TrendingDown, Activity, TrendingUp, Calendar, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, Legend, Area, AreaChart } from "recharts";

interface RelatoriosPageProps {
  db: CrmDatabase;
  onExportExcel: () => void;
}

type ViewMode = 'month' | 'year';

const RelatoriosPage = ({ db, onExportExcel }: RelatoriosPageProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [filterMonth, setFilterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [filterYear, setFilterYear] = useState(() => new Date().getFullYear().toString());

  const lancamentos = useMemo(() => {
    return db.lancamentos.filter(l => {
      const d = parseLocalDate(l.data);
      if (viewMode === 'month') {
        const [y, m] = filterMonth.split("-");
        return d.getFullYear() === parseInt(y) && d.getMonth() + 1 === parseInt(m);
      } else {
        return d.getFullYear() === parseInt(filterYear);
      }
    });
  }, [db.lancamentos, viewMode, filterMonth, filterYear]);

  const totalLiquido = lancamentos.reduce((s, l) => s + l.valorLiquido, 0);
  const totalDesconto = lancamentos.reduce((s, l) => s + l.desconto, 0);
  
  // Projeção baseada na média diária (só para o mês atual)
  const mediaDiaria = lancamentos.length > 0 ? totalLiquido / lancamentos.length : 0;
  // Se for visão anual, podemos projetar vezes 12 caso queiramos.
  const numDias = viewMode === 'month' ? getDiasMes() : 365;
  const projecao = mediaDiaria * numDias;

  const vendasPorDia = useMemo(() => {
    if (viewMode !== 'month') return [];
    
    const [y, m] = filterMonth.split("-");
    const diasNoMes = new Date(parseInt(y), parseInt(m), 0).getDate();
    
    return Array.from({ length: diasNoMes }, (_, i) => {
      const dia = i + 1;
      const valor = lancamentos
        .filter(l => parseLocalDate(l.data).getDate() === dia)
        .reduce((s, l) => s + l.valorLiquido, 0);
      return { dia, valor };
    });
  }, [lancamentos, viewMode, filterMonth]);

  const vendasPorMes = useMemo(() => {
    if (viewMode !== 'year') return [];
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const metaPrincipal = db.metas[0]?.valor || 0;

    return meses.map((nome, i) => {
      const valor = lancamentos
        .filter(l => parseLocalDate(l.data).getMonth() === i)
        .reduce((s, l) => s + l.valorLiquido, 0);
      return { mes: nome, Vendas: valor, Meta: metaPrincipal };
    });
  }, [lancamentos, viewMode, db.metas]);

  const topLancamentos = useMemo(() =>
    [...lancamentos].sort((a, b) => b.valorLiquido - a.valorLiquido).slice(0, 5),
    [lancamentos]
  );

  const topMesesAnual = useMemo(() => {
    if (viewMode !== 'year') return [];
    return [...vendasPorMes]
      .filter(m => m.Vendas > 0)
      .sort((a, b) => b.Vendas - a.Vendas)
      .slice(0, 5);
  }, [vendasPorMes, viewMode]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-1">Relatórios de Desempenho</h1>
        <p className="text-muted-foreground text-sm">Visão analítica das suas vendas e progresso de metas.</p>
        
        <div className="mt-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="flex bg-secondary p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === 'month' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Visão Mensal
            </button>
            <button 
              onClick={() => setViewMode('year')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === 'year' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Visão Anual
            </button>
          </div>

          <div className="flex gap-3">
            {viewMode === 'month' ? (
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-muted-foreground" />
                <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
                  className="px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-muted-foreground" />
                <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
                  className="px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}
            <button onClick={onExportExcel} className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
              📥 Exportar Excel
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard label="Total Faturado" value={formatCurrency(totalLiquido)} icon={<DollarSign size={18} />} />
        <KpiCard label="Descontos Concedidos" value={formatCurrency(totalDesconto)} icon={<TrendingDown size={18} />} />
        <KpiCard label={viewMode === 'month' ? "Média Diária" : "Média de Faturamento"} value={formatCurrency(viewMode === 'month' ? mediaDiaria : mediaDiaria * 30)} icon={<Activity size={18} />} />
        <KpiCard label="Projeção do Período" value={formatCurrency(projecao)} icon={<TrendingUp size={18} />} />
      </div>

      {db.metas.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Target size={20} className="text-primary" />
            <h3 className="font-semibold text-card-foreground">Desempenho de Metas ({viewMode === 'month' ? 'Mensal' : 'Anual'})</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {db.metas.map(meta => {
               // Extrapola a meta x12 no ano a menos que ela seja uma meta descritiva já "anual"
               const isAnual = meta.anual || meta.nome.toLowerCase().includes('ano') || meta.nome.toLowerCase().includes('anual');
               const targetValor = viewMode === 'year' && !isAnual ? meta.valor * 12 : 
                                   viewMode === 'month' && isAnual ? meta.valor / 12 : meta.valor;

               const pct = targetValor > 0 ? Math.min((totalLiquido / targetValor) * 100, 100) : 0;
               const attained = totalLiquido >= targetValor;
               
               return (
                 <div key={meta.id} className="space-y-3">
                   <div className="flex flex-col gap-1">
                     <div className="flex justify-between items-end">
                       <span className="font-semibold text-foreground">{meta.nome}</span>
                       <span className="text-sm font-medium whitespace-nowrap">
                         <span className={attained ? 'text-success' : 'text-primary'}>{formatCurrency(totalLiquido)}</span>
                         <span className="text-muted-foreground"> / {formatCurrency(targetValor)}</span>
                       </span>
                     </div>
                     <p className="text-xs text-muted-foreground text-right">{pct.toFixed(1)}% concluído do {viewMode === 'month' ? 'mês' : 'ano'}</p>
                   </div>
                   
                   <div className="h-3 w-full bg-secondary rounded-full overflow-hidden shadow-inner">
                     <div className={`h-full transition-all duration-1000 ease-out ${attained ? 'bg-success' : 'bg-primary'}`} style={{ width: `${pct}%` }}></div>
                   </div>
                 </div>
               );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-card-foreground mb-4">
            {viewMode === 'month' ? 'Evolução Diária de Vendas' : 'Evolução Mensal vs Meta Principal'}
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'month' ? (
                <AreaChart data={vendasPorDia}>
                  <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="dia" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${v/1000}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={(l) => `Dia ${l}`} />
                  <Area type="monotone" dataKey="valor" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorValor)" strokeWidth={2} />
                </AreaChart>
              ) : (
                <ComposedChart data={vendasPorMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${v/1000}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="Vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  {db.metas.length > 0 && <Line type="stepAfter" dataKey="Meta" stroke="hsl(var(--success))" strokeWidth={2} strokeDasharray="5 5" dot={false} />}
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="font-semibold text-card-foreground mb-4">
            {viewMode === 'month' ? 'Top Vendas do Mês' : 'Melhores Meses'}
          </h3>
          {viewMode === 'month' ? (
            topLancamentos.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Nenhum dado no período</div>
            ) : (
              <div className="space-y-3">
                {topLancamentos.map((l, idx) => (
                  <div key={l.id} className="flex items-center gap-4 bg-secondary/40 rounded-xl p-4 hover:bg-secondary/60 transition-all border border-transparent hover:border-border/50 group">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-base font-bold shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Lançamento</p>
                      <p className="text-xs font-semibold text-card-foreground">{formatDate(l.data)}</p>
                      <p className="text-sm font-bold text-success mt-1">{formatCurrency(l.valorLiquido)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            topMesesAnual.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Nenhum dado no ano</div>
            ) : (
              <div className="space-y-3">
                {topMesesAnual.map((m, idx) => (
                  <div key={m.mes} className="flex items-center gap-4 bg-secondary/40 rounded-xl p-4 hover:bg-secondary/60 transition-all border border-transparent hover:border-border/50 group">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-base font-bold shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Mês de Referência</p>
                      <p className="text-[13px] font-medium text-card-foreground uppercase tracking-tight">{m.mes}</p>
                      <p className="text-base font-bold text-success mt-1">{formatCurrency(m.Vendas)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default RelatoriosPage;
