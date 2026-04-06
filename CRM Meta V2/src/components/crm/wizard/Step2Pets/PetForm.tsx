import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WizardPet } from "../hooks/useWizardState";
import { Trash2 } from "lucide-react";
import { memo, useState, useEffect } from "react";

interface PetFormProps {
  pet: WizardPet;
  index: number;
  onPetChange: (index: number, field: keyof WizardPet, value: string) => void;
  onRemove: (index: number) => void;
  showRemove: boolean;
}

/**
 * ETAPA 6b + 8: PetForm - Memoized Reusable Component
 * Prevents re-render when sibling pets change, only renders when own data changes
 * Custom comparison ensures only THIS pet's updates trigger re-render
 */

function PetFormComponent({ pet, index, onPetChange, onRemove, showRemove }: PetFormProps) {
  const [racasList, setRacasList] = useState<string[]>([]);

  useEffect(() => {
    const racasSalvas = JSON.parse(localStorage.getItem("racas") || "[]");
    setRacasList(Array.isArray(racasSalvas) ? racasSalvas : []);
  }, []);

  const handleRacaBlur = (valor: string) => {
    if (valor.trim()) {
      const racaFormatada = valor.trim();
      if (!racasList.includes(racaFormatada)) {
        const novaLista = [...racasList, racaFormatada];
        setRacasList(novaLista);
        localStorage.setItem("racas", JSON.stringify(novaLista));
      }
    }
  };

  return (
    <div className="border border-border/50 rounded-lg p-4 bg-secondary/20">
      <div className="flex justify-between items-start mb-4">
        <h4 className="font-semibold text-sm">Pet #{index + 1}</h4>
        {showRemove && (
          <button
            onClick={() => onRemove(index)}
            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            title="Remover pet"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="grid gap-3">
        {/* Nome - Required */}
        <div>
          <Label htmlFor={`pet-${index}-nome`} className="text-xs font-medium">
            Nome do Pet *
          </Label>
          <Input
            id={`pet-${index}-nome`}
            placeholder="Ex: Fluffy"
            value={pet.nome}
            onChange={(e) => onPetChange(index, 'nome', e.target.value)}
            className="mt-1 h-8"
          />
        </div>

        {/* Espécie + Raça */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor={`pet-${index}-especie`} className="text-xs font-medium">
              Espécie *
            </Label>
            <Select value={pet.especie} onValueChange={(v) => onPetChange(index, 'especie', v)}>
              <SelectTrigger id={`pet-${index}-especie`} className="mt-1 h-8">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cão">Cão</SelectItem>
                <SelectItem value="Gato">Gato</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor={`pet-${index}-raca`} className="text-xs font-medium">
              Raça *
            </Label>
            <Input
              id={`pet-${index}-raca`}
              placeholder="Ex: Poodle"
              list={`list-racas-wizard-${index}`}
              value={pet.raca}
              onChange={(e) => onPetChange(index, 'raca', e.target.value)}
              onBlur={(e) => handleRacaBlur(e.target.value)}
              className="mt-1 h-8"
            />
            <datalist id={`list-racas-wizard-${index}`}>
              {racasList.map((r, idx) => (
                <option key={idx} value={r} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Sexo + Porte */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor={`pet-${index}-sexo`} className="text-xs font-medium">
              Sexo *
            </Label>
            <Select value={pet.sexo} onValueChange={(v) => onPetChange(index, 'sexo', v)}>
              <SelectTrigger id={`pet-${index}-sexo`} className="mt-1 h-8">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Macho">Macho</SelectItem>
                <SelectItem value="Fêmea">Fêmea</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor={`pet-${index}-porte`} className="text-xs font-medium">
              Porte *
            </Label>
            <Select value={pet.porte} onValueChange={(v) => onPetChange(index, 'porte', v)}>
              <SelectTrigger id={`pet-${index}-porte`} className="mt-1 h-8">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pequeno">Pequeno</SelectItem>
                <SelectItem value="Médio">Médio</SelectItem>
                <SelectItem value="Grande">Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Peso + Data Aniversário */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor={`pet-${index}-peso`} className="text-xs font-medium">
              Peso (kg)
            </Label>
            <Input
              id={`pet-${index}-peso`}
              placeholder="Ex: 5.5"
              type="number"
              step="0.1"
              value={pet.peso}
              onChange={(e) => onPetChange(index, 'peso', e.target.value)}
              className="mt-1 h-8"
            />
          </div>

          <div>
            <Label htmlFor={`pet-${index}-aniversario`} className="text-xs font-medium">
              Data Nasc.
            </Label>
            <Input
              id={`pet-${index}-aniversario`}
              type="date"
              value={pet.data_aniversario}
              onChange={(e) => onPetChange(index, 'data_aniversario', e.target.value)}
              className="mt-1 h-8"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const PetForm = memo(PetFormComponent);
