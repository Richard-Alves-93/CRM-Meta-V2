import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import { pdvService } from "@/services/pdvService";
import { fetchCustomersWithPets } from "@/services/customerService";
import { transporteService } from "@/services/transporteService";
import { Product, Service, Customer, Pet, Profile, SaleItem, Payment, CashierSession, TransporteTipo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ShoppingCart, Search, Trash2, Plus, Minus, CreditCard, 
  Wallet, User, Dog, Truck, Calculator, Calendar, 
  ChevronDown, ChevronUp, Lock, Unlock, ArrowRight, Info
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import { Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useCurrencyInput } from "@/hooks/useCurrencyInput";

// ---- Sub-Componente de Seleção de Cliente/Pet ----
const ClientPetSelector = ({ 
  customers, 
  selectedCustomerId, 
  selectedPetId, 
  onSelectCustomer, 
  onSelectPet 
}: { 
  customers: (Customer & { pets: Pet[] })[], 
  selectedCustomerId: string, 
  selectedPetId: string, 
  onSelectCustomer: (id: string) => void, 
  onSelectPet: (id: string) => void 
}) => {
  const [open, setOpen] = useState(false);
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const availablePets = selectedCustomer?.pets || [];

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      <div className="flex-1 space-y-2">
        <Label className="text-xs uppercase font-bold text-muted-foreground">Cliente / Tutor</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between bg-background/50 border-input hover:bg-accent transition-colors"
            >
              {selectedCustomerId ? selectedCustomer?.nome : "Pesquisar cliente..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command className="w-full">
              <CommandInput placeholder="Nome do tutor ou pet..." />
              <CommandList>
                <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                <CommandGroup>
                  {customers.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={`${c.nome} ${c.pets.map(p=>p.nome).join(' ')}`}
                      onSelect={() => {
                        onSelectCustomer(c.id);
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <Check className={cn("mr-2 h-4 w-4", selectedCustomerId === c.id ? "opacity-100" : "opacity-0")} />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{c.nome}</span>
                        <div className="flex gap-1">
                           {c.pets.map(p => <Badge key={p.id} variant="secondary" className="text-[9px] py-0 px-1">{p.nome}</Badge>)}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="w-full sm:w-[200px] space-y-2">
        <Label className="text-xs uppercase font-bold text-muted-foreground">Pet Vinculado</Label>
        <Select value={selectedPetId} onValueChange={onSelectPet} disabled={!selectedCustomerId}>
          <SelectTrigger className="bg-background/50">
            <SelectValue placeholder="Selecione o pet" />
          </SelectTrigger>
          <SelectContent>
            {availablePets.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

// ---- Main Page Component ----
const PdvPage = () => {
  const { user, tenantId, profileId, hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<CashierSession | null>(null);
  const [items, setItems] = useState<{ products: Product[], services: Service[] }>({ products: [], services: [] });
  const [customers, setCustomers] = useState<(Customer & { pets: Pet[] })[]>([]);
  const [motoristas, setMotoristas] = useState<Profile[]>([]);

  // Venda State
  const [cart, setCart] = useState<(Omit<SaleItem, 'id' | 'sale_id'> & { original?: Product | Service })[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedPetId, setSelectedPetId] = useState("");
  const [discount, setDiscount] = useState(0);
  
  // Logistics State
  const [hasLogistics, setHasLogistics] = useState(false);
  const [logisticsData, setLogisticsData] = useState({
    busca: { active: false, date: new Date(), time: "09:00", driverId: "", addr: "" },
    entrega: { active: false, date: new Date(), time: "17:00", driverId: "", addr: "" }
  });

  // Modal State
  const [cashierModalOpen, setCashierModalOpen] = useState(false);
  const initialAmount = useCurrencyInput(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<{ method: string, amount: number }[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'pix' | 'credit_card' | 'debit_card'>('cash');
  const discountInput = useCurrencyInput(0);
  const paymentAmount = useCurrencyInput(0);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [equipe, setEquipe] = useState<Profile[]>([]);
  const [searchParams] = useSearchParams();

  // Load Initial Data
  const loadData = useCallback(async () => {
    if (!tenantId) {
      console.warn("[PDV] loadData ignorado: tenantId não disponível");
      return;
    }

    try {
      setLoading(true);
      console.log("[PDV] Carregando dados iniciais para tenant:", tenantId);

      // Usamos resultados individuais para não quebrar a página toda se um falhar
      const [pdvDataRes, custDataRes, activeSessionRes, driversRes, profilesRes] = await Promise.allSettled([
        pdvService.fetchPdvData(),
        fetchCustomersWithPets(tenantId),
        profileId ? pdvService.getActiveSession(profileId) : Promise.resolve(null),
        transporteService.fetchMotoristasDaEmpresa(tenantId),
        pdvService.fetchProfiles(tenantId)
      ]);

      // Processar Produtos e Serviços (Essencial)
      if (pdvDataRes.status === 'fulfilled') {
        setItems(pdvDataRes.value);
      } else {
        console.error("[PDV] Erro ao carregar itens:", pdvDataRes.reason);
        toast.error("Erro ao carregar lista de produtos/serviços.");
      }

      // Processar Clientes (Essencial)
      if (custDataRes.status === 'fulfilled') {
        setCustomers(custDataRes.value);
      } else {
        console.error("[PDV] Erro ao carregar clientes:", custDataRes.reason);
        toast.error("Erro ao carregar lista de clientes.");
      }

      // Processar Sessão (Essencial para operação)
      if (activeSessionRes.status === 'fulfilled') {
        setSession(activeSessionRes.value);
        if (!activeSessionRes.value && hasPermission("pdv.open")) {
          setCashierModalOpen(true);
        }
      } else {
        console.error("[PDV] Erro ao carregar sessão:", activeSessionRes.reason);
      }

      // Processar Equipe
      if (profilesRes.status === 'fulfilled') {
        setEquipe(profilesRes.value);
      }
      
      // Processar Motoristas (Opcional - Logística)
      if (driversRes.status === 'fulfilled') {
        setMotoristas(driversRes.value);
      } else {
        console.warn("[PDV] Erro ao carregar motoristas:", driversRes.reason);
      }
      
      // Hydrate Cart from LocalStorage
      if (tenantId && profileId) {
        const saved = localStorage.getItem(`pdv_cart_${tenantId}_${profileId}`);
        if (saved) {
          try {
            const data = JSON.parse(saved);
            if (data.cart) setCart(data.cart);
            if (data.customerId) setSelectedCustomerId(data.customerId);
            if (data.petId) setSelectedPetId(data.petId);
            if (data.discount) discountInput.setValue(data.discount);
            if (data.hasLogistics !== undefined) setHasLogistics(data.hasLogistics);
            if (data.logisticsData) setLogisticsData(data.logisticsData);
          } catch (e) {
            console.error("[PDV] Erro na restauração do carrinho:", e);
          }
        }
      }
    } catch (err) {
      console.error("[PDV] Erro inesperado no loadData:", err);
      toast.error("Erro inesperado ao carregar o PDV.");
    } finally {
      setLoading(false);
    }
  }, [user, profileId, tenantId, hasPermission]);

  // Persist Cart to LocalStorage
  useEffect(() => {
    if (tenantId && profileId && !loading) {
      const dataToSave = {
        cart,
        customerId: selectedCustomerId,
        petId: selectedPetId,
        discount: discountInput.rawValue,
        hasLogistics,
        logisticsData
      };
      localStorage.setItem(`pdv_cart_${tenantId}_${profileId}`, JSON.stringify(dataToSave));
    }
  }, [cart, selectedCustomerId, selectedPetId, discountInput.rawValue, hasLogistics, logisticsData, tenantId, profileId, loading]);

  useEffect(() => { loadData(); }, [loadData]);

  // Handle URL parameters for pre-selection (Attendance Flow)
  useEffect(() => {
    if (loading) return; // Wait for initial loading
    
    const urlCustomerId = searchParams.get("customerId");
    const urlPetId = searchParams.get("petId");
    
    if (urlCustomerId) {
      console.log("[PDV] Pre-selecting customer from URL:", urlCustomerId);
      setSelectedCustomerId(urlCustomerId);
      
      if (urlPetId) {
        console.log("[PDV] Pre-selecting pet from URL:", urlPetId);
        setSelectedPetId(urlPetId);
      }
      
      toast.info("Atendimento iniciado via Cadastros");
    }
  }, [loading, searchParams]);

  // Pre-fill address when customer changes
  useEffect(() => {
    if (selectedCustomerId) {
      const c = customers.find(curr => curr.id === selectedCustomerId);
      if (c) {
        const fullAddr = `${c.endereco || ''}, ${c.numero || ''} ${c.complemento ? `- ${c.complemento}` : ''} ${c.bairro ? `(${c.bairro})` : ''}`.trim();
        setLogisticsData(prev => ({
          ...prev,
          busca: { ...prev.busca, addr: fullAddr },
          entrega: { ...prev.entrega, addr: fullAddr }
        }));
      }
    }
  }, [selectedCustomerId, customers]);

  // Calculations
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.total_price, 0), [cart]);
  const total = Math.max(0, subtotal - discountInput.rawValue);

  // Cart Handlers
  const addToCart = (item: Product | Service, type: 'product' | 'service') => {
    const existing = cart.find(i => i.item_id === item.id && i.type === type);
    if (existing) {
      setCart(cart.map(i => i.item_id === item.id && i.type === type ? { 
        ...i, 
        quantity: i.quantity + 1, 
        total_price: (i.quantity + 1) * i.unit_price 
      } : i));
    } else {
      setCart([...cart, {
        type,
        item_id: item.id,
        name: item.nome,
        quantity: 1,
        unit_price: type === 'product' ? (item as Product).preco_venda : (item as Service).preco,
        total_price: type === 'product' ? (item as Product).preco_venda : (item as Service).preco,
        pet_id: selectedPetId || null,
        professional_id: null,
        original: item
      }]);
    }
    toast.success(`${item.nome} adicionado.`);
  };

  const updateQty = (id: string, type: 'product' | 'service', delta: number) => {
    setCart(cart.map(i => {
      if (i.item_id === id && i.type === type) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty, total_price: newQty * i.unit_price };
      }
      return i;
    }));
  };

  const removeItem = (id: string, type: 'product' | 'service') => {
    setCart(cart.filter(i => !(i.item_id === id && i.type === type)));
  };

  const updateItemProfessional = (itemId: string, professionalId: string) => {
    setCart(prev => prev.map(i => i.item_id === itemId && i.type === 'service' ? { ...i, professional_id: professionalId } : i));
  };
   const handleClearCart = (silent = false) => {
    const clear = () => {
      setCart([]);
      setSelectedCustomerId("");
      setSelectedPetId("");
      discountInput.setValue(0);
      setHasLogistics(false);
      setLogisticsData({
        busca: { active: false, date: new Date(), time: "09:00", driverId: "", addr: "" },
        entrega: { active: false, date: new Date(), time: "17:00", driverId: "", addr: "" }
      });
      if (tenantId && profileId) {
        localStorage.removeItem(`pdv_cart_${tenantId}_${profileId}`);
      }
      if (!silent) toast.success("Carrinho esvaziado.");
    };

    if (silent) {
      clear();
    } else if (cart.length > 0 || selectedCustomerId) {
      if (window.confirm("Deseja realmente esvaziar o carrinho e limpar os dados atuais?")) {
        clear();
      }
    } else {
      clear();
    }
  };

  const handleOpenCashier = async () => {
    console.log("[PDV] Tentando abrir caixa...", { userId: user?.id, profileId, tenantId });
    
    if (!user || !profileId) {
      toast.error("Erro: Perfil de usuário não carregado. Tente recarregar a página.");
      return;
    }
    
    if (!tenantId) {
      toast.error("Erro: Contexto de empresa (Tenant) não encontrado. Verifique seu cadastro.");
      return;
    }

    try {
      setIsSubmitting(true);
      const newSession = await pdvService.openCashier(profileId, tenantId, initialAmount.rawValue);
      setSession(newSession);
      setCashierModalOpen(false);
      toast.success("Caixa aberto com sucesso!");
    } catch (err: any) {
      console.error("[PDV] Erro fatal ao abrir caixa:", err);
      toast.error(`Falha ao abrir o caixa: ${err.message || "Erro desconhecido"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseCashier = async () => {
    if (!session) return;
    const finalAmt = prompt("Informe o saldo final em dinheiro no caixa:", session.initial_amount.toString());
    if (finalAmt === null) return;

    try {
      await pdvService.closeCashier(session.id, parseFloat(finalAmt));
      setSession(null);
      toast.success("Caixa fechado e faturamento enviado ao dashboard!");
    } catch (err) {
      toast.error("Erro ao fechar caixa.");
    }
  };

  const handleFinalizeSale = async () => {
    if (!selectedCustomerId || cart.length === 0 || !session || !user) {
      return toast.error("Preencha o cliente e adicione itens ao carrinho.");
    }

    const totalPaid = paymentMethods.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid < total) {
      return toast.error("O valor pago é menor que o total da venda.");
    }

    try {
      setLoading(true);
      
      const logisticsPayload = hasLogistics ? {
        busca: logisticsData.busca.active ? {
          data_hora: new Date(`${format(logisticsData.busca.date, "yyyy-MM-dd")}T${logisticsData.busca.time}`).toISOString(),
          motorista_id: logisticsData.busca.driverId,
          endereco_transporte: logisticsData.busca.addr,
          observacoes: "Agendado via PDV - Busca"
        } : undefined,
        entrega: logisticsData.entrega.active ? {
          data_hora: new Date(`${format(logisticsData.entrega.date, "yyyy-MM-dd")}T${logisticsData.entrega.time}`).toISOString(),
          motorista_id: logisticsData.entrega.driverId,
          endereco_transporte: logisticsData.entrega.addr,
          observacoes: "Agendado via PDV - Entrega"
        } : undefined
      } : undefined;

      await pdvService.createSale(
        {
          tenant_id: tenantId!,
          customer_id: selectedCustomerId,
          pet_id: selectedPetId || null,
          user_id: profileId!,
          cashier_session_id: session.id,
          total_amount: total,
          discount_amount: discountInput.rawValue,
          status: 'paid'
        },
        cart.map(({ original, ...rest }) => ({
          ...rest,
          pet_id: rest.pet_id || selectedPetId || null
        })),
        paymentMethods as Payment[],
        logisticsPayload
      );

      toast.success("Venda realizada com sucesso!");
      handleClearCart(true); // Silent clear
      setCheckoutOpen(false);
      setPaymentMethods([]);
    } catch (err) {
      console.error("Sale Error:", err);
      toast.error("Erro ao realizar venda.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && items.products.length === 0) {
    return <div className="p-8 flex items-center justify-center min-h-[50vh]"><div className="animate-pulse text-muted-foreground font-medium">Preparando PDV...</div></div>;
  }

  if (!session && !cashierModalOpen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="bg-primary/5 p-6 rounded-full"><Lock className="w-12 h-12 text-primary opacity-50" /></div>
        <h2 className="text-xl font-bold">O Caixa está fechado</h2>
        <p className="text-muted-foreground text-center max-w-sm">Você precisa abrir o caixa para começar a realizar vendas no PDV.</p>
        <Button onClick={() => setCashierModalOpen(true)} size="lg" className="rounded-xl font-bold shadow-lg">Abrir Caixa Agora</Button>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* Header do PDV */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-card/60 backdrop-blur-md border border-border p-2 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-lg border border-primary/20">
            <ShoppingCart className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-black text-foreground tracking-tight uppercase">PDV</h1>
            <div className="flex items-center gap-2 mt-0.5">
               <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] font-black uppercase tracking-widest px-1.5 h-4">Caixa Aberto</Badge>
               <span className="text-[10px] text-muted-foreground font-mono">ID: {session?.id.slice(0,8)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(cart.length > 0 || selectedCustomerId) && (
            <Button 
              variant="ghost" 
              className="text-[10px] font-bold text-muted-foreground hover:text-destructive h-8 px-2 group" 
              onClick={() => handleClearCart()}
              title="Esvaziar Carrinho"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1 group-hover:scale-110 transition-transform" /> 
              Esvaziar
            </Button>
          )}
          <div className="h-6 w-[1px] bg-border hidden sm:block"></div>
          <Button variant="ghost" className="text-[10px] font-bold text-muted-foreground hover:text-destructive h-8 px-2" onClick={handleCloseCashier}>
            <Unlock className="w-3.5 h-3.5 mr-1" /> Encerrar Caixa
          </Button>
          <div className="h-6 w-[1px] bg-border hidden sm:block"></div>
          <div className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-lg border">
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Saldo:</span>
            <span className="text-xs font-mono font-bold text-primary">{formatCurrency(session?.initial_amount || 0)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
        {/* Lado Esquerdo: Carrinho e Busca */}
        <div className="lg:col-span-8 flex flex-col gap-2">
          <Card className="border-0 shadow-lg bg-card/40 backdrop-blur overflow-hidden">
            <CardHeader className="border-b bg-card/30 py-2 px-3">
              <div className="flex flex-col gap-4">
                <ClientPetSelector 
                  customers={customers} 
                  selectedCustomerId={selectedCustomerId} 
                  selectedPetId={selectedPetId} 
                  onSelectCustomer={setSelectedCustomerId} 
                  onSelectPet={setSelectedPetId} 
                />
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Input 
                        placeholder="Adicionar item... (F2)" 
                        className="pl-10 h-9 bg-background/50 border-primary/20 focus:border-primary transition-all rounded-lg text-sm"
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command className="w-full">
                        <CommandInput placeholder="Digite o nome..." />
                        <CommandList className="max-h-[400px]">
                          <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                          <CommandGroup heading="Serviços">
                            {items.services.map(s => (
                              <CommandItem key={s.id} onSelect={() => addToCart(s, 'service')} className="cursor-pointer">
                                <Plus className="mr-2 h-4 w-4" />
                                <div className="flex justify-between w-full">
                                  <span>{s.nome}</span>
                                  <span className="font-bold text-primary">{formatCurrency(s.preco)}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <CommandGroup heading="Produtos">
                            {items.products.map(p => (
                              <CommandItem key={p.id} onSelect={() => addToCart(p, 'product')} className="cursor-pointer">
                                <Plus className="mr-2 h-4 w-4" />
                                <div className="flex justify-between w-full items-center">
                                  <div className="flex flex-col">
                                    <span>{p.nome}</span>
                                    <span className="text-[10px] text-muted-foreground">Estoque: {p.estoque_atual} un</span>
                                  </div>
                                  <span className="font-bold text-primary">{formatCurrency(p.preco_venda)}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="min-h-[220px]">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[220px] gap-2 text-muted-foreground opacity-30">
                    <ShoppingCart className="w-12 h-12" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">Vazio</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-secondary/30">
                      <TableRow>
                        <TableHead className="w-[10px] px-1"></TableHead>
                        <TableHead className="text-xs uppercase font-bold text-muted-foreground px-2">Item</TableHead>
                        <TableHead className="text-center text-xs uppercase font-bold text-muted-foreground px-2">Qtd</TableHead>
                        <TableHead className="text-center text-xs uppercase font-bold text-muted-foreground px-2">Profissional</TableHead>
                        <TableHead className="text-right text-xs uppercase font-bold text-muted-foreground px-2">Unitário</TableHead>
                        <TableHead className="text-right text-xs uppercase font-bold text-muted-foreground px-2">Total</TableHead>
                        <TableHead className="w-[10px] px-1"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item, idx) => (
                        <TableRow key={idx} className="hover:bg-primary/5 transition-colors border-border/50">
                          <TableCell className="px-1">
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              item.type === 'product' ? "bg-blue-500" : "bg-purple-500"
                            )} />
                          </TableCell>
                          <TableCell className="px-2">
                            <div className="flex flex-col min-w-[100px]">
                              <span className="font-bold text-xs text-foreground truncate max-w-[140px] block">{item.name}</span>
                              <span className="text-[9px] text-muted-foreground uppercase">{item.type === 'product' ? 'Produto' : 'Serviço'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-1">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="outline" size="icon" className="h-6 w-6 rounded-md" onClick={() => updateQty(item.item_id, item.type, -1)}><Minus className="h-2.5 w-2.5" /></Button>
                              <span className="w-6 text-center font-mono font-bold text-xs">{item.quantity}</span>
                              <Button variant="outline" size="icon" className="h-6 w-6 rounded-md" onClick={() => updateQty(item.item_id, item.type, 1)}><Plus className="h-2.5 w-2.5" /></Button>
                            </div>
                          </TableCell>
                          <TableCell className="px-1 w-[110px]">
                            {item.type === 'service' ? (
                              <div className="flex flex-col gap-1 items-stretch">
                                <Select 
                                  value={item.professional_id || ""} 
                                  onValueChange={(v) => updateItemProfessional(item.item_id, v)}
                                >
                                  <SelectTrigger className={cn(
                                    "h-7 text-[10px] font-bold uppercase py-0 px-2",
                                    !item.professional_id && (item.original as Service)?.requires_professional && "border-destructive text-destructive animate-pulse"
                                  )}>
                                    <SelectValue placeholder="EXECUTOR" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {equipe.map(p => (
                                      <SelectItem key={p.id} value={p.id} className="text-xs">
                                        {p.display_name?.split(' ')[0]}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {!item.professional_id && (item.original as Service)?.requires_professional && (
                                  <span className="text-[8px] text-destructive font-bold uppercase text-center leading-none">Obrigatório</span>
                                )}
                              </div>
                            ) : (
                              <div className="text-center text-muted-foreground opacity-30">-</div>
                            )}
                          </TableCell>
                          <TableCell className="px-2 text-right font-medium text-muted-foreground text-xs whitespace-nowrap">{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell className="px-2 text-right font-bold text-foreground text-xs whitespace-nowrap">{formatCurrency(item.total_price)}</TableCell>
                          <TableCell className="px-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => removeItem(item.item_id, item.type)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lado Direito: Resumo, Logística e Checkout */}
        <div className="lg:col-span-4 flex flex-col gap-2">
          <Card className="border-0 shadow-2xl bg-primary/5 border-t-2 border-primary overflow-hidden rounded-xl">
            <CardHeader className="pb-1 pt-2 px-4 flex-row items-center gap-2">
                 <Calculator className="w-3.5 h-3.5 text-primary" />
                 <h2 className="text-[11px] font-black uppercase tracking-widest text-primary">Resumo</h2>
            </CardHeader>
            <CardContent className="space-y-1.5 px-4 pb-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold text-foreground">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Desconto</span>
                  {hasPermission("pdv.discount") && (
                    <Button variant="ghost" className="h-6 px-1.5 text-[10px]" onClick={() => setDiscountModalOpen(true)}>Aplicar</Button>
                  )}
                </div>
                <span className="font-bold text-destructive">-{formatCurrency(discountInput.rawValue)}</span>
              </div>
              <div className="pt-2 border-t border-dashed border-primary/20">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase text-primary tracking-tighter">Total</span>
                  <span className="text-2xl font-black text-foreground tracking-tighter leading-tight">{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logística Integrada */}
          <Card className="border-0 shadow-lg bg-card/40 backdrop-blur rounded-xl">
             <CardHeader className="py-2 px-4 items-center flex flex-row justify-between">
                <div className="flex items-center gap-2">
                   <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                   <h3 className="text-[10px] font-bold uppercase tracking-wider">Logística</h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn("h-6 px-2 text-[9px] font-bold", hasLogistics ? "text-primary" : "text-muted-foreground")}
                  onClick={() => setHasLogistics(!hasLogistics)}
                >
                  {hasLogistics ? "ATIVO" : "OFF"}
                </Button>
             </CardHeader>
             {hasLogistics && (
               <CardContent className="space-y-4 pt-0 text-xs animate-in slide-in-from-top-2 duration-300">
                  <div className="bg-secondary/40 p-3 rounded-xl space-y-3 border">
                    {/* BUSCA */}
                    <div className="space-y-2">
                       <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={logisticsData.busca.active} 
                            onChange={() => setLogisticsData(p=>({...p, busca: {...p.busca, active: !p.busca.active}}))}
                            className="rounded border-border text-primary"
                          />
                          <span className="font-bold uppercase text-[10px]">Agendar Tele-Busca</span>
                       </div>
                       {logisticsData.busca.active && (
                         <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="space-y-1">
                               <Label className="text-[9px] uppercase">Motorista</Label>
                               <Select value={logisticsData.busca.driverId} onValueChange={(v)=>setLogisticsData(p=>({...p, busca: {...p.busca, driverId: v}}))}>
                                  <SelectTrigger className={cn(
                                    "h-8 text-xs",
                                    logisticsData.busca.active && !logisticsData.busca.driverId && "border-destructive text-destructive animate-pulse"
                                  )}>
                                    <SelectValue placeholder="SELECIONE" />
                                  </SelectTrigger>
                                  <SelectContent>
                                     {motoristas.map(m => <SelectItem key={m.id} value={m.id}>{m.display_name?.split(' ')[0]}</SelectItem>)}
                                  </SelectContent>
                               </Select>
                            </div>
                            <div className="space-y-1">
                               <Label className="text-[9px] uppercase">Hora</Label>
                               <Input 
                                  type="time" 
                                  className="h-8 text-xs" 
                                  value={logisticsData.busca.time}
                                  onChange={(e)=>setLogisticsData(p=>({...p, busca: {...p.busca, time: e.target.value}}))}
                                />
                            </div>
                         </div>
                       )}
                    </div>
                    
                    <div className="h-[1px] bg-border/50"></div>

                    {/* ENTREGA */}
                    <div className="space-y-2">
                       <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={logisticsData.entrega.active} 
                            onChange={() => setLogisticsData(p=>({...p, entrega: {...p.entrega, active: !p.entrega.active}}))}
                            className="rounded border-border text-primary"
                          />
                          <span className="font-bold uppercase text-[10px]">Agendar Entrega</span>
                       </div>
                       {logisticsData.entrega.active && (
                         <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="space-y-1">
                               <Label className="text-[9px] uppercase">Motorista</Label>
                               <Select value={logisticsData.entrega.driverId} onValueChange={(v)=>setLogisticsData(p=>({...p, entrega: {...p.entrega, driverId: v}}))}>
                                  <SelectTrigger className={cn(
                                    "h-8 text-xs",
                                    logisticsData.entrega.active && !logisticsData.entrega.driverId && "border-destructive text-destructive animate-pulse"
                                  )}>
                                    <SelectValue placeholder="SELECIONE" />
                                  </SelectTrigger>
                                  <SelectContent>
                                     {motoristas.map(m => <SelectItem key={m.id} value={m.id}>{m.display_name?.split(' ')[0]}</SelectItem>)}
                                  </SelectContent>
                               </Select>
                            </div>
                            <div className="space-y-1">
                               <Label className="text-[9px] uppercase">Hora</Label>
                               <Input 
                                  type="time" 
                                  className="h-8 text-xs" 
                                  value={logisticsData.entrega.time}
                                  onChange={(e)=>setLogisticsData(p=>({...p, entrega: {...p.entrega, time: e.target.value}}))}
                                />
                            </div>
                         </div>
                       )}
                    </div>
                  </div>
               </CardContent>
             )}
          </Card>

          <Button 
            className="w-full h-12 rounded-xl text-md font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95 group"
             onClick={() => {
               // Validação de profissionais obrigatórios
               const missingPro = cart.find(i => i.type === 'service' && (i.original as Service)?.requires_professional && !i.professional_id);
               if (missingPro) {
                 toast.error(`Informe o profissional para: ${missingPro.name}`);
                 return;
               }

               // Validação de motoristas obrigatórios na logística
               if (hasLogistics) {
                 if (logisticsData.busca.active && !logisticsData.busca.driverId) {
                   toast.error("Selecione o motorista para a Tele-Busca.");
                   return;
                 }
                 if (logisticsData.entrega.active && !logisticsData.entrega.driverId) {
                   toast.error("Selecione o motorista para a Entrega.");
                   return;
                 }
               }

               const remaining = total - paymentMethods.reduce((s,p)=>s+p.amount,0);
               paymentAmount.setValue(remaining > 0 ? remaining : 0);
               setCheckoutOpen(true);
             }}
             disabled={cart.length === 0}
          >
            PAGAMENTO
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>

      {/* MODAL: ABERTURA DE CAIXA */}
      <Dialog open={cashierModalOpen} onOpenChange={setCashierModalOpen}>
         <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-primary/20 shadow-2xl">
            <DialogHeader>
               <DialogTitle className="text-2xl font-black text-center text-primary uppercase">Abrir Caixa</DialogTitle>
               <DialogDescription className="text-center font-medium">Informe o saldo inicial para começar o dia.</DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
               <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">Fundo de Caixa (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground/50">R$</span>
                    <Input 
                      type="text" 
                      value={initialAmount.displayValue} 
                      onChange={initialAmount.handleChange}
                      className="h-12 text-2xl font-mono text-center font-bold bg-primary/5 border-primary/20 pl-10"
                      placeholder="0,00"
                    />
                  </div>
               </div>
               <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 space-y-1 text-center">
                  <Info className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-[10px] uppercase font-black leading-tight">Aviso de Segurança</p>
                  <p className="text-xs font-semibold">Toda abertura de caixa gera um log de auditoria vinculado ao seu usuário.</p>
               </div>
            </div>
             <DialogFooter className="sm:justify-center">
                <Button 
                   onClick={handleOpenCashier} 
                   disabled={isSubmitting}
                   className="w-full h-12 rounded-xl text-md font-bold uppercase tracking-wider shadow-lg"
                >
                   {isSubmitting ? "Processando..." : "Confirmar e Abrir"}
                </Button>
             </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* MODAL: PAGAMENTO / FINALIZAR VENDA */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
         <DialogContent className="max-w-2xl bg-card border-border shadow-2xl">
            <DialogHeader>
                <DialogTitle className="text-2xl font-black flex items-center gap-2">
                   <CreditCard className="w-7 h-7 text-primary" /> FINALIZAR VENDA
                </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                <div className="space-y-6">
                   <div className="bg-secondary/30 p-5 rounded-3xl border">
                      <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Total da Venda</p>
                      <p className="text-3xl font-black text-foreground">{formatCurrency(total)}</p>
                   </div>
                   
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <Label className="text-xs font-bold uppercase text-muted-foreground">Valor a Receber</Label>
                         <span className="text-[10px] font-mono font-bold text-primary">Restante: {formatCurrency(Math.max(0, total - paymentMethods.reduce((s,p)=>s+p.amount,0)))}</span>
                      </div>
                      <div className="relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground/50">R$</span>
                         <Input 
                           value={paymentAmount.displayValue} 
                           onChange={paymentAmount.handleChange}
                           className="h-12 text-2xl font-mono font-bold pl-10 bg-primary/5"
                         />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         {[
                           { id: 'cash', label: 'Dinheiro', icon: <Wallet className="w-4 h-4 mr-2" /> },
                           { id: 'pix', label: 'PIX', icon: null },
                           { id: 'credit_card', label: 'Crédito', icon: null },
                           { id: 'debit_card', label: 'Débito', icon: null }
                         ].map(m => (
                           <Button 
                              key={m.id} 
                              variant={selectedMethod === m.id ? "default" : "outline"} 
                              className={cn("h-11 font-bold rounded-xl transition-all", selectedMethod === m.id ? "shadow-md" : "hover:bg-primary/5")}
                              onClick={() => setSelectedMethod(m.id as any)}
                           >
                              {m.icon}
                              {m.label}
                           </Button>
                         ))}
                      </div>
                      <Button 
                        className="w-full h-10 font-bold bg-primary/20 text-primary hover:bg-primary hover:text-white border-primary/20" 
                        onClick={() => {
                          if (paymentAmount.rawValue <= 0) return;
                          setPaymentMethods([...paymentMethods, { method: selectedMethod, amount: paymentAmount.rawValue }]);
                          const remaining = total - (paymentMethods.reduce((s,p)=>s+p.amount,0) + paymentAmount.rawValue);
                          paymentAmount.setValue(remaining > 0 ? remaining : 0);
                        }}
                      >
                         <Plus className="w-4 h-4 mr-2" /> ADICIONAR PAGAMENTO
                      </Button>
                   </div>
                </div>

                <div className="space-y-4">
                   <Label className="text-xs font-bold uppercase text-muted-foreground">Extrato de Pagamento</Label>
                   <div className="min-h-[220px] bg-secondary/20 rounded-3xl border border-dashed border-primary/30 p-4 space-y-3">
                      {paymentMethods.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[180px] text-muted-foreground opacity-50">
                           <Calculator className="w-10 h-10 mb-2" />
                           <p className="text-[10px] font-bold uppercase">Aguardando pagamentos...</p>
                        </div>
                      ) : (
                        paymentMethods.map((p, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-background p-3 rounded-2xl shadow-sm border border-primary/5 group">
                             <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase text-primary">{p.method.replace('_', ' ')}</span>
                                <span className="text-base font-black">{formatCurrency(p.amount)}</span>
                             </div>
                             <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setPaymentMethods(paymentMethods.filter((_, i) => i !== idx))}>
                                <Trash2 className="w-3 h-3 text-destructive" />
                             </Button>
                          </div>
                        ))
                      )}
                   </div>
                   <div className="flex justify-between items-center px-4 pt-2">
                       <span className="text-xs font-medium text-muted-foreground">Pago: <span className="font-bold text-foreground">{formatCurrency(paymentMethods.reduce((s,p)=>s+p.amount,0))}</span></span>
                       <span className={cn(
                         "text-xs font-bold",
                         paymentMethods.reduce((s,p)=>s+p.amount,0) < total ? "text-destructive" : "text-green-500"
                       )}>
                          {paymentMethods.reduce((s,p)=>s+p.amount,0) < total ? `Restante: ${formatCurrency(total - paymentMethods.reduce((s,p)=>s+p.amount,0))}` : "VALOR PAGO"}
                       </span>
                   </div>
                </div>
            </div>
            <DialogFooter>
               <Button variant="outline" onClick={() => setCheckoutOpen(false)}>Voltar</Button>
               <Button 
                onClick={handleFinalizeSale} 
                disabled={loading || paymentMethods.reduce((s,p)=>s+p.amount,0) < total}
                className="rounded-xl font-bold px-8 shadow-xl shadow-primary/20"
               >
                 {loading ? "Finalizando..." : "CONFIRMAR VENDA"}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* MODAL: DESCONTO */}
      <Dialog open={discountModalOpen} onOpenChange={setDiscountModalOpen}>
         <DialogContent className="max-w-xs bg-card border-border shadow-2xl">
            <DialogHeader>
               <DialogTitle className="text-xl font-black uppercase">Aplicar Desconto</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
               <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Valor do Desconto</Label>
                  <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground/50">R$</span>
                     <Input 
                       value={discountInput.displayValue} 
                       onChange={discountInput.handleChange}
                       className="h-10 text-xl font-mono font-bold pl-10"
                       autoFocus
                     />
                  </div>
               </div>
            </div>
            <DialogFooter>
               <Button variant="outline" onClick={() => { discountInput.setValue(0); setDiscountModalOpen(false); }}>Remover</Button>
               <Button onClick={() => setDiscountModalOpen(false)} className="font-bold">Aplicar</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
};

export default PdvPage;
