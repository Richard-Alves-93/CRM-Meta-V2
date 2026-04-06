import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lancamento, formatCurrency } from "@/lib/crm-data";
import { formatISODate } from "@/utils/date";
import { useCurrencyInput } from "@/hooks/useCurrencyInput";

interface LancamentoModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: string, valorBruto: number, desconto: number) => void;
  editingLancamento?: Lancamento | null;
}

const LancamentoModal = ({ open, onClose, onSave, editingLancamento }: LancamentoModalProps) => {
  const [data, setData] = useState("");
  const bruto = useCurrencyInput(0);
  const desconto = useCurrencyInput(0);

  useEffect(() => {
    if (editingLancamento) {
      setData(editingLancamento.data);
      bruto.setValue(editingLancamento.valorBruto);
      desconto.setValue(editingLancamento.desconto);
    } else {
      setData(formatISODate(new Date()));
      bruto.setValue(0);
      desconto.setValue(0);
    }
  }, [editingLancamento, open]);

  const liquido = bruto.rawValue - desconto.rawValue;

  const handleSave = () => {
    const v = bruto.rawValue;
    if (!data || !v || v <= 0) return;
    onSave(data, v, desconto.rawValue);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingLancamento ? "Editar Lançamento" : "Lançar Venda do Dia"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Data</Label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Valor Bruto (R$)</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={bruto.displayValue}
              onChange={bruto.handleChange}
              placeholder="R$ 0,00"
            />
          </div>
          <div className="space-y-2">
            <Label>Desconto (R$)</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={desconto.displayValue}
              onChange={desconto.handleChange}
              placeholder="R$ 0,00"
            />
          </div>
          <div className="bg-secondary rounded-lg p-3 text-sm">
            Valor Líquido: <span className="font-bold text-card-foreground">{formatCurrency(liquido)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LancamentoModal;
