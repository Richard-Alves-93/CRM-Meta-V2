import { useState, useEffect } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Pet, Customer, Product } from "@/lib/crm-data";
import ProductCombobox from "./ProductCombobox";

interface PetModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (pet: Omit<Pet, 'id'>, purchases?: any[]) => Promise<void>;
  editingPet?: Pet | null;
  customers: Customer[];
  products: Product[];
}

const PetModal = ({ open, onClose, onSave, editingPet, customers, products }: PetModalProps) => {
  const [nome, setNome] = useState("");
  const [especie, setEspecie] = useState("Cachorro");
  const [raca, setRaca] = useState("");
  const [racasList, setRacasList] = useState<string[]>([]);
  const [dataAniversario, setDataAniversario] = useState("");
  const [sexo, setSexo] = useState("Macho");
  const [porte, setPorte] = useState("Médio");
  const [peso, setPeso] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [loading, setLoading] = useState(false);

  // Novas compras vinculadas
  const [purchases, setPurchases] = useState<any[]>([]);

  // Funções de máscara de moeda (Reutilizadas)
  const formatCurrency = (value: string) => {
    const rawValue = value.replace(/\D/g, "");
    if (!rawValue) return "";
    const numberValue = parseFloat(rawValue) / 100;
    return numberValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const parseCurrency = (value: string) => {
    return Number(value.replace(/\D/g, "")) / 100;
  };

  useEffect(() => {
    const racasSalvas = JSON.parse(localStorage.getItem("racas") || "[]");
    setRacasList(Array.isArray(racasSalvas) ? racasSalvas : []);
  }, []);

  useEffect(() => {
    if (editingPet) {
      setNome(editingPet.nome || "");
      setEspecie(editingPet.especie || "Cachorro");
      setRaca(editingPet.raca || "");
      setDataAniversario(editingPet.data_aniversario || "");
      setSexo(editingPet.sexo || "Macho");
      setPorte(editingPet.porte || "Médio");
      setPeso(editingPet.peso ? editingPet.peso.toString() : "");
      setCustomerId(editingPet.customer_id || "");
      setPurchases([]); // Reset compras ao editar
    } else {
      setNome("");
      setEspecie("Cachorro");
      setRaca("");
      setDataAniversario("");
      setSexo("Macho");
      setPorte("Médio");
      setPeso("");
      setCustomerId("");
      setPurchases([]); // Reset compras para novo pet
    }
  }, [editingPet, open]);

  // Handlers para compras
  const addPurchase = () => {
    setPurchases([...purchases, {
      product_id: "",
      product_name: "",
      prazo_recompra: 30,
      data_compra: new Date().toISOString().split('T')[0],
      valor: 0,
      valorDisplay: ""
    }]);
  };

  const removePurchase = (index: number) => {
    setPurchases(purchases.filter((_, i) => i !== index));
  };

  const updatePurchase = (index: number, field: string, value: any) => {
    const newPurchases = [...purchases];
    if (field === 'valorDisplay') {
      newPurchases[index].valorDisplay = formatCurrency(value);
      newPurchases[index].valor = parseCurrency(value);
    } else {
      newPurchases[index][field] = value;
    }
    setPurchases(newPurchases);
  };

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !customerId) return;

    // Salvar raça nova no localStorage se não existir
    if (raca.trim()) {
      const racaFormatada = raca.trim();
      if (!racasList.includes(racaFormatada)) {
        const novaLista = [...racasList, racaFormatada];
        setRacasList(novaLista);
        localStorage.setItem("racas", JSON.stringify(novaLista));
      }
    }

    setLoading(true);
    try {
      await onSave({
        nome,
        customer_id: customerId,
        especie: especie?.trim() ? especie : null,
        raca: raca?.trim() ? raca : null,
        data_aniversario: dataAniversario?.trim() ? dataAniversario : null,
        sexo: sexo?.trim() ? sexo : null,
        porte: porte?.trim() ? porte : null,
        peso: peso && !isNaN(parseFloat(peso)) ? parseFloat(peso) : null,
      }, purchases);
    } catch (error) {
      console.error("Erro ao salvar pet/compras:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-xl shadow-lg border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200 min-w-[500px] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {editingPet ? "Editar Pet" : "Novo Pet"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="p-4 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium text-foreground">Tutor *</label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="" disabled>Selecione o tutor</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nome do Pet *</label>
                <input
                  required
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Rex"
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Espécie</label>
                <select
                  value={especie}
                  onChange={(e) => setEspecie(e.target.value)}
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="Cachorro">Cachorro</option>
                  <option value="Gato">Gato</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Raça</label>
                <input
                  type="text"
                  list="list-racas"
                  value={raca}
                  onChange={(e) => setRaca(e.target.value)}
                  placeholder="Ex: Poodle"
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <datalist id="list-racas">
                  {racasList.map((r, idx) => (
                    <option key={idx} value={r} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Data de Aniversário</label>
                <input
                  type="date"
                  value={dataAniversario}
                  onChange={(e) => setDataAniversario(e.target.value)}
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Sexo</label>
                <select
                  value={sexo}
                  onChange={(e) => setSexo(e.target.value)}
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="Macho">Macho</option>
                  <option value="Fêmea">Fêmea</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Porte</label>
                <select
                  value={porte}
                  onChange={(e) => setPorte(e.target.value)}
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="Pequeno">Pequeno</option>
                  <option value="Médio">Médio</option>
                  <option value="Grande">Grande</option>
                  <option value="Gigante">Gigante</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Peso (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  placeholder="Ex: 5.5"
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            {!editingPet && (
              <div className="pt-4 border-t border-border space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Acompanhamento de Compras</h3>
                  <button
                    type="button"
                    onClick={addPurchase}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <Plus size={14} /> Adicionar Produto
                  </button>
                </div>

                {purchases.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-2">
                    Nenhum produto recorrente adicionado ainda.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {purchases.map((purchase, index) => (
                      <div key={index} className="p-3 bg-secondary/30 rounded-lg border border-border space-y-3 relative group">
                        <button
                          type="button"
                          onClick={() => removePurchase(index)}
                          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>

                        <div className="space-y-2 pr-6">
                          <label className="text-xs font-semibold text-foreground">Produto *</label>
                          <ProductCombobox
                            products={products}
                            selectedProductId={purchase.product_id}
                            productName={purchase.product_name}
                            onSelect={(id, name) => {
                              updatePurchase(index, 'product_id', id);
                              updatePurchase(index, 'product_name', name);
                              if (id) {
                                const prod = products.find(p => p.id === id);
                                if (prod?.prazo_recompra_dias) {
                                  updatePurchase(index, 'prazo_recompra', prod.prazo_recompra_dias);
                                }
                              }
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Próx. Compra (dias)</label>
                            <input
                              type="number"
                              min="1"
                              value={purchase.prazo_recompra}
                              onChange={(e) => updatePurchase(index, 'prazo_recompra', parseInt(e.target.value))}
                              className="w-full flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Data da Compra</label>
                            <input
                              type="date"
                              value={purchase.data_compra}
                              onChange={(e) => updatePurchase(index, 'data_compra', e.target.value)}
                              className="w-full flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                          </div>
                          <div className="space-y-1 col-span-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Valor Pago (R$)</label>
                            <input
                              type="text"
                              placeholder="R$ 0,00"
                              value={purchase.valorDisplay || ""}
                              onChange={(e) => updatePurchase(index, 'valorDisplay', e.target.value)}
                              className="w-full flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs font-bold text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-right"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border bg-secondary/10 flex justify-end gap-3 mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !nome.trim() || !customerId}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium transition-opacity disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PetModal;
