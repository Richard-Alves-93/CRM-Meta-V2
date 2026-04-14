import { Button } from "@/components/ui/button";
import { WizardPurchase, WizardPet } from "../hooks/useWizardState";
import { Product } from "@/lib/crm-data";
import { CompraForm } from "./CompraForm";
import { Plus, Package, PawPrint } from "lucide-react";

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
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <PawPrint className="w-4 h-4" /> Compras Recorrentes
          </h3>
          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            {purchases.length} {purchases.length === 1 ? 'Item' : 'Itens'}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          💡 Selecione um produto para auto-preencher o prazo de recompra
        </p>
      </div>

      <div className="space-y-2">
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
        size="sm"
        className="w-full h-8 text-xs border-dashed"
      >
        <Plus size={14} className="mr-2" />
        Adicionar Outra Compra
      </Button>
    </div>
  );
}
