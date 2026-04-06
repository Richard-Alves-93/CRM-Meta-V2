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
      if (!tutor.nome.trim()) {
        toast.error("Nome do tutor é obrigatório");
        return;
      }

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
          observacoes: tutor.observacoes
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Cadastro Integrado</DialogTitle>
          <DialogDescription>
            Crie um tutor, seus pets e compras recorrentes em um só lugar
          </DialogDescription>
        </DialogHeader>

        <WizardProgress currentStep={step} />

        <div className="py-4 min-h-[300px]">
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
