import { useState, useCallback, useEffect } from "react";
import { Customer, Pet, Product } from "@/lib/crm-data";
import {
  fetchCustomers, fetchCustomersWithPets, addCustomer, updateCustomer, deleteCustomer,
  fetchPets, addPet, updatePet, deletePet,
  fetchProducts, addProduct, updateProduct, deleteProduct,
  findOrCreateProduct, startNewPurchaseCycle, addLancamento,
  serviceService, Service
} from "@/lib/crm-data";
import { toast } from "sonner";
import { useAuth } from "@/modules/auth/hooks/useAuth";

/**
 * ETAPA 5a: Custom Hook for Cadastros Data Management
 * Extracts all data state and CRUD operations from CadastrosPage
 * Single responsibility: data layer + callbacks
 */

interface UseCadastrosDataReturn {
  // State
  customers: Customer[];
  pets: Pet[];
  products: Product[];
  services: Service[];
  loading: boolean;

  // Handlers
  loadData: () => Promise<void>;
  handleSaveCliente: (customer: Omit<Customer, 'id'>, id?: string) => Promise<void>;
  handleDeleteCliente: (id: string) => Promise<void>;
  handleSavePet: (pet: Omit<Pet, 'id'>, id?: string, purchasesList?: { product_id: string, product_name: string, categoria: string, prazo_recompra: number, data_compra: string, valor: number }[]) => Promise<void>;
  handleDeletePet: (id: string) => Promise<void>;
  handleSaveProduto: (product: Omit<Product, 'id'>, id?: string) => Promise<void>;
  handleDeleteProduto: (id: string) => Promise<void>;
  handleSaveService: (service: Omit<Service, 'id' | 'created_at'>, id?: string) => Promise<void>;
  handleDeleteService: (id: string) => Promise<void>;
  handleSaveCadastroCompleto: (
    tutor: Omit<Customer, 'id'>,
    petsList: Omit<Pet, 'id' | 'customer_id'>[],
    purchasesList: { petIndex: number, product_id: string, product_name: string, categoria: string, prazo_recompra: number, data_compra: string, valor: number }[]
  ) => Promise<void>;

  // UI helpers
  setEditingCliente: (customer: Customer | null) => void;
  setEditingPet: (pet: Pet | null) => void;
  setEditingProduto: (product: Product | null) => void;
  setEditingService: (service: Service | null) => void;
  editingCliente: Customer | null;
  editingPet: Pet | null;
  editingProduto: Product | null;
  editingService: Service | null;
}

export function useCadastrosData(): UseCadastrosDataReturn {
  const { tenantId } = useAuth();
  // Data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editingCliente, setEditingCliente] = useState<Customer | null>(null);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [editingProduto, setEditingProduto] = useState<Product | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Helper: Converter strings vazias em null para campos de data
  const sanitizePetData = (pet: Omit<Pet, 'id'>) => ({
    ...pet,
    data_aniversario: pet.data_aniversario?.trim() ? pet.data_aniversario : null,
    peso: pet.peso ? Number(pet.peso) : null
  });

  // Load all data in parallel
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [c, p, prod, s] = await Promise.all([
        fetchCustomersWithPets(tenantId || undefined),
        fetchPets(),
        fetchProducts(),
        serviceService.fetchServices(tenantId || undefined)
      ]);
      setCustomers(c);
      setPets(p);
      setProducts(prod);
      setServices(s);
    } catch (error: any) {
      console.error("[CRM] Error loading cadastros:", error);
      toast.error(`Erro ao carregar dados: ${error?.message || "Erro desconhecido"}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---- Handlers: Clientes ----
  const handleSaveCliente = useCallback(async (customer: Omit<Customer, 'id'>, id?: string) => {
    try {
      if (id) {
        await updateCustomer(id, customer);
        toast.success("Tutor atualizado!");
      } else {
        await addCustomer(customer);
        toast.success("Tutor criado!");
      }
      setEditingCliente(null);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar cliente.");
    }
  }, [loadData]);

  const handleDeleteCliente = useCallback(async (id: string) => {
    if (!window.confirm("Tem certeza que deseja remover este tutor? Pets vinculados também serão removidos.")) return;

    try {
      await deleteCustomer(id);

      setCustomers(prev => prev.filter(c => c.id !== id));
      setPets(prev => prev.filter(p => p.customer_id !== id));

      toast.success("Tutor removido!");
    } catch (err: any) {
      console.error("[CRM] Erro ao remover tutor:", err);
      const msg = err.userMessage || err.message || "Erro inesperado";
      toast.error(`Falha: ${msg}`);
    }
  }, []);

  // ---- Handlers: Pets ----
  const handleSavePet = useCallback(async (
    pet: Omit<Pet, 'id'>,
    id?: string,
    purchasesList?: { product_id: string, product_name: string, categoria: string, prazo_recompra: number, data_compra: string, valor: number }[]
  ) => {
    try {
      const sanitized = sanitizePetData(pet);
      let targetPetId = id;

      if (id) {
        await updatePet(id, sanitized);
        toast.success("Pet atualizado!");
      } else {
        const newPet = await addPet(sanitized);
        if (!newPet || !newPet.id) throw new Error("Erro ao criar pet - sem ID");
        targetPetId = newPet.id;
        toast.success("Pet adicionado!");
      }

      // Se houver compras vinculadas (apenas para novos pets ou se explicitamente enviado)
      if (purchasesList && purchasesList.length > 0 && targetPetId) {
        console.log(`Salvando ${purchasesList.length} compras para o pet ${targetPetId}...`);
        for (const p of purchasesList) {
          if (!p.product_id && !p.product_name.trim()) continue;

          let productId = p.product_id;
          if (!productId) {
            const product = await findOrCreateProduct(p.product_name.trim(), p.categoria || null);
            if (product && product.id) productId = product.id;
          }

          if (productId) {
            await startNewPurchaseCycle(
              targetPetId,
              productId,
              p.data_compra,
              p.prazo_recompra,
              undefined,
              p.valor
            );
          }
        }
      }

      setEditingPet(null);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar pet.");
    }
  }, [loadData]);

  const handleDeletePet = useCallback(async (id: string) => {
    if (!window.confirm("Tem certeza que deseja remover este pet?")) return;
    try {
      await deletePet(id);

      // Atualização com novo array mapeado
      setPets(prev => prev.map(p => p.id === id ? { ...p, ativo: false } : p));

      toast.success("Pet removido!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover pet.");
    }
  }, []);

  // ---- Handlers: Produtos ----
  const handleSaveProduto = useCallback(async (product: Omit<Product, 'id'>, id?: string) => {
    try {
      if (id) {
        await updateProduct(id, product);
        toast.success("Produto atualizado!");
      } else {
        await addProduct(product);
        toast.success("Produto criado!");
      }
      setEditingProduto(null);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar produto.");
    }
  }, [loadData]);

  const handleDeleteProduto = useCallback(async (id: string) => {
    if (!window.confirm("Tem certeza que deseja remover este produto? O histórico de compras será mantido, mas não será possível vinculá-lo a novas.")) return;
    try {
      await deleteProduct(id);

      // Atualização de estado limpa usando map
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ativo: false } : p));

      toast.success("Produto removido!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover produto.");
    }
  }, []);

  // ---- Handlers: Serviços ----
  const handleSaveService = useCallback(async (service: Omit<Service, 'id' | 'created_at'>, id?: string) => {
    try {
      if (id) {
        await serviceService.updateService(id, service);
        toast.success("Serviço atualizado!");
      } else {
        await serviceService.addService(service);
        toast.success("Serviço criado!");
      }
      setEditingService(null);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar serviço.");
    }
  }, [loadData]);

  const handleDeleteService = useCallback(async (id: string) => {
    if (!window.confirm("Tem certeza que deseja remover este serviço?")) return;
    try {
      await serviceService.deleteService(id);
      setServices(prev => prev.map(s => s.id === id ? { ...s, ativo: false } : s));
      toast.success("Serviço removido!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover serviço.");
    }
  }, []);

  // ---- Handler: Cadastro Completo ----
  const handleSaveCadastroCompleto = useCallback(async (
    tutor: Omit<Customer, 'id'>,
    petsList: Omit<Pet, 'id' | 'customer_id'>[],
    purchasesList: { petIndex: number, product_id: string, product_name: string, categoria: string, prazo_recompra: number, data_compra: string, valor: number }[]
  ) => {
    try {
      console.log("=== Iniciando cadastro completo ===");
      console.log("Tutor:", tutor);
      console.log("Pets:", petsList);
      console.log("Compras:", purchasesList);

      // 1. Salvar Tutor
      console.log("Step 1: Salvando tutor...");
      const newCustomer = await addCustomer(tutor);
      if (!newCustomer || !newCustomer.id) {
        throw new Error("Tutor não foi criado corretamente - sem ID retornado");
      }
      console.log("✓ Tutor criado com ID:", newCustomer.id);

      // 2. Salvar Pets
      console.log("Step 2: Salvando pets...");
      const createdPets: Pet[] = [];
      for (let i = 0; i < petsList.length; i++) {
        const p = petsList[i];
        if (!p.nome.trim()) {
          console.warn(`Pet ${i} sem nome, pulando...`);
          continue;
        }
        console.log(`Salvando pet ${i + 1}/${petsList.length}:`, p.nome);
        const sanitized = sanitizePetData({ ...p, customer_id: newCustomer.id });
        const savedPet = await addPet(sanitized);
        if (savedPet && savedPet.id) {
          createdPets.push(savedPet);
          console.log(`✓ Pet "${p.nome}" criado com ID:`, savedPet.id);
        } else {
          console.error(`Erro ao salvar pet ${p.nome} - sem ID retornado`);
          throw new Error(`Pet "${p.nome}" não foi criado corretamente`);
        }
      }
      console.log(`✓ ${createdPets.length} pets criados`);

      if (createdPets.length === 0 && petsList.length > 0) {
        throw new Error("Nenhum pet foi criado com sucesso");
      }

      // 3. Salvar Compras
      console.log("Step 3: Salvando compras recorrentes...");
      let comprasCount = 0;
      for (let i = 0; i < purchasesList.length; i++) {
        const purchase = purchasesList[i];

        // Skip empty purchases
        if (!purchase.product_id && !purchase.product_name.trim()) {
          console.log(`Compra ${i} vazia, pulando...`);
          continue;
        }

        console.log(`Processando compra ${i + 1}/${purchasesList.length}...`);

        // Validar índice do pet
        if (purchase.petIndex < 0 || purchase.petIndex >= createdPets.length) {
          throw new Error(`Índice de pet inválido (${purchase.petIndex}) na compra ${i + 1}. Apenas ${createdPets.length} pets criados.`);
        }

        const targetPet = createdPets[purchase.petIndex];
        if (!targetPet || !targetPet.id) {
          throw new Error(`Pet inválido para compra recorrente ${i + 1} (índice ${purchase.petIndex})`);
        }
        console.log(`Compra vinculada ao pet: ${targetPet.nome} (ID: ${targetPet.id})`);

        // Validar prazo de recompra
        if (!purchase.prazo_recompra || purchase.prazo_recompra < 1) {
          throw new Error(`Compra ${i + 1}: Prazo de recompra inválido (${purchase.prazo_recompra}). Deve ser mínimo 1 dia.`);
        }
        console.log(`Prazo de recompra: ${purchase.prazo_recompra} dias`);

        // Validar data de compra
        if (!purchase.data_compra) {
          throw new Error(`Compra ${i + 1}: Data da compra não informada`);
        }
        console.log(`Data da compra: ${purchase.data_compra}`);

        // Resolve product_id: use existing or create new
        let productId = purchase.product_id;
        let productName = purchase.product_name;

        if (!productId) {
          if (!productName.trim()) {
            throw new Error(`Compra ${i + 1}: Produto não informado`);
          }
          console.log(`Procurando/criando produto: ${productName}...`);
          const product = await findOrCreateProduct(productName.trim(), purchase.categoria || null);
          if (!product || !product.id) {
            throw new Error(`Falha ao criar/encontrar produto "${productName}"`);
          }
          productId = product.id;
          console.log(`✓ Produto encontrado/criado com ID: ${productId}`);
        }

        // Salvar ciclo de compra com prazo_recompra explícito
        // (Não registramos lançamentos financeiros aqui; faturamento é controlado diariamente)
        console.log(`Criando ciclo de compra para pet ${targetPet.nome}...`);
        await startNewPurchaseCycle(
          targetPet.id,
          productId,
          purchase.data_compra,
          purchase.prazo_recompra,
          undefined, // diasAvisoPrevio (será pego do produto ou fallback 3)
          purchase.valor
        );

        comprasCount++;
        console.log(`✓ Compra ${i + 1} criada com sucesso`);
      }

      console.log(`✓ ${comprasCount} compras criadas`);
      console.log("=== Cadastro completo salvo com sucesso ===");

      // Recarregar dados
      console.log("Recarregando dados...");
      await loadData();
      console.log("✓ Dados recarregados");

    } catch (err: any) {
      console.error("❌ Erro ao salvar cadastro completo:", err);
      console.error("Stack:", err.stack);
      throw new Error(err.message || "Erro desconhecido ao salvar cadastro completo");
    }
  }, [loadData]);

  return {
    // State
    customers,
    pets,
    products,
    services,
    loading,

    // Handlers
    loadData,
    handleSaveCliente,
    handleDeleteCliente,
    handleSavePet,
    handleDeletePet,
    handleSaveProduto,
    handleDeleteProduto,
    handleSaveService,
    handleDeleteService,
    handleSaveCadastroCompleto,

    // Edit state
    setEditingCliente,
    setEditingPet,
    setEditingProduto,
    setEditingService,
    editingCliente,
    editingPet,
    editingProduto,
    editingService
  };
}
