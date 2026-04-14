import React, { useEffect, useState, useCallback } from 'react';
import { transporteService } from '@/services/transporteService';
import { Transporte, TransporteStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  LogOut, MapPin, MessageCircle, Clock, Truck,
  CheckCircle, RefreshCcw, AlertCircle, Package, Navigation
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const statusColors: Record<TransporteStatus, string> = {
  AGUARDANDO:  'bg-amber-100 text-amber-800 border-amber-200',
  A_CAMINHO:   'bg-blue-100 text-blue-800 border-blue-200',
  CONCLUIDO:   'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELADO:   'bg-red-100 text-red-800 border-red-200',
  REAGENDADO:  'bg-orange-100 text-orange-800 border-orange-200',
};

const statusLabels: Record<TransporteStatus, string> = {
  AGUARDANDO:  '⏳ Aguardando',
  A_CAMINHO:   '🚗 A Caminho',
  CONCLUIDO:   '✅ Concluído',
  CANCELADO:   '❌ Cancelado',
  REAGENDADO:  '🔄 Reagendado',
};

const getSaudacao = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

const isHoje = (dataHora: string) => {
  const d = new Date(dataHora);
  const hoje = new Date();
  return d.toDateString() === hoje.toDateString();
};

const isUrgente = (dataHora: string) => {
  const diff = new Date(dataHora).getTime() - Date.now();
  return diff > 0 && diff < 60 * 60 * 1000; // menos de 1h
};

const formatHora = (dataHora: string) =>
  new Date(dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const formatDataHora = (dataHora: string) => {
  const d = new Date(dataHora);
  if (isHoje(dataHora)) return `Hoje às ${formatHora(dataHora)}`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ' às ' + formatHora(dataHora);
};

// ─── Componente Principal ───────────────────────────────────────────────────

export default function DriverDashboard() {
  const [transportes, setTransportes] = useState<Transporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState<string | null>(null);
  const { signOut, user } = useAuth();

  const primeiroNome = (user?.user_metadata?.full_name || user?.email || 'Motorista')
    .split(' ')[0];

  // ── Carga de dados ──────────────────────────────────────────────────────

  const carregarTransportes = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const data = await transporteService.fetchMeusTransportes();
      setTransportes(data);
    } catch (err: any) {
      toast.error('Erro ao buscar corridas: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Realtime Subscription ─────────────────────────────────────────────

  useEffect(() => {
    carregarTransportes();

    const channel = supabase
      .channel('driver-transportes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transportes',
      }, () => {
        carregarTransportes(true);
      })
      .subscribe();

    // Refetch ao voltar para a aba
    const onFocus = () => carregarTransportes(true);
    window.addEventListener('focus', onFocus);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', onFocus);
    };
  }, [carregarTransportes]);

  // ── Ações ──────────────────────────────────────────────────────────────

  const handleStatusChange = async (id: string, novoStatus: TransporteStatus) => {
    setAtualizando(id);
    try {
      await transporteService.updateStatus(id, novoStatus);
      toast.success('Status atualizado!');
      await carregarTransportes(true);
    } catch (err: any) {
      toast.error('Erro ao atualizar: ' + err.message);
    } finally {
      setAtualizando(null);
    }
  };

  const openWaze = (endereco: string | null) => {
    if (!endereco) return toast.error('Endereço não informado.');
    window.open(`https://waze.com/ul?q=${encodeURIComponent(endereco)}`, '_blank');
  };

  const openWhatsApp = (numero: string | null, petNome: string) => {
    if (!numero) return toast.error('Telefone não informado.');
    const limpo = numero.replace(/\D/g, '');
    const msg = encodeURIComponent(`Olá! Sou o motorista do CRM Dominus e estou a caminho para buscar ${petNome}. 🐾`);
    window.open(`https://wa.me/55${limpo}?text=${msg}`, '_blank');
  };

  // ── Derivados ──────────────────────────────────────────────────────────

  const ativas    = transportes.filter(t => ['AGUARDANDO', 'A_CAMINHO'].includes(t.status));
  const conclHoje = transportes.filter(t => t.status === 'CONCLUIDO' && isHoje(t.data_hora));
  const proxima   = ativas[0];
  const restantes = ativas.slice(1);
  const futuras   = transportes.filter(t => !['AGUARDANDO', 'A_CAMINHO'].includes(t.status) && !isHoje(t.data_hora));

  // ── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-white">
        <Truck className="w-12 h-12 animate-bounce text-blue-400" />
        <p className="text-slate-400 text-sm">Carregando suas corridas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* ── Header ─────────────────────────────────── */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 px-4 py-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              <span className="font-bold text-base">Painel do Motorista</span>
            </div>
            <p className="text-blue-200 text-xs mt-0.5">{getSaudacao()}, {primeiroNome}! 👋</p>
          </div>
          <div className="flex items-center gap-1">
            {/* Contadores */}
            <div className="hidden sm:flex gap-3 mr-3 text-xs text-blue-200">
              <span>🕐 {ativas.length} pendente{ativas.length !== 1 ? 's' : ''}</span>
              <span>✅ {conclHoje.length} hoje</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => carregarTransportes()} className="text-white hover:bg-white/10 h-8 w-8">
              <RefreshCcw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} className="text-white hover:bg-white/10 h-8 w-8">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {/* Contadores mobile */}
        <div className="flex sm:hidden gap-4 mt-2 text-xs text-blue-200">
          <span>🕐 {ativas.length} pendente{ativas.length !== 1 ? 's' : ''}</span>
          <span>✅ {conclHoje.length} concluída{conclHoje.length !== 1 ? 's' : ''} hoje</span>
        </div>
      </header>

      {/* ── Conteúdo ───────────────────────────────── */}
      <main className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full space-y-6">

        {/* ── PRÓXIMA VIAGEM ─────────────────────── */}
        <section>
          <h2 className="text-slate-400 uppercase text-[10px] font-bold mb-3 tracking-widest">
            Próxima Corrida
          </h2>

          {proxima ? (
            <div className={`rounded-2xl border overflow-hidden shadow-xl ${isUrgente(proxima.data_hora) ? 'border-amber-400 animate-pulse' : 'border-slate-700'} bg-slate-900`}>
              {/* Topo colorido por tipo */}
              <div className={`h-1.5 w-full ${proxima.tipo === 'BUSCA' ? 'bg-blue-500' : 'bg-orange-500'}`} />

              <div className="p-4 space-y-4">
                {/* Cabeçalho */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${proxima.tipo === 'BUSCA' ? 'bg-blue-900 text-blue-300' : 'bg-orange-900 text-orange-300'}`}>
                        {proxima.tipo === 'BUSCA' ? '🐾 Busca' : '📦 Entrega'}
                      </span>
                      {isUrgente(proxima.data_hora) && (
                        <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Urgente!
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white">{proxima.pet_nome}</h3>
                    <p className="text-slate-400 text-sm">{proxima.cliente_nome}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${statusColors[proxima.status]}`}>
                    {statusLabels[proxima.status]}
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span>{formatDataHora(proxima.data_hora)}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-300">
                    <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                    <span className="leading-snug">{proxima.endereco_transporte || 'Endereço não cadastrado'}</span>
                  </div>
                  {proxima.observacoes && (
                    <div className="text-xs text-slate-500 bg-slate-800 rounded-lg p-2 mt-1">
                      📝 {proxima.observacoes}
                    </div>
                  )}
                </div>

                {/* Ações de comunicação */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => openWaze(proxima.endereco_transporte)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 text-white py-2.5 text-sm font-medium transition-colors"
                  >
                    <Navigation className="w-4 h-4 text-blue-400" /> Navegar
                  </button>
                  <button
                    onClick={() => openWhatsApp(proxima.cliente_whatsapp, proxima.pet_nome)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-emerald-800 bg-emerald-900/40 hover:bg-emerald-900/70 text-emerald-400 py-2.5 text-sm font-medium transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> Avisar
                  </button>
                </div>

                {/* Ação de status */}
                <div className="pt-2 border-t border-slate-700">
                  {proxima.status === 'AGUARDANDO' && (
                    <button
                      disabled={atualizando === proxima.id}
                      onClick={() => handleStatusChange(proxima.id, 'A_CAMINHO')}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      <Truck className="w-5 h-5" />
                      {atualizando === proxima.id ? 'Atualizando...' : 'Sair para o destino'}
                    </button>
                  )}
                  {proxima.status === 'A_CAMINHO' && (
                    <button
                      disabled={atualizando === proxima.id}
                      onClick={() => handleStatusChange(proxima.id, 'CONCLUIDO')}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {atualizando === proxima.id ? 'Finalizando...' : 'Marcar como Concluída'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-slate-300 font-medium">Nenhuma corrida pendente 🎉</p>
              <p className="text-slate-500 text-sm mt-1">Você está em dia!</p>
            </div>
          )}
        </section>

        {/* ── RESTANTES DE HOJE ──────────────────── */}
        {restantes.length > 0 && (
          <section>
            <h2 className="text-slate-400 uppercase text-[10px] font-bold mb-3 tracking-widest">
              Mais para Hoje
            </h2>
            <div className="space-y-2">
              {restantes.map(v => (
                <div key={v.id} className="bg-slate-900 border border-slate-700 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-1 h-10 rounded-full flex-shrink-0 ${v.tipo === 'BUSCA' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{v.pet_nome} <span className="text-slate-500 font-normal text-xs">({v.tipo})</span></p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {formatHora(v.data_hora)}
                        {isUrgente(v.data_hora) && <span className="text-amber-400 ml-1">⚡ Urgente</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openWaze(v.endereco_transporte)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400">
                      <Navigation className="w-4 h-4" />
                    </button>
                    <button onClick={() => openWhatsApp(v.cliente_whatsapp, v.pet_nome)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── CONCLUÍDAS HOJE ────────────────────── */}
        {conclHoje.length > 0 && (
          <section>
            <h2 className="text-slate-400 uppercase text-[10px] font-bold mb-3 tracking-widest">
              Concluídas Hoje
            </h2>
            <div className="space-y-2">
              {conclHoje.map(v => (
                <div key={v.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex items-center gap-3 opacity-70">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-300 truncate">{v.pet_nome}</p>
                    <p className="text-xs text-slate-500">{formatHora(v.data_hora)} • {v.tipo}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── PRÓXIMOS DIAS ──────────────────────── */}
        {futuras.length > 0 && (
          <section>
            <h2 className="text-slate-400 uppercase text-[10px] font-bold mb-3 tracking-widest">
              Próximos Dias
            </h2>
            <div className="space-y-2">
              {futuras.map(v => (
                <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                  <Package className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-300 truncate">{v.pet_nome}</p>
                    <p className="text-xs text-slate-500">{formatDataHora(v.data_hora)} • {v.tipo}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Espaço para navigation bar mobile */}
        <div className="h-8" />
      </main>
    </div>
  );
}
