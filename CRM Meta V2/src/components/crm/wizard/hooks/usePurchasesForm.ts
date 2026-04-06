import { useCallback } from "react";
import { WizardPurchase } from "./useWizardState";
import { format } from "date-fns";

/**
 * ETAPA 6a: usePurchasesForm - Step 3 Logic
 * Handles purchase list operations and validation
 * Validates prazo_recompra, product, and date requirements
 */

export function usePurchasesForm(
  purchases: WizardPurchase[],
  setPurchases: (purchases: WizardPurchase[]) => void,
  petCount: number
) {
  const addPurchaseForm = useCallback(() => {
    const newPurchase: WizardPurchase = {
      petIndex: 0,
      product_id: '',
      product_name: '',
      categoria: '',
      prazo_recompra: 30,
      data_compra: format(new Date(), 'yyyy-MM-dd'),
      valor: 0
    };
    setPurchases([...purchases, newPurchase]);
  }, [purchases, setPurchases]);

  const removePurchaseForm = useCallback((index: number) => {
    const newPurchases = purchases.filter((_, i) => i !== index);
    setPurchases(newPurchases);
  }, [purchases, setPurchases]);

  const handlePurchaseChange = useCallback((index: number, field: keyof WizardPurchase, value: any) => {
    const newPurchases = [...purchases];
    newPurchases[index] = {
      ...newPurchases[index],
      [field]: value
    };
    setPurchases(newPurchases);
  }, [purchases, setPurchases]);

  // Atomic multi-field update to prevent React batching race conditions
  const updatePurchaseFields = useCallback((index: number, fields: Partial<WizardPurchase>) => {
    const newPurchases = [...purchases];
    newPurchases[index] = {
      ...newPurchases[index],
      ...fields
    };
    setPurchases(newPurchases);
  }, [purchases, setPurchases]);

  const validatePurchases = useCallback(() => {
    for (let i = 0; i < purchases.length; i++) {
      const p = purchases[i];

      // Skip empty purchases
      if (!p.product_id && !p.product_name.trim()) {
        continue;
      }

      // Validate pet index
      if (p.petIndex < 0 || p.petIndex >= petCount) {
        return false;
      }

      // Validate prazo_recompra
      if (!p.prazo_recompra || p.prazo_recompra < 1) {
        return false;
      }

      // Validate data_compra
      if (!p.data_compra) {
        return false;
      }

      // Validate product
      if (!p.product_id && !p.product_name.trim()) {
        return false;
      }
    }
    return true;
  }, [purchases, petCount]);

  return { addPurchaseForm, removePurchaseForm, handlePurchaseChange, updatePurchaseFields, validatePurchases };
}
