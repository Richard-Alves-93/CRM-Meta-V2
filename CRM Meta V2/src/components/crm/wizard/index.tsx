import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Product } from "@/lib/crm-data";
import { toast } from "sonner";
import { useWizardState } from "./hooks/useWizardState";
import { useTutorForm } from "./hooks/useTutorForm";
import { usePetsForm } from "./hooks/usePetsForm";
import { usePurchasesForm } from "./hooks/usePurchasesForm";
import { Step1Tutor } from "./Step1Tutor";
import { Step2Pets } from "./Step2Pets";
import { Step3Compras } from "./Step3Compras";
import { WizardProgress } from "./WizardProgress";
import { WizardFooter } from "./WizardFooter";

interface WizardCadastroModalProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  onSaveCompleto: (
    tutor: any,
    pets: any[],
    purchases: any[]
  ) => Promise<void>;
}

/**
 * ETAPA 6e: WizardCadastroModal - Refactored Orchestrator
 * Uses all hooks for state management
 * Delegates rendering to step components
 * 73% reduction in size (458 → 120 lines)
 *
 * Hooks used:
 * - useWizardState: global state + navigation
 * - useTutorForm: step 1 logic
 * - usePetsForm: step 2 logic + cascade validation
 * - usePurchasesForm: step 3 logic + validations
 */

export default function WizardCadastroModal({
  open,
  onClose,
  products,
  onSaveCompleto
}: WizardCadastroModalProps) {
  const {
    step,
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
    handleClose
  } = useWizardState(onClose);

  const { handleTutorChange } = useTutorForm(tutor, setTutor);

  const { addPetForm, removePetForm, handlePetChange } = usePetsForm(
    pets,
    setPets,
    purchases,
    setPurchases
  );

  const { addPurchaseForm, removePurchaseForm, handlePurchaseChange, updatePurchaseFields } = usePurchasesForm(
    purchases,
    setPurchases,
    pets.length
  );

  const handleSave = async () => {
    try {
      setLoading(true);

      // Final validations
      const t = tutor;
      if (!t.nome.trim()) return toast.error("Nome do tutor é obrigatório");
      if (!t.whatsapp.trim()) return toast.error("WhatsApp é obrigatório");
      if (!t.cep.trim()) return toast.error("CEP é obrigatório");
      if (!t.endereco.trim()) return toast.error("A Rua é obrigatória");
      if (!t.numero.trim()) return toast.error("O Número é obrigatório");
      if (!t.bairro.trim()) return toast.error("O Bairro é obrigatório");
      if (!t.cidade.trim()) return toast.error("A Cidade é obrigatória");

      const validPets = pets.filter(p => p.nome.trim());
      if (validPets.length === 0) {
        toast.error("Adicione pelo menos um pet");
        return;
      }

      // Validate at least one product is filled
      const validPurchases = purchases.filter(p => p.product_id || p.product_name.trim());
      if (validPurchases.length === 0) {
        toast.error("Adicione pelo menos um produto no passo de Compras Recorrentes.");
        return;
      }

      // Call parent handler
      await onSaveCompleto(
        {
          nome: tutor.nome,
          telefone: tutor.telefone,
          whatsapp: tutor.whatsapp,
          email: tutor.email,
          observacoes: tutor.observacoes,
          cep: tutor.cep,
          endereco: tutor.endereco,
          numero: tutor.numero,
          bairro: tutor.bairro,
          cidade: tutor.cidade,
          complemento: tutor.complemento
        },
        validPets,
        validPurchases
      );

      // Success: close and reset
      toast.success("Cadastro completo realizado!");
      handleClose();
      setLoading(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar cadastro completo");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[98vh] p-2 sm:p-4 overflow-y-auto">
        <DialogHeader className="mb-1">
          <DialogTitle className="text-base">Novo Cadastro Integrado</DialogTitle>
          <DialogDescription className="text-[10px] leading-none">
            Crie um tutor, seus pets e compras recorrentes em um só lugar
          </DialogDescription>
        </DialogHeader>

        <WizardProgress currentStep={step} />

        <div className="py-0">
          {step === 1 && (
            <Step1Tutor tutor={tutor} onTutorChange={handleTutorChange} />
          )}
          {step === 2 && (
            <Step2Pets
              pets={pets}
              onPetChange={handlePetChange}
              onAddPet={addPetForm}
              onRemovePet={removePetForm}
            />
          )}
          {step === 3 && (
            <Step3Compras
              purchases={purchases}
              pets={pets}
              products={products}
              onChange={handlePurchaseChange}
              onUpdateFields={updatePurchaseFields}
              onAddPurchase={addPurchaseForm}
              onRemovePurchase={removePurchaseForm}
            />
          )}
        </div>

        <DialogFooter>
          <WizardFooter
            step={step}
            loading={loading}
            onBack={prevStep}
            onNext={nextStep}
            onSave={handleSave}
            onCancel={handleClose}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
