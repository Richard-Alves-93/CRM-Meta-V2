import { useMemo, useState, useEffect } from "react";
import { CrmDatabase, getLancamentosDoMes, getLancamentosMesAnterior, formatCurrency, getDiasMes, calcularVendasNecessarias, Lancamento, formatDate, getRemainingWorkingDays } from "@/lib/crm-data";
import { parseLocalDate } from "@/utils/date";
import KpiCard from "./KpiCard";
import MetaCard from "./MetaCard";
import RecomprasHoje from "../dashboard/RecomprasHoje";
import TelesDashboardWidget from "../dashboard/TelesDashboardWidget";
import { Meta } from "@/lib/crm-data";
import { DollarSign, TrendingDown, Activity, TrendingUp, MessageCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DashboardPageProps {
  db: CrmDatabase;
  onOpenLancamento: () => void;
  onEditMeta: (meta: Meta) => void;
  onDeleteMeta: (id: string) => void;
  onNavigateToRecompras: () => void;
}

const DashboardPage = ({ db, onOpenLancamento, onEditMeta, onDeleteMeta, onNavigateToRecompras }: DashboardPageProps) => {
  const [remainingWorkDays, setRemainingWorkDays] = useState(0);

  const lancamentosMes = useMemo(() => getLancamentosDoMes(db), [db]);

  // Get remaining work days on component mount/update
  useEffect(() => {
    const fetchRemainingDays = async () => {
      try {
        const days = await getRemainingWorkingDays();
        setRemainingWorkDays(days);
      } catch (error) {
        console.error('Error getting remaining work days:', error);
        setRemainingWorkDays(0);
      }
    };

    fetchRemainingDays();
  }, []);

  const totalLiquido = lancamentosMes.reduce((s, l) => s + l.valorLiquido, 0);
  const totalDesconto = lancamentosMes.reduce((s, l) => s + l.desconto, 0);

  // Cálculo de Médias para Tendência
  const hoje = new Date();
  const diaAtual = hoje.getDate() || 1;
  const mediaDiaria = totalLiquido / diaAtual;

  const trendMedia = useMemo(() => {
    const lancamentosAnterior = getLancamentosMesAnterior(db);
    const totalAnterior = lancamentosAnterior.reduce((s, l) => s + l.valorLiquido, 0);
    const diasMesAnterior = getDiasMes(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1));
    const mediaAnterior = totalAnterior / diasMesAnterior;

    if (mediaAnterior === 0) return 0;
    return ((mediaDiaria - mediaAnterior) / mediaAnterior) * 100;
  }, [db, mediaDiaria]);

  const projecao = mediaDiaria * getDiasMes();


  const ultimosLancamentos = useMemo(() =>
    [...db.lancamentos].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 5),
    [db]
  );

  const handleShareAllMetas = async () => {
    if (db.metas.length === 0) return;

    try {
      let text = `🎯 *Resumo Diário das Metas*\n\n`;

      // Get all calculations asynchronously
      const calculations = await Promise.all(
        db.metas.map(meta => calcularVendasNecessarias(meta, lancamentosMes))
      );

      db.metas.forEach((meta, index) => {
        const calc = calculations[index];
        text += `📌 *${meta.nome}*\n`;
        text += `💰 Objetivo: ${formatCurrency(meta.valor)}\n`;
        text += `✅ Vendido: ${formatCurrency(calc.totalVendido)} (${Math.round(calc.percentual)}%)\n`;
        text += `⏳ Faltam: ${formatCurrency(calc.vendasRestantes)}\n`;
        text += `📅 Necessário/dia: ${formatCurrency(calc.vendasNecessarias)}\n`;
        text += `📊 Dias de trabalho restantes: ${calc.diasRestantes}\n`;
        text += `${calc.metaBatida ? "🎉 Meta batida! 🚀" : "💪 Foco na meta!"}\n\n`;
      });

      const url = `https://wa.me/?text=${encodeURIComponent(text.trim())}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error sharing metas:', error);
      toast.error('Erro ao compartilhar metas');
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Acompanhe o desempenho de vendas em tempo real</p>
      </div>


      {db.metas.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center justify-between gap-4 flex-wrap">
            <span>
              Metas Ativas: <span className="font-normal text-primary lowercase">{remainingWorkDays} dias restantes este mês</span>
            </span>
            <Button
              onClick={handleShareAllMetas}
              size="sm"
              className="bg-[#25D366] text-white hover:bg-[#20bd5a] border-none font-bold gap-2 h-8 px-3 text-[10px]"
            >
              <MessageCircle size={14} />
              Compartilhar
            </Button>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {db.metas.map(meta => (
              <MetaCard key={meta.id} meta={meta} lancamentos={lancamentosMes} />
            ))}
          </div>
        </div>
      )}

      {totalDesconto > 0 && (
        <div className="grid grid-cols-1 gap-6 mb-8">
          <KpiCard label="Total Desconto" value={formatCurrency(totalDesconto)} icon={<TrendingDown size={18} />} />
        </div>
      )}


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <RecomprasHoje onNavigateToRecompras={onNavigateToRecompras} />
        </div>
        <div className="lg:col-span-2">
          <TelesDashboardWidget />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
