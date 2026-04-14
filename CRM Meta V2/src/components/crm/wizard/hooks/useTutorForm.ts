import { useCallback } from "react";
import { WizardTutor } from "./useWizardState";

/**
 * ETAPA 6a: useTutorForm - Step 1 Logic
 * Handles tutor form updates and validation
 */

export function useTutorForm(tutor: WizardTutor, setTutor: React.Dispatch<React.SetStateAction<WizardTutor>>) {
  const handleTutorChange = useCallback((field: keyof WizardTutor, value: string) => {
    setTutor(prev => ({
      ...prev,
      [field]: value
    }));
  }, [setTutor]);

  const validateTutor = useCallback(() => {
    return tutor.nome.trim() !== '';
  }, [tutor.nome]);

  return { handleTutorChange, validateTutor };
}
