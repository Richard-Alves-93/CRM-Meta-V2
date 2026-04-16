import { useState, useMemo } from "react";
import { Customer } from "@/lib/crm-data";
import { Plus, Search } from "lucide-react";
import ClienteModal from "../../ClienteModal";
import { ClientesTable } from "./ClientesTable";
import { Input } from "@/components/ui/input";
import { TutorActionModal } from "./TutorActionModal";
import PetModal from "../../PetModal";
import { Pet, Product } from "@/lib/crm-data";

interface ClientesTabProps {
  customers: Customer[];
  pets: Pet[];
  products: Product[];
  loading: boolean;
  onWizardOpen: () => void;
  onSaveCliente: (customer: Omit<Customer, 'id'>, id?: string) => Promise<void>;
  onDeleteCliente: (id: string) => Promise<void>;
  onSavePet: (pet: Omit<Pet, 'id'>, id?: string, purchasesList?: any[]) => Promise<void>;
}

/**
 * ETAPA 5b: ClientesTab - Tab Container for Clientes
 */

export function ClientesTab({
  customers,
  pets,
  products,
  loading,
  onWizardOpen,
  onSaveCliente,
  onDeleteCliente,
  onSavePet
}: ClientesTabProps) {
  const [clienteModalOpen, setClienteModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");

  const [tutorModalOpen, setTutorModalOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<(Customer & { pets?: Pet[] }) | null>(null);
  
  const [petModalOpen, setPetModalOpen] = useState(false);
  const [preSelectedCustomerId, setPreSelectedCustomerId] = useState<string | null>(null);

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    
    const term = search.toLowerCase();
    return customers.filter(c => {
      const tutorMatch = c.nome.toLowerCase().includes(term) || 
                         (c.whatsapp?.includes(term)) ||
                         (c.telefone?.includes(term));
      
      const petMatch = (c as any).pets?.some((p: any) => 
        p.nome.toLowerCase().includes(term)
      );
      
      return tutorMatch || petMatch;
    });
  }, [customers, search]);

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCliente(customer);
    } else {
      setEditingCliente(null);
    }
    setClienteModalOpen(true);
  };

  const handleOpenTutorModal = (customer: Customer) => {
    const customerPets = pets.filter(p => p.customer_id === customer.id && p.ativo !== false);
    setSelectedTutor({ ...customer, pets: customerPets });
    setTutorModalOpen(true);
  };

  const handleAddPetForTutor = (customerId: string) => {
    setPreSelectedCustomerId(customerId);
    setPetModalOpen(true);
    setTutorModalOpen(false);
  };

  const handleEditTutorFromModal = (customer: Customer) => {
    setTutorModalOpen(false);
    handleOpenModal(customer);
  };

  const handleCloseModal = () => {
    setClienteModalOpen(false);
    setEditingCliente(null);
  };

  const handleSave = async (customer: Omit<Customer, 'id'>) => {
    await onSaveCliente(customer, editingCliente?.id);
    handleCloseModal();
  };

  const handleSavePet = async (pet: Omit<Pet, 'id'>, purchasesList?: any[]) => {
    await onSavePet(pet, undefined, purchasesList);
    setPetModalOpen(false);
    setPreSelectedCustomerId(null);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Lista de Tutores</h2>
          <p className="text-sm text-muted-foreground">{filteredCustomers.length} tutores encontrados</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Nome do tutor, pet ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          <button
            onClick={onWizardOpen}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <Plus size={16} /> Novo Cadastro Completo
          </button>
        </div>
      </div>

      <ClientesTable
        customers={filteredCustomers}
        loading={loading}
        onEdit={handleOpenModal}
        onDelete={onDeleteCliente}
        onAttend={handleOpenTutorModal}
      />

      <ClienteModal
        open={clienteModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        editingCustomer={editingCliente}
      />

      <TutorActionModal
        open={tutorModalOpen}
        onClose={() => setTutorModalOpen(false)}
        customer={selectedTutor}
        onEditTutor={handleEditTutorFromModal}
        onAddPet={handleAddPetForTutor}
      />

      <PetModal
        open={petModalOpen}
        onClose={() => setPetModalOpen(false)}
        onSave={handleSavePet}
        customers={customers}
        products={products}
        editingPet={null}
        // Podemos passar o customer_id inicial se o PetModal suportar
        initialCustomerId={preSelectedCustomerId || undefined}
      />
    </>
  );
}
