import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  CrmDatabase, 
  PetPurchase, 
  fetchPurchases, 
  registerWhatsAppLog, 
  updatePurchaseStatus,
  registerRepurchase,
  startNewPurchaseCycle
} from "@/lib/crm-data";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageCircle, RefreshCw, Clock, Plus, Filter } from "lucide-react";
import { toast } from "sonner";
import RecompraModal from "./RecompraModal";
import NovaRecompraModal from "./NovaRecompraModal";

type FilterStatus = 'Todos' | 'Avisar hoje' | 'Avisar em breve' | 'Vencido' | 'Concluídos';

const RecomprasPage = () => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('Todos');

  // Modal states
  const [recompraModalOpen, setRecompraModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any | null>(null);
  
  const [novaRecompraModalOpen, setNovaRecompraModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all to allow client-side filtering for a snappier feel, 
      // or we could fetch by status if dataset gets huge.
      const data = await fetchPurchases();
      setPurchases(data);
    } catch (error: any) {
      console.error("Error loading recompras:", error);
      toast.error(`Erro ao carregar recompras: ${error?.message || "Erro desconhecido"}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived state for filtering
  const filteredPurchases = useMemo(() => {
    if (filter === 'Todos') return purchases;
    if (filter === 'Concluídos') {
      return purchases.filter(p => ['Recompra registrada', 'Trocado', 'Cancelado'].includes(p.status));
    }
    return purchases.filter(p => p.status === filter);
  }, [purchases, filter]);

  // Actions
  const handleWhatsApp = async (purchase: any) => {
    const customer = purchase.customer;
    const pet = purchase.pet;
    const product = purchase.product;

    if (!customer?.whatsapp && !customer?.telefone) {
      toast.error("Tutor não possui número de celular cadastrado.");
      return;
    }

    const phone = (customer.whatsapp || customer.telefone).replace(/\D/g, '');
    let template = product?.mensagem_padrao || "Olá {tutor}, a reposição do(a) {produto} do(a) {pet} está próxima! Quer que eu já separe para você?";
    
    template = template
      .replace('{tutor}', customer.nome)
      .replace('{pet}', pet?.nome || 'seu pet')
      .replace('{produto}', product?.nome || 'produto');

    const message = encodeURIComponent(template);
    const url = `https://wa.me/55${phone}?text=${message}`;

    window.open(url, '_blank');

    try {
      await registerWhatsAppLog(purchase.id, phone, template);
      toast.success("Mensagem registrada no log!");
      loadData(); // Reload to update status if backend changes it to "Notificado"
    } catch (error) {
      console.error("Failed to log WhatsApp message:", error);
    }
  };

  const handleRegisterRepurchase = async (data: { purchaseId: string; newProductId: string; dataCompra: string; restartCycle: boolean }) => {
    try {
      await registerRepurchase(data.purchaseId, data.newProductId, data.dataCompra);
      toast.success("Recompra registrada com sucesso!");
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao registrar recompra.");
    }
  };

  const handleStartNewCycle = async (data: { petId: string; productId: string; dataCompra: string; prazoRecompra: number }) => {
    try {
      await startNewPurchaseCycle(data.petId, data.productId, data.dataCompra, data.prazoRecompra);
      toast.success("Novo ciclo iniciado!");
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao iniciar ciclo.");
    }
  };

  const statusColors: Record<string, string> = {
    'Ativo': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Avisar em breve': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Avisar hoje': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'Notificado': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'Vencido': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Recompra registrada': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'Trocado': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    'Cancelado': 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Central de Recompras</h1>
          <p className="text-muted-foreground text-sm">Acompanhe os ciclos de produtos e avise seus tutores na hora certa.</p>
        </div>
        <button 
          onClick={() => setNovaRecompraModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          <Plus size={16} /> Iniciar Novo Ciclo
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        {/* Filters Bar */}
        <div className="p-4 border-b border-border bg-secondary/20 flex flex-wrap items-center gap-2">
          <Filter size={16} className="text-muted-foreground mr-2" />
          {(['Todos', 'Avisar hoje', 'Avisar em breve', 'Vencido', 'Concluídos'] as FilterStatus[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                filter === f 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">Carregando ciclos...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">Tutor / Pet</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">Produto</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground py-3 px-4">Última Compra</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground py-3 px-4">Previsão Fim</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground py-3 px-4">Status</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground py-3 px-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Nenhum registro encontrado para este filtro.</td></tr>
                ) : filteredPurchases.map(p => {
                  const dataCompra = new Date(p.data_compra);
                  // Fix timezone offsets for display
                  const dataCompraLocal = new Date(dataCompra.valueOf() + dataCompra.getTimezoneOffset() * 60 * 1000);
                  
                  const proximaData = p.proxima_data ? new Date(p.proxima_data) : null;
                  const proximaDataLocal = proximaData ? new Date(proximaData.valueOf() + proximaData.getTimezoneOffset() * 60 * 1000) : null;

                  const isConcluido = ['Recompra registrada', 'Trocado', 'Cancelado'].includes(p.status);

                  return (
                    <tr key={p.id} className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${isConcluido ? 'opacity-60 grayscale-[50%]' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="font-medium text-sm text-foreground">{p.customer?.nome || 'Desconhecido'}</div>
                        <div className="text-xs text-muted-foreground text-foreground">Pet: {p.pet?.nome || 'Desconhecido'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-foreground">{p.product?.nome || 'Produto Removido'}</div>
                        <div className="text-xs text-muted-foreground">{p.dias_recompra} dias de duração</div>
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-muted-foreground">
                        {format(dataCompraLocal, 'dd/MM/yyyy')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="text-sm font-medium text-foreground">
                          {proximaDataLocal ? format(proximaDataLocal, 'dd/MM/yyyy') : '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[11px] font-semibold px-2 py-1 rounded-full whitespace-nowrap ${statusColors[p.status] || statusColors['Ativo']}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {!isConcluido && (
                            <>
                              <button 
                                onClick={() => handleWhatsApp(p)}
                                className="p-1.5 flex items-center gap-1.5 text-white bg-[#25D366] hover:bg-[#20bd5a] rounded-md transition-colors text-xs font-medium"
                                title="Enviar mensagem"
                              >
                                <MessageCircle size={14} />
                                <span className="hidden lg:inline">Avisar</span>
                              </button>
                              
                              <button 
                                onClick={() => { setSelectedPurchase(p); setRecompraModalOpen(true); }}
                                className="p-1.5 flex items-center gap-1.5 text-primary-foreground bg-primary hover:opacity-90 rounded-md transition-opacity text-xs font-medium"
                                title="Registrar Recompra"
                              >
                                <RefreshCw size={14} />
                                <span className="hidden xl:inline">Renovar</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <RecompraModal 
        open={recompraModalOpen}
        onClose={() => { setRecompraModalOpen(false); setSelectedPurchase(null); }}
        onSave={handleRegisterRepurchase}
        purchase={selectedPurchase}
      />

      <NovaRecompraModal
        open={novaRecompraModalOpen}
        onClose={() => setNovaRecompraModalOpen(false)}
        onSave={handleStartNewCycle}
      />

    </div>
  );
};

export default RecomprasPage;
