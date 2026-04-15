import React, { useState, useEffect } from 'react';
import { transporteService } from '@/services/transporteService';
import { Transporte } from '@/lib/types';
import { parseLocalDate } from '@/utils/date';
import { Truck, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function TelesDashboardWidget() {
  const [telesHoje, setTelesHoje] = useState<Transporte[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeles = async () => {
      try {
        setLoading(true);
        // Busca transportes e filtra apenas os de hoje (mesmo dia, mês e ano)
        const allTransportes = await transporteService.fetchTransportes();
        
        const hojeObj = new Date();
        const hojeYMD = `${hojeObj.getFullYear()}-${hojeObj.getMonth()}-${hojeObj.getDate()}`;
        
        const deHoje = allTransportes.filter(t => {
          const tDate = new Date(t.data_hora);
          const tYMD = `${tDate.getFullYear()}-${tDate.getMonth()}-${tDate.getDate()}`;
          return tYMD === hojeYMD;
        });

        setTelesHoje(deHoje);
      } catch (error) {
        console.error("Erro ao buscar teles para o dashboard: ", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeles();
    
    // Configura atualização automática a cada 3 minutos no dashboard
    const interval = setInterval(fetchTeles, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const total = telesHoje.length;
  const concluidas = telesHoje.filter(t => t.status === 'CONCLUIDO').length;
  const pendentes = telesHoje.filter(t => t.status === 'AGUARDANDO' || t.status === 'EM_ROTA').length;
  
  const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-card-foreground text-lg flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Logística Diária
          </h3>
          <p className="text-sm text-muted-foreground">Acompanhamento das Teles do dia</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/agendamentos')} className="text-xs gap-1 hidden sm:flex">
          Abrir Agenda <ChevronRight className="w-3 h-3" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8 text-muted-foreground animate-pulse">
          Caregando teles do dia...
        </div>
      ) : total === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border rounded-lg">
          <div className="bg-primary/10 p-3 rounded-full mb-3">
            <Truck className="w-6 h-6 text-primary" />
          </div>
          <p className="font-medium">Nenhuma Tele para Hoje</p>
          <p className="text-sm text-muted-foreground max-w-xs mt-1">
            Parece que todos os pets foram entregues ou não há viagens programadas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
          {/* Card Agendadas */}
          <div className="bg-secondary/30 rounded-lg p-4 border border-border/50 flex flex-col">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Truck className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Agendadas</span>
            </div>
            <div className="text-3xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground mt-1">Viagens programadas</div>
          </div>

          {/* Card Pendentes */}
          <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4 border border-orange-100 dark:border-orange-900/30 flex flex-col">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Pendentes</span>
            </div>
            <div className="text-3xl font-bold text-orange-700 dark:text-orange-500">{pendentes}</div>
            <div className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-1">Na fila ou a caminho</div>
          </div>

          {/* Card Concluídas */}
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-100 dark:border-green-900/30 flex flex-col">
             <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Concluídas</span>
            </div>
            <div className="text-3xl font-bold text-green-700 dark:text-green-500">{concluidas}</div>
            <div className="mt-2 w-full bg-green-200 dark:bg-green-900 overflow-hidden rounded-full h-1.5">
              <div 
                className="bg-green-500 h-1.5 rounded-full" 
                style={{ width: `${progresso}%` }}
              ></div>
            </div>
            <div className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">{progresso}% Entregues com sucesso</div>
          </div>
        </div>
      )}

      <Button variant="outline" size="sm" onClick={() => navigate('/agendamentos')} className="mt-4 w-full sm:hidden text-xs gap-1">
        Abrir Agenda
      </Button>
    </div>
  );
}
