import { Button } from "@/components/ui/button";
import { WizardPurchase, WizardPet } from "../hooks/useWizardState";
import { Product } from "@/lib/crm-data";
import { CompraForm } from "./CompraForm";
import { Plus, Package } from "lucide-react";

interface Step3ComprasProps {
  purchases: WizardPurchase[];
  pets: WizardPet[];
  products: Product[];
  onChange: (index: number, field: keyof WizardPurchase, value: any) => void;
  onUpdateFields: (index: number, fields: Partial<WizardPurchase>) => void;
  onAddPurchase: () => void;
  onRemovePurchase: (index: number) => void;
}

/**
 * ETAPA 6c: Step3Compras - Container for Purchases
 * Renders list of purchase forms with add button
 * ~60 lines of clean orchestration
 */

export function Step3Compras({
  purchases,
  pets,
  products,
  onChange,
  onUpdateFields,
  onAddPurchase,
  onRemovePurchase
}: Step3ComprasProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Compras Recorrentes</h3>
          <p className="text-sm text-muted-foreground">Configure compras automáticas e prazos</p>
        </div>
      </div>

      <div className="space-y-3">
        {purchases.map((purchase, idx) => (
          <CompraForm
            key={idx}
            purchase={purchase}
            index={idx}
            pets={pets}
            products={products}
            onChange={onChange}
            onUpdateFields={onUpdateFields}
            onRemove={onRemovePurchase}
            showRemove={purchases.length > 1}
          />
        ))}
      </div>

      <Button
        onClick={onAddPurchase}
        variant="outline"
        className="w-full"
      >
        <Plus size={16} className="mr-2" />
        Adicionar Outra Compra
      </Button>

      <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
        💡 Selecione um produto para auto-preencher o prazo de recompra
      </div>
    </div>
  );
}
