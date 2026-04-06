import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";

interface WizardFooterProps {
  step: number;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
}

/**
 * ETAPA 6d: WizardFooter - Navigation Footer
 * Shows context-appropriate buttons based on current step
 * ~40 lines of conditional rendering
 */

export function WizardFooter({
  step,
  loading,
  onBack,
  onNext,
  onSave,
  onCancel
}: WizardFooterProps) {
  const isFirstStep = step === 1;
  const isLastStep = step === 3;

  return (
    <div className="flex gap-3 justify-between">
      {/* Left: Cancel / Back */}
      <div>
        {isFirstStep ? (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            <X size={16} className="mr-2" />
            Cancelar
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={onBack}
            disabled={loading}
          >
            <ArrowLeft size={16} className="mr-2" />
            Voltar
          </Button>
        )}
      </div>

      {/* Right: Next / Save */}
      <Button
        onClick={isLastStep ? onSave : onNext}
        disabled={loading}
        className="bg-primary hover:bg-primary/90"
      >
        {isLastStep ? (
          <>
            <Check size={16} className="mr-2" />
            {loading ? 'Salvando...' : 'Salvar e Finalizar'}
          </>
        ) : (
          <>
            <ArrowRight size={16} className="mr-2" />
            Próximo
          </>
        )}
      </Button>
    </div>
  );
}
