import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { setDefaultOptions } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { transporteService } from '@/services/transporteService';
import { supabase } from '@/integrations/supabase/client';
import { Transporte } from '@/lib/types';
import { MapPin, MessageCircle, Truck, Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import TransporteModal from '@/components/crm/TransporteModal';

// Configurando o idioma do Date-fns e do Calendário
setDefaultOptions({ locale: ptBR });
const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

export default function AgendaTransportePage() {
  const [transportes, setTransportes] = useState<Transporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Transporte | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transporteParaEditar, setTransporteParaEditar] = useState<Transporte | null>(null);

  const [realtimeAtivo, setRealtimeAtivo] = useState(false);

  const carregarTransportes = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const data = await transporteService.fetchTransportes();
      setTransportes(data);
    } catch (error: any) {
      toast.error('Erro ao buscar transportes: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarTransportes();

    // Realtime: atualiza o calendário quando o motorista muda o status
    const channel = supabase
      .channel('agenda-transportes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transportes',
      }, () => {
        carregarTransportes(true);
      })
      .subscribe((status) => {
        setRealtimeAtivo(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [carregarTransportes]);

  const openWaze = (endereco: string | null) => {
    if (!endereco) return toast.error("Endereço não informado.");
    window.open(`https://waze.com/ul?q=${encodeURIComponent(endereco)}`, '_blank');
  };

  const openWhatsApp = (numero: string | null, motorista: string | undefined) => {
    if (!numero) return toast.error("Telefone não informado.");
    const limpo = numero.replace(/\D/g, '');
    const m = motorista ? motorista : 'nosso motorista';
    window.open(`https://wa.me/55${limpo}?text=Ol%C3%A1%2C+${encodeURIComponent(m)}+est%C3%A1+a+caminho!`, '_blank');
  };

  const events = transportes.map(t => ({
    title: `${t.pet_nome || 'Pet'} (${t.tipo})`,
    start: new Date(t.data_hora),
    end: new Date(new Date(t.data_hora).getTime() + 60 * 60 * 1000), // Duração fixa visual de 1h
    resource: t,
  }));

  const eventStyleGetter = (event: any) => {
    const t = event.resource as Transporte;
    let backgroundColor = t.tipo === 'BUSCA' ? '#3b82f6' : '#f97316'; // blue-500 : orange-500
    if (t.status === 'CONCLUIDO') backgroundColor = '#22c55e'; // green-500
    if (t.status === 'CANCELADO') backgroundColor = '#ef4444'; // red-500
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: '#fff',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="h-full flex flex-col gap-4 bg-card rounded-lg border border-border p-4 shadow-sm animate-fade-in relative z-10 min-h-[700px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-md">
            <Truck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">Agenda de Transportes</h1>
              {realtimeAtivo && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Ao vivo
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Controle logístico de buscas e entregas</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => carregarTransportes()} className="gap-2">
            <RefreshCcw className="w-4 h-4" /> Atualizar
          </Button>
          <Button onClick={() => { setTransporteParaEditar(null); setIsModalOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Agendar Transporte
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-[500px]">
        {loading ? (
           <div className="flex items-center justify-center h-full text-muted-foreground">Carregando viagens...</div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            culture="pt-BR"
            messages={{
              next: "Próximo",
              previous: "Anterior",
              today: "Hoje",
              month: "Mês",
              week: "Semana",
              day: "Dia"
            }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={(event) => setSelectedEvent(event.resource)}
          />
        )}
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Detalhes da Viagem</span>
              <span className="text-xs px-2 py-1 bg-slate-100 rounded-lg uppercase tracking-wider text-slate-800">{selectedEvent?.tipo}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-3 text-sm">
                <div className="font-semibold text-muted-foreground">Pet:</div>
                <div className="font-bold text-primary flex items-center gap-2">
                  🐾 {selectedEvent.pet_nome || 'Não informado'}
                </div>
                
                <div className="font-semibold text-muted-foreground">Tutor:</div>
                <div className="font-medium text-foreground">{selectedEvent.cliente_nome || 'Não informado'}</div>

                <div className="font-semibold text-muted-foreground">Motorista:</div>
                <div className="break-all text-muted-foreground">{selectedEvent.motorista_nome || 'Não atribuído'}</div>

                <div className="font-semibold text-muted-foreground">Status Sist.:</div>
                <div className="flex items-center">
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
                    {selectedEvent.status}
                  </span>
                </div>

                <div className="font-semibold text-muted-foreground">Endereço:</div>
                <div className="text-muted-foreground leading-relaxed">{selectedEvent.endereco_transporte || 'Não informado'}</div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1 gap-2 border-primary/20 text-primary hover:bg-primary/5 hover:text-primary" onClick={() => { setTransporteParaEditar(selectedEvent); setSelectedEvent(null); setIsModalOpen(true); }}>
                  Editar
                </Button>
                <div className="w-[1px] bg-border my-1 rounded" />
                <Button variant="outline" className="flex-1 gap-1" onClick={() => openWaze(selectedEvent.endereco_transporte)}>
                  <MapPin size={16} /> Waze
                </Button>
                <Button className="flex-1 gap-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => openWhatsApp(selectedEvent.cliente_whatsapp, selectedEvent.motorista_nome)}>
                  <MessageCircle size={16} /> Zap
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <TransporteModal 
        open={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setTransporteParaEditar(null); }} 
        onSuccess={carregarTransportes} 
        transporteToEdit={transporteParaEditar}
      />
    </div>
  );
}
