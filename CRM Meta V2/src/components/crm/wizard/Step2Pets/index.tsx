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
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <PawPrint className="w-4 h-4" /> Seus Pets
          </h3>
          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
            {pets.length} {pets.length === 1 ? 'Pet' : 'Pets'}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          💡 Todos os pets devem ter pelo menos o nome preenchido
        </p>
      </div>

      <div className="space-y-2">
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
        size="sm"
        className="w-full h-8 text-xs border-dashed"
      >
        <Plus size={14} className="mr-2" />
        Adicionar Outro Pet
      </Button>
    </div>
  );
}
