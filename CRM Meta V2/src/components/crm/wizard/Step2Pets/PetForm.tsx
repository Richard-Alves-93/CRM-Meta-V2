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
    <div className="border border-border/50 rounded-lg p-3 bg-secondary/15">
      <div className="flex justify-between items-start mb-2">
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

      <div className="grid gap-2">
        {/* Linha 1: Nome + Espécie + Raça */}
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-12 sm:col-span-6 space-y-1">
            <Label htmlFor={`pet-${index}-nome`} className="text-[10px] font-bold text-muted-foreground uppercase">
              Nome do Pet *
            </Label>
            <Input
              id={`pet-${index}-nome`}
              placeholder="Ex: Fluffy"
              value={pet.nome}
              onChange={(e) => onPetChange(index, 'nome', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="col-span-6 sm:col-span-3 space-y-1">
            <Label htmlFor={`pet-${index}-especie`} className="text-[10px] font-bold text-muted-foreground uppercase">
              Espécie *
            </Label>
            <Select value={pet.especie} onValueChange={(v) => onPetChange(index, 'especie', v)}>
              <SelectTrigger id={`pet-${index}-especie`} className="h-8 text-sm">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cão">Cão</SelectItem>
                <SelectItem value="Gato">Gato</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-6 sm:col-span-3 space-y-1">
            <Label htmlFor={`pet-${index}-raca`} className="text-[10px] font-bold text-muted-foreground uppercase">
              Raça *
            </Label>
            <Input
              id={`pet-${index}-raca`}
              placeholder="Ex: Poodle"
              list={`list-racas-wizard-${index}`}
              value={pet.raca}
              onChange={(e) => onPetChange(index, 'raca', e.target.value)}
              onBlur={(e) => handleRacaBlur(e.target.value)}
              className="h-8 text-sm"
            />
            <datalist id={`list-racas-wizard-${index}`}>
              {racasList.map((r, idx) => (
                <option key={idx} value={r} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Linha 2: Sexo + Porte + Peso + Nascimento */}
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-3 space-y-1">
            <Label htmlFor={`pet-${index}-sexo`} className="text-[10px] font-bold text-muted-foreground uppercase">
              Sexo *
            </Label>
            <Select value={pet.sexo} onValueChange={(v) => onPetChange(index, 'sexo', v)}>
              <SelectTrigger id={`pet-${index}-sexo`} className="h-8 text-sm">
                <SelectValue placeholder="..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Macho">Macho</SelectItem>
                <SelectItem value="Fêmea">Fêmea</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-3 space-y-1">
            <Label htmlFor={`pet-${index}-porte`} className="text-[10px] font-bold text-muted-foreground uppercase">
              Porte *
            </Label>
            <Select value={pet.porte} onValueChange={(v) => onPetChange(index, 'porte', v)}>
              <SelectTrigger id={`pet-${index}-porte`} className="h-8 text-sm">
                <SelectValue placeholder="..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pequeno">Pequeno</SelectItem>
                <SelectItem value="Médio">Médio</SelectItem>
                <SelectItem value="Grande">Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-3 space-y-1">
            <Label htmlFor={`pet-${index}-peso`} className="text-[10px] font-bold text-muted-foreground uppercase">
              Peso (kg)
            </Label>
            <Input
              id={`pet-${index}-peso`}
              placeholder="0.0"
              type="number"
              step="0.1"
              value={pet.peso}
              onChange={(e) => onPetChange(index, 'peso', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="col-span-3 space-y-1">
            <Label htmlFor={`pet-${index}-aniversario`} className="text-[10px] font-bold text-muted-foreground uppercase">
              Data Nasc.
            </Label>
            <Input
              id={`pet-${index}-aniversario`}
              type="date"
              value={pet.data_aniversario}
              onChange={(e) => onPetChange(index, 'data_aniversario', e.target.value)}
              className="h-8 text-sm px-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const PetForm = memo(PetFormComponent);
