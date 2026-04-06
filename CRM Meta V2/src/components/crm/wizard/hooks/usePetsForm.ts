import { useCallback } from "react";
import { WizardPet, WizardPurchase } from "./useWizardState";

/**
 * ETAPA 6a: usePetsForm - Step 2 Logic
 * Handles pet list operations and validation
 * Critical: adjusts purchase indices when pets are removed
 */

export function usePetsForm(
  pets: WizardPet[],
  setPets: (pets: WizardPet[]) => void,
  purchases: WizardPurchase[],
  setPurchases: (purchases: WizardPurchase[]) => void
) {
  const addPetForm = useCallback(() => {
    const newPet: WizardPet = {
      nome: '',
      especie: '',
      raca: '',
      data_aniversario: '',
      sexo: '',
      porte: '',
      peso: ''
    };
    setPets([...pets, newPet]);
  }, [pets, setPets]);

  const removePetForm = useCallback((index: number) => {
    // Remove pet from list
    const newPets = pets.filter((_, i) => i !== index);
    setPets(newPets);

    // Adjust purchase pet indices: remove purchases for this pet, shift others up
    const newPurchases = purchases
      .filter(p => p.petIndex !== index)  // Remove purchases for this pet
      .map(p => ({
        ...p,
        petIndex: p.petIndex > index ? p.petIndex - 1 : p.petIndex  // Shift indices down
      }));
    setPurchases(newPurchases);
  }, [pets, setPets, purchases, setPurchases]);

  const handlePetChange = useCallback((index: number, field: keyof WizardPet, value: string) => {
    const newPets = [...pets];
    newPets[index] = {
      ...newPets[index],
      [field]: value
    };
    setPets(newPets);
  }, [pets, setPets]);

  const validatePets = useCallback(() => {
    return pets.every(p => p.nome.trim() !== '');
  }, [pets]);

  return { addPetForm, removePetForm, handlePetChange, validatePets };
}
