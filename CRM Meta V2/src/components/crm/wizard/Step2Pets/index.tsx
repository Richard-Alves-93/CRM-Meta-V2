import { Button } from "@/components/ui/button";
import { WizardPet } from "../hooks/useWizardState";
import { PetForm } from "./PetForm";
import { Plus, PawPrint } from "lucide-react";

interface Step2PetsProps {
  pets: WizardPet[];
  onPetChange: (index: number, field: keyof WizardPet, value: string) => void;
  onAddPet: () => void;
  onRemovePet: (index: number) => void;
}

/**
 * ETAPA 6b: Step2Pets - Container for Pets
 * Renders list of pet forms with add button
 * ~50 lines of clean orchestration
 */

export function Step2Pets({ pets, onPetChange, onAddPet, onRemovePet }: Step2PetsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <PawPrint className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Seus Pets</h3>
          <p className="text-sm text-muted-foreground">Adicione os pets deste tutor</p>
        </div>
      </div>

      <div className="space-y-3">
        {pets.map((pet, idx) => (
          <PetForm
            key={idx}
            pet={pet}
            index={idx}
            onPetChange={onPetChange}
            onRemove={onRemovePet}
            showRemove={pets.length > 1}
          />
        ))}
      </div>

      <Button
        onClick={onAddPet}
        variant="outline"
        className="w-full"
      >
        <Plus size={16} className="mr-2" />
        Adicionar Outro Pet
      </Button>

      <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
        💡 Todos os pets devem ter pelo menos o nome preenchido
      </div>
    </div>
  );
}
