import React, { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { setDefaultOptions } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { transporteService } from '@/services/transporteService';
import { Transporte } from '@/lib/types';
import { MapPin, MessageCircle, Truck, Plus } from 'lucide-react';
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

  const carregarTransportes = async () => {
    setLoading(true);
    try {
      const data = await transporteService.fetchTransportes();
      setTransportes(data);
    } catch (error: any) {
      toast.error('Erro ao buscar transportes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTransportes();
  }, []);

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
            <h1 className="text-xl font-semibold tracking-tight">Agenda de Transportes</h1>
            <p className="text-sm text-muted-foreground">Controle logístico de buscas e entregas</p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Agendar Transporte
        </Button>
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
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="font-semibold text-muted-foreground">Pet:</div>
                <div className="font-bold">{selectedEvent.pet_nome || 'Não informado'}</div>
                
                <div className="font-semibold text-muted-foreground">Tutor:</div>
                <div>{selectedEvent.cliente_nome || 'Não informado'}</div>

                <div className="font-semibold text-muted-foreground">Motorista:</div>
                <div>{selectedEvent.motorista_nome || 'Não atribuído'}</div>

                <div className="font-semibold text-muted-foreground">Status do sist.:</div>
                <div>{selectedEvent.status}</div>

                <div className="font-semibold text-muted-foreground flex-col">Endereço:</div>
                <div className="line-clamp-3">{selectedEvent.endereco_transporte || 'Não informado'}</div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => openWaze(selectedEvent.endereco_transporte)}>
                  <MapPin size={16} /> Waze / Maps
                </Button>
                <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => openWhatsApp(selectedEvent.cliente_whatsapp, selectedEvent.motorista_nome)}>
                  <MessageCircle size={16} /> Status Zap
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <TransporteModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={carregarTransportes} 
      />
    </div>
  );
}
