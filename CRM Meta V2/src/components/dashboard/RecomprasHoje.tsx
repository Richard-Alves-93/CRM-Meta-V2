import { useState, useEffect, useMemo } from "react";
import { fetchPurchases, PetPurchase, Customer, Pet, Product, registerWhatsAppLog } from "@/lib/crm-data";
import { Bell, MessageCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RecomprasHojeProps {
  onNavigateToRecompras: () => void;
}

const RecomprasHoje = ({ onNavigateToRecompras }: RecomprasHojeProps) => {
  const [purchases, setPurchases] = useState<(PetPurchase & { customer?: Customer, pet?: Pet, product?: Product })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPurchases = async () => {
      setLoading(true);
      try {
        const data = await fetchPurchases({ status: 'Avisar hoje' });
        // Order by reminder date (though they should all be today or overdue-ish)
        setPurchases(data.slice(0, 5)); // Limit to top 5 on dashboard
      } catch (error) {
        console.error("Error fetching recompras hoje:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPurchases();
  }, []);

  const totalPotencial = useMemo(() => {
    return purchases.reduce((acc, p) => acc + (p.valor || 0), 0);
  }, [purchases]);

  const handleWhatsApp = async (purchase: any) => {
    const customer = purchase.customer;
    const pet = purchase.pet;
    const product = purchase.product;

    if (!customer?.whatsapp && !customer?.telefone) {
      alert("Tutor não possui número de WhatsApp cadastrado.");
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

    // Open WhatsApp
    window.open(url, '_blank');

    // Register log
    try {
      await registerWhatsAppLog(purchase.id, phone, template);
    } catch (error) {
      console.error("Failed to log WhatsApp message:", error);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm min-h-[300px] flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Carregando alertas...</div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-border flex items-center justify-between bg-primary/5">
        <div className="flex items-center gap-2 text-primary">
          <Bell size={20} className="animate-pulse-slow" />
          <h2 className="font-semibold text-card-foreground text-lg">Recompras Hoje</h2>
        </div>
        <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
          {purchases.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {totalPotencial > 0 && (
          <div className="mb-2 p-3 bg-primary/5 border border-primary/10 rounded-lg">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">
              Faturamento Potencial de Hoje
            </p>
            <p className="text-xl font-bold text-primary">
              {totalPotencial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        )}

        {purchases.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-8">
            <Bell size={40} className="mb-3 opacity-20" />
            <p className="text-sm">Nenhum alerta para hoje!</p>
          </div>
        ) : (
          purchases.map(p => (
            <div key={p.id} className="bg-background border border-border rounded-lg p-3 hover:border-primary/50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-sm font-bold text-foreground truncate w-[160px]" title={p.customer?.nome}>
                    {p.customer?.nome || 'Tutor Desconhecido'}
                  </h3>
                  <p className="text-xs text-muted-foreground">Pet: <span className="text-foreground">{p.pet?.nome || '?'}</span></p>
                  {(p.pet?.especie || p.pet?.raca) && (
                    <p className="text-[10px] text-muted-foreground italic">
                      {p.pet?.especie}{p.pet?.raca ? ` - ${p.pet.raca}` : ''}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full inline-block">
                    {p.status}
                  </span>
                </div>
              </div>

              <div className="text-sm text-foreground mb-1 truncate" title={p.product?.nome}>
                <span className="text-muted-foreground">Produto:</span> {p.product?.nome || '?'}
              </div>

              {p.valor && p.valor > 0 && (
                <div className="text-xs text-muted-foreground mb-3">
                  Último valor: <span className="text-foreground font-medium">{p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              )}

              <button
                onClick={() => handleWhatsApp(p)}
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold py-2 rounded-md transition-colors"
                title="Enviar mensagem no WhatsApp"
              >
                <MessageCircle size={14} /> Enviar WhatsApp
              </button>
            </div>
          ))
        )}
      </div>

      <button
        onClick={onNavigateToRecompras}
        className="w-full p-3 border-t border-border bg-secondary/30 hover:bg-secondary/70 text-sm font-medium text-foreground transition-colors flex items-center justify-center gap-2"
      >
        Ver todas <ArrowRight size={16} />
      </button>
    </div>
  );
};

export default RecomprasHoje;
