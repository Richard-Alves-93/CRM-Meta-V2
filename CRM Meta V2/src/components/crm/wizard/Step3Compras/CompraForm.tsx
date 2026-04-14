import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WizardPurchase, WizardPet } from "../hooks/useWizardState";
import { Product } from "@/lib/crm-data";
import { Trash2 } from "lucide-react";
import ProductCombobox from "@/components/crm/ProductCombobox";
import { memo } from "react";

interface CompraFormProps {
  purchase: WizardPurchase;
  index: number;
  pets: WizardPet[];
  products: Product[];
  onChange: (index: number, field: keyof WizardPurchase, value: any) => void;
  onUpdateFields: (index: number, fields: Partial<WizardPurchase>) => void;
  onRemove: (index: number) => void;
  showRemove: boolean;
}

/**
 * ETAPA 6c + 8: CompraForm - Memoized Reusable Component
 * Prevents re-render when sibling purchases change
 * Only renders when own data changes
 */

// Formata centavos inteiros para string "1.234,56"
function formatCurrencyInput(cents: number): string {
  if (cents === 0) return '';
  const reais = cents / 100;
  return reais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Extrai apenas dígitos e converte para centavos
function parseCurrencyInput(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  return parseInt(digits, 10) || 0;
}

function CompraFormComponent({
  purchase,
  index,
  pets,
  products,
  onChange,
  onUpdateFields,
  onRemove,
  showRemove
}: CompraFormProps) {
  const handleProductSelect = (productId: string, productName: string) => {
    const selectedProduct = products.find(p => p.id === productId);
    // Atomic update: set all product-related fields in a single state update
    onUpdateFields(index, {
      product_id: productId,
      product_name: productName,
      ...(selectedProduct ? { prazo_recompra: selectedProduct.prazo_recompra_dias } : {})
    });
  };

  const filteredProducts = products.filter(p => !purchase.categoria || p.categoria === purchase.categoria);

  return (
    <div className="border border-border/50 rounded-lg p-3 bg-secondary/15">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-sm">Compra Recorrente #{index + 1}</h4>
        {showRemove && (
          <button
            onClick={() => onRemove(index)}
            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            title="Remover compra"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="grid gap-2">
        {/* Linha 1: Pet + Categoria + Produto */}
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-12 sm:col-span-4 space-y-1">
            <Label htmlFor={`purchase-${index}-pet`} className="text-[10px] font-bold text-muted-foreground uppercase">
              Para qual Pet? *
            </Label>
            <Select
              value={String(purchase.petIndex)}
              onValueChange={(v) => onChange(index, 'petIndex', parseInt(v))}
            >
              <SelectTrigger id={`purchase-${index}-pet`} className="h-8 text-sm">
                <SelectValue placeholder="Selecione um pet" />
              </SelectTrigger>
              <SelectContent>
                {pets.map((pet, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {pet.nome || `Pet ${i + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-12 sm:col-span-4 space-y-1">
            <Label htmlFor={`purchase-${index}-category`} className="text-[10px] font-bold text-muted-foreground uppercase">
              Categoria
            </Label>
            <Select
              value={purchase.categoria || "Todas"}
              onValueChange={(v) => onChange(index, 'categoria', v === "Todas" ? "" : v)}
            >
              <SelectTrigger id={`purchase-${index}-category`} className="h-8 text-sm">
                <SelectValue placeholder="Todas as Categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas as Categorias</SelectItem>
                <SelectItem value="Antipulgas">Antipulgas</SelectItem>
                <SelectItem value="Vacina">Vacina</SelectItem>
                <SelectItem value="Ração">Ração</SelectItem>
                <SelectItem value="Vermífugo">Vermífugo</SelectItem>
                <SelectItem value="Higiene">Higiene</SelectItem>
                <SelectItem value="Medicamento">Medicamento</SelectItem>
                <SelectItem value="Estética">Estética</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-12 sm:col-span-4 space-y-1">
            <Label htmlFor={`purchase-${index}-product`} className="text-[10px] font-bold text-muted-foreground uppercase">
              Produto *
            </Label>
            <ProductCombobox
              products={filteredProducts}
              selectedProductId={purchase.product_id}
              productName={purchase.product_name}
              onSelect={handleProductSelect}
            />
          </div>
        </div>

        {/* Linha 2: Data + Prazo + Valor */}
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-4 space-y-1">
            <Label htmlFor={`purchase-${index}-date`} className="text-[10px] font-bold text-muted-foreground uppercase">
              Data da Compra *
            </Label>
            <Input
              id={`purchase-${index}-date`}
              type="date"
              value={purchase.data_compra}
              onChange={(e) => onChange(index, 'data_compra', e.target.value)}
              className="h-8 text-sm px-1"
            />
          </div>

          <div className="col-span-4 space-y-1">
            <Label htmlFor={`purchase-${index}-prazo`} className="text-[10px] font-bold text-muted-foreground uppercase">
              Prazo (dias) *
            </Label>
            <Input
              id={`purchase-${index}-prazo`}
              type="number"
              min="1"
              value={purchase.prazo_recompra}
              onChange={(e) => onChange(index, 'prazo_recompra', parseInt(e.target.value) || 1)}
              className="h-8 text-sm"
              placeholder="30"
            />
          </div>

          <div className="col-span-4 space-y-1">
            <Label htmlFor={`purchase-${index}-valor`} className="text-[10px] font-bold text-muted-foreground uppercase">
              Valor (R$)
            </Label>
            <Input
              id={`purchase-${index}-valor`}
              type="text"
              inputMode="numeric"
              value={formatCurrencyInput(Math.round((purchase.valor || 0) * 100))}
              onChange={(e) => {
                const cents = parseCurrencyInput(e.target.value);
                onChange(index, 'valor', cents / 100);
              }}
              className="h-8 text-sm"
              placeholder="0,00"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const CompraForm = memo(CompraFormComponent);
