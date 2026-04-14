import React, { useEffect, useState } from 'react';
import { transporteService } from '@/services/transporteService';
import { Transporte, TransporteStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { toast } from 'sonner';
import { LogOut, MapPin, MessageCircle, Clock, Truck, CheckCircle, RefreshCcw } from 'lucide-react';

const statusColors: Record<TransporteStatus, string> = {
  AGUARDANDO: 'bg-yellow-100 text-yellow-800',
  A_CAMINHO: 'bg-blue-100 text-blue-800',
  CONCLUIDO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
  REAGENDADO: 'bg-orange-100 text-orange-800',
};

const statusLabels: Record<TransporteStatus, string> = {
  AGUARDANDO: 'Aguardando',
  A_CAMINHO: 'A Caminho',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
  REAGENDADO: 'Reagendado',
};

export default function DriverDashboard() {
  const [transportes, setTransportes] = useState<Transporte[]>([]);
  const [loading, setLoading] = useState(true);
  const { signOut, user } = useAuth();
  const userName = user?.user_metadata?.full_name || user?.email || 'Motorista';

  const carregarTransportes = async () => {
    setLoading(true);
    try {
      const data = await transporteService.fetchMeusTransportes();
      setTransportes(data);
    } catch (error: any) {
      toast.error('Erro ao buscar suas corridas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTransportes();
  }, []);

  const handleStatusChange = async (id: string, novoStatus: TransporteStatus) => {
    try {
      await transporteService.updateStatus(id, novoStatus);
      toast.success('Status atualizado!');
      carregarTransportes();
    } catch (error: any) {
      toast.error('Erro ao atualizar corrida: ' + error.message);
    }
  };

  const openWaze = (endereco: string | null) => {
    if (!endereco) return toast.error("Endereço não informado para esta viagem.");
    const encoded = encodeURIComponent(endereco);
    window.open(`https://waze.com/ul?q=${encoded}`, '_blank');
  };

  const openWhatsApp = (numero: string | null) => {
    if (!numero) return toast.error("Telefone não informado.");
    const limpo = numero.replace(/\D/g, '');
    window.open(`https://wa.me/55${limpo}?text=Ol%C3%A1%2C+o+motorista+est%C3%A1+a+caminho!`, '_blank');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando viagens...</div>;
  }

  // Pegar a primeira viagem "Pendente" ou "A Caminho" como destaque
  const proximaViagem = transportes.find(t => ['AGUARDANDO', 'A_CAMINHO'].includes(t.status));
  const demaisViagens = transportes.filter(t => t.id !== proximaViagem?.id);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Mobile First */}
      <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <Truck className="w-6 h-6" />
          <h1 className="font-bold text-lg">Painel do Motorista</h1>
        </div>
        <div className="flex gap-3 items-center">
          <span className="text-sm opacity-90 hidden sm:block">Olá, {userName}</span>
          <Button variant="ghost" size="icon" onClick={() => carregarTransportes()} className="text-primary-foreground hover:bg-primary/80">
            <RefreshCcw className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-primary-foreground hover:bg-primary/80">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6">
        
        {/* Destaque: Próxima Viagem */}
        <section>
          <h2 className="text-muted-foreground uppercase text-xs font-bold mb-3 tracking-widest">Viagem Atual / Próxima</h2>
          {proximaViagem ? (
            <Card className="border-2 border-primary/20 shadow-lg relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-2 h-full ${proximaViagem.tipo === 'BUSCA' ? 'bg-blue-500' : 'bg-orange-500'}`} />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold whitespace-nowrap text-[10px] uppercase tracking-wider bg-slate-100 px-2 py-1 rounded">
                      {proximaViagem.tipo}
                    </span>
                    <CardTitle className="text-xl mt-2">{proximaViagem.pet_nome || 'Pet (Nome não inf.)'}</CardTitle>
                    <p className="text-sm text-muted-foreground">{proximaViagem.cliente_nome || 'Tutor não inf.'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[proximaViagem.status]}`}>
                    {statusLabels[proximaViagem.status]}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="flex items-start gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span>{new Date(proximaViagem.data_hora).toLocaleString('pt-BR')}</span>
                </div>
                
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span className="line-clamp-2">{proximaViagem.endereco_transporte || 'Endereço não cadastrado'}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button variant="outline" className="w-full flex gap-2" onClick={() => openWaze(proximaViagem.endereco_transporte)}>
                    <MapPin className="w-4 h-4" /> Navegar
                  </Button>
                  <Button variant="outline" className="w-full flex gap-2 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => openWhatsApp(proximaViagem.cliente_whatsapp)}>
                    <MessageCircle className="w-4 h-4" /> Avisar
                  </Button>
                </div>

                <div className="pt-4 border-t flex flex-col gap-2">
                  {proximaViagem.status === 'AGUARDANDO' && (
                    <Button className="w-full" size="lg" onClick={() => handleStatusChange(proximaViagem.id, 'A_CAMINHO')}>
                      Sair para o destino
                    </Button>
                  )}
                  {proximaViagem.status === 'A_CAMINHO' && (
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg" onClick={() => handleStatusChange(proximaViagem.id, 'CONCLUIDO')}>
                      <CheckCircle className="w-5 h-5 mr-2" /> Marcar como Concluída
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-white border rounded-lg p-6 text-center text-muted-foreground">
              <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p>Nenhuma corrida atual ou pendente.</p>
            </div>
          )}
        </section>

        {/* Lista das demais viagens */}
        {demaisViagens.length > 0 && (
          <section>
            <h2 className="text-muted-foreground uppercase text-xs font-bold mb-3 tracking-widest">Outras do Dia / Futuras</h2>
            <div className="flex flex-col gap-3">
              {demaisViagens.map(viagem => (
                <div key={viagem.id} className="bg-white p-4 rounded-lg border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                     <div className={`w-1 h-12 rounded ${viagem.tipo === 'BUSCA' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                     <div>
                       <p className="font-semibold">{viagem.pet_nome || 'Pet'} <span className="text-xs text-muted-foreground font-normal ml-1">({viagem.tipo})</span></p>
                       <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                         <Clock className="w-3 h-3" />
                         {new Date(viagem.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                         <span className="mx-1">•</span>
                         <span className="truncate max-w-[150px]">{viagem.endereco_transporte || 'S/Endereço'}</span>
                       </div>
                     </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusColors[viagem.status]}`}>
                      {statusLabels[viagem.status]}
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openWaze(viagem.endereco_transporte)} className="h-8 w-8">
                        <MapPin className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openWhatsApp(viagem.cliente_whatsapp)} className="h-8 w-8 text-green-600">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
