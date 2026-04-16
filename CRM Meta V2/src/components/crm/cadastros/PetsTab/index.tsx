import { useState, useMemo } from "react";
import { Pet, Customer, Product } from "@/lib/crm-data";
import { Plus, Search } from "lucide-react";
import PetModal from "../../PetModal";
import { PetsTable } from "./PetsTable";
import { Input } from "@/components/ui/input";

interface PetsTabProps {
  pets: Pet[];
  customers: Customer[];
  products: Product[];
  loading: boolean;
  onSavePet: (pet: Omit<Pet, 'id'>, id?: string, purchasesList?: any[]) => Promise<void>;
  onDeletePet: (id: string) => Promise<void>;
}

/**
 * ETAPA 5c: PetsTab - Tab Container for Pets
 */

export function PetsTab({
  pets,
  customers,
  products,
  loading,
  onSavePet,
  onDeletePet
}: PetsTabProps) {
  const [petModalOpen, setPetModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [search, setSearch] = useState("");

  const filteredPets = useMemo(() => {
    if (!search.trim()) return pets;
    const term = search.toLowerCase();
    
    return pets.filter(p => {
      const petMatch = p.nome.toLowerCase().includes(term) ||
                       p.especie?.toLowerCase().includes(term) ||
                       p.raca?.toLowerCase().includes(term);
                       
      const tutorName = customers.find(c => c.id === p.customer_id)?.nome?.toLowerCase() || "";
      const tutorMatch = tutorName.includes(term);
      
      return petMatch || tutorMatch;
    });
  }, [pets, search, customers]);

  const handleOpenModal = (pet?: Pet) => {
    if (pet) {
      setEditingPet(pet);
    } else {
      setEditingPet(null);
    }
    setPetModalOpen(true);
  };

  const handleCloseModal = () => {
    setPetModalOpen(false);
    setEditingPet(null);
  };

  const handleSave = async (pet: Omit<Pet, 'id'>, purchasesList?: any[]) => {
    await onSavePet(pet, editingPet?.id, purchasesList);
    handleCloseModal();
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Lista de Pets</h2>
          <p className="text-sm text-muted-foreground">{filteredPets.length} pets encontrados</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Nome do pet, tutor ou raça..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <Plus size={16} /> Adicionar Pet
          </button>
        </div>
      </div>

      <PetsTable
        pets={filteredPets}
        customers={customers}
        loading={loading}
        onEdit={handleOpenModal}
        onDelete={onDeletePet}
      />

      <PetModal
        open={petModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        editingPet={editingPet}
        customers={customers}
        products={products}
      />
    </>
  );
}
