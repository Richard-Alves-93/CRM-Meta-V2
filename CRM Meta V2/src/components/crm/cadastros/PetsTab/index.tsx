import { useState } from "react";
import { Pet, Customer, Product } from "@/lib/crm-data";
import { Plus } from "lucide-react";
import PetModal from "../../PetModal";
import { PetsTable } from "./PetsTable";

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
 * Manages modal state and coordinates between table and modal
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-foreground">Lista de Pets</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Adicionar Pet
        </button>
      </div>

      <PetsTable
        pets={pets}
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
