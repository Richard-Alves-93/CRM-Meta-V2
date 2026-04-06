import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Meta } from "@/lib/crm-data";

interface MetaModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (nome: string, valor: number, descricao: string) => void;
  editingMeta?: Meta | null;
}

// Formata centavos inteiros para string "R$ 1.234,56"
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

const MetaModal = ({ open, onClose, onSave, editingMeta }: MetaModalProps) => {
  const [nome, setNome] = useState("");
  const [valorCents, setValorCents] = useState(0);
  const [descricao, setDescricao] = useState("");

  useEffect(() => {
    if (editingMeta) {
      setNome(editingMeta.nome);
      setValorCents(Math.round(editingMeta.valor * 100));
      setDescricao(editingMeta.descricao);
    } else {
      setNome(""); setValorCents(0); setDescricao("");
    }
  }, [editingMeta, open]);

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cents = parseCurrencyInput(e.target.value);
    // Limitar a valores razoáveis (até 999.999.999,99)
    if (cents <= 99999999999) {
      setValorCents(cents);
    }
  };

  const handleSave = () => {
    const v = valorCents / 100;
    if (!nome.trim() || v <= 0) return;
    onSave(nome.trim(), v, descricao.trim());
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingMeta ? "Editar Meta" : "Nova Meta"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Meta</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Meta 230k" />
          </div>
          <div className="space-y-2">
            <Label>Valor da Meta (R$)</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={formatCurrencyInput(valorCents)}
              onChange={handleValorChange}
              placeholder="0,00"
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição da meta..." />
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

export default MetaModal;

