import { useState, useRef, useEffect } from "react";
import { Product } from "@/lib/crm-data";

interface ProductComboboxProps {
  products: Product[];
  selectedProductId: string;
  productName: string;
  onSelect: (productId: string, productName: string) => void;
}

export default function ProductCombobox({ products, selectedProductId, productName, onSelect }: ProductComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(productName);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(productName);
  }, [productName]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = products.filter(p =>
    p.nome.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleInputChange = (val: string) => {
    setInputValue(val);
    setOpen(true);
    // Clear product_id selection, keep typed name
    onSelect("", val);
  };

  const handleSelect = (product: Product) => {
    setInputValue(product.nome);
    onSelect(product.id, product.nome);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Digite ou selecione um produto"
        className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
          {filtered.length > 0 ? (
            filtered.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${
                  selectedProductId === p.id ? "bg-accent/50 font-medium" : ""
                }`}
              >
                {p.nome} <span className="text-muted-foreground text-xs">(a cada {p.prazo_recompra_dias} dias)</span>
              </button>
            ))
          ) : (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              Nenhum produto encontrado.
              <br />
              <span className="text-xs">Ao salvar, este produto será criado automaticamente.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

