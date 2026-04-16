import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Service } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { useCurrencyInput } from "@/hooks/useCurrencyInput";

interface ServicoModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (service: Omit<Service, 'id' | 'created_at'>) => Promise<void>;
  editingService: Service | null;
  tenantId: string | null;
}

export function ServicoModal({ open, onClose, onSave, editingService, tenantId }: ServicoModalProps) {
  const [nome, setNome] = useState("");
  const precoInput = useCurrencyInput(0);
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [requiresPet, setRequiresPet] = useState(true);
  const [requiresProfessional, setRequiresProfessional] = useState(false);
  const [requiresSchedule, setRequiresSchedule] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingService) {
      setNome(editingService.nome);
      precoInput.setValue(editingService.preco);
      setCategoria(editingService.categoria || "");
      setDescricao(editingService.descricao || "");
      setDurationMinutes(editingService.duration_minutes || 30);
      setRequiresPet(editingService.requires_pet ?? true);
      setRequiresProfessional(editingService.requires_professional ?? false);
      setRequiresSchedule(editingService.requires_schedule ?? false);
    } else {
      setNome("");
      precoInput.setValue(0);
      setCategoria("");
      setDescricao("");
      setDurationMinutes(30);
      setRequiresPet(true);
      setRequiresProfessional(false);
      setRequiresSchedule(false);
    }
  }, [editingService, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !tenantId) return;

    setLoading(true);
    try {
      await onSave({
        tenant_id: tenantId,
        nome,
        preco: precoInput.rawValue,
        categoria,
        descricao,
        duration_minutes: durationMinutes,
        requires_pet: requiresPet,
        requires_professional: requiresProfessional,
        requires_schedule: requiresSchedule,
        ativo: true
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>{editingService ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome do Serviço *</Label>
            <Input 
              required 
              value={nome} 
              onChange={(e) => setNome(e.target.value)} 
              placeholder="Ex: Banho e Tosa" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preço (R$) *</Label>
              <Input 
                required 
                value={precoInput.displayValue} 
                onChange={precoInput.handleChange} 
                placeholder="R$ 0,00"
                className="font-bold text-primary"
              />
            </div>
            <div className="space-y-2">
              <Label>Duração (min)</Label>
              <Input 
                type="number"
                value={isNaN(durationMinutes) ? "" : durationMinutes} 
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setDurationMinutes(isNaN(val) ? 0 : val);
                }} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Input 
              value={categoria} 
              onChange={(e) => setCategoria(e.target.value)} 
              placeholder="Ex: Estética, Veterinária..." 
            />
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="reqPet" 
                checked={requiresPet} 
                onCheckedChange={(checked) => setRequiresPet(!!checked)} 
              />
              <Label htmlFor="reqPet" className="text-sm font-medium cursor-pointer">Requer um Pet selecionado</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="reqProf" 
                checked={requiresProfessional} 
                onCheckedChange={(checked) => setRequiresProfessional(!!checked)} 
              />
              <Label htmlFor="reqProf" className="text-sm font-medium cursor-pointer">Requer Profissional (Ex: Consulta)</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="reqSched" 
                checked={requiresSchedule} 
                onCheckedChange={(checked) => setRequiresSchedule(!!checked)} 
              />
              <Label htmlFor="reqSched" className="text-sm font-medium cursor-pointer">Vincular à Agenda automaticamente</Label>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
