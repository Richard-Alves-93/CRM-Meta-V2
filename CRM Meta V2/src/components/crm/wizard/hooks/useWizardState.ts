import { useState, useCallback } from "react";
import { Customer, Pet } from "@/lib/crm-data";
import { toast } from "sonner";
import { format } from "date-fns";

/**
 * ETAPA 6a: useWizardState - Global Wizard State Management
 * Manages step navigation and all form data
 * Single source of truth for wizard state
 */

export interface WizardTutor {
  nome: string;
  telefone: string;
  whatsapp: string;
  email: string;
  observacoes: string;
}

export interface WizardPet {
  nome: string;
  especie: string;
  raca: string;
  data_aniversario: string;
  sexo: string;
  porte: string;
  peso: string;
}

export interface WizardPurchase {
  petIndex: number;
  product_id: string;
  product_name: string;
  categoria: string;
  prazo_recompra: number;
  data_compra: string;
  valor: number;
}

const INITIAL_TUTOR: WizardTutor = {
  nome: '',
  telefone: '',
  whatsapp: '',
  email: '',
  observacoes: ''
};

const INITIAL_PET: WizardPet = {
  nome: '',
  especie: '',
  raca: '',
  data_aniversario: '',
  sexo: '',
  porte: '',
  peso: ''
};

const INITIAL_PURCHASE: WizardPurchase = {
  petIndex: 0,
  product_id: '',
  product_name: '',
  categoria: '',
  prazo_recompra: 30,
  data_compra: format(new Date(), 'yyyy-MM-dd'),
  valor: 0
};

export function useWizardState(onClose: () => void) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tutor, setTutor] = useState<WizardTutor>(INITIAL_TUTOR);
  const [pets, setPets] = useState<WizardPet[]>([INITIAL_PET]);
  const [purchases, setPurchases] = useState<WizardPurchase[]>([INITIAL_PURCHASE]);

  const resetForm = useCallback(() => {
    setStep(1);
    setTutor(INITIAL_TUTOR);
    setPets([INITIAL_PET]);
    setPurchases([INITIAL_PURCHASE]);
  }, []);

  const handleClose = useCallback(() => {
    if (!loading) {
      resetForm();
      onClose();
    }
  }, [loading, resetForm, onClose]);

  const nextStep = useCallback(() => {
    // Validar step 1
    if (step === 1) {
      if (!tutor.nome.trim()) {
        toast.error("O nome do tutor é obrigatório.");
        return;
      }
      if (!tutor.whatsapp.trim()) {
        toast.error("O WhatsApp do tutor é obrigatório.");
        return;
      }
    }

    // Validar step 2
    if (step === 2) {
      const invalidPet = pets.find(p =>
        !p.nome.trim() ||
        !p.especie ||
        !p.raca.trim() ||
        !p.sexo ||
        !p.porte
      );

      if (invalidPet) {
        toast.error("Nome, Espécie, Raça, Sexo e Porte são obrigatórios para todos os pets.");
        return;
      }
    }

    setStep(s => s + 1);
  }, [step, tutor, pets]);

  const prevStep = useCallback(() => {
    setStep(s => s - 1);
  }, []);

  return {
    step,
    setStep,
    loading,
    setLoading,
    tutor,
    setTutor,
    pets,
    setPets,
    purchases,
    setPurchases,
    nextStep,
    prevStep,
    resetForm,
    handleClose
  };
}
