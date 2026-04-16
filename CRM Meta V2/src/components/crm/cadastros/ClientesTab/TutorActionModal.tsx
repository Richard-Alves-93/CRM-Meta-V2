import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Customer, Pet } from "@/lib/types";
import { ShoppingCart, Plus, Edit2, PawPrint, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TutorActionModalProps {
  open: boolean;
  onClose: () => void;
  customer: (Customer & { pets?: Pet[] }) | null;
  onEditTutor: (customer: Customer) => void;
  onAddPet: (customerId: string) => void;
}

export function TutorActionModal({ open, onClose, customer, onEditTutor, onAddPet }: TutorActionModalProps) {
  const navigate = useNavigate();

  if (!customer) return null;

  const handleStartAttendance = (petId?: string) => {
    const params = new URLSearchParams();
    params.set("customerId", customer.id);
    if (petId) params.set("petId", petId);
    
    navigate(`/pdv?${params.toString()}`);
    onClose();
  };

  const pets = customer.pets || [];

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="text-primary" size={24} />
            Atendimento: {customer.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações do Tutor */}
          <div className="flex flex-wrap gap-4 p-4 bg-secondary/30 rounded-lg border border-border/50">
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Contato</p>
              <p className="text-sm">{customer.whatsapp || customer.telefone || "Sem telefone"}</p>
            </div>
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Email</p>
              <p className="text-sm truncate">{customer.email || "Sem email"}</p>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEditTutor(customer)}
                className="gap-2 h-9"
              >
                <Edit2 size={14} /> Editar Tutor
              </Button>
            </div>
          </div>

          {/* Pets */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <PawPrint size={16} className="text-primary" />
                Pets Vinculados
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onAddPet(customer.id)}
                className="text-primary hover:text-primary hover:bg-primary/10 gap-1 h-8"
              >
                <Plus size={14} /> Adicionar Pet
              </Button>
            </div>

            {pets.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-border rounded-xl">
                <p className="text-sm text-muted-foreground">Nenhum pet cadastrado para este tutor.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pets.map((pet) => (
                  <div 
                    key={pet.id} 
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl border border-border/50 hover:border-primary/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {pet.nome.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{pet.nome}</p>
                        <p className="text-xs text-muted-foreground">{pet.especie || "Pet"}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleStartAttendance(pet.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity gap-2"
                    >
                      <ShoppingCart size={14} /> Vender
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ação Geral */}
          <div className="pt-4 border-t border-border mt-4 flex justify-between items-center">
             <p className="text-xs text-muted-foreground">Clique em "Vender" para iniciar um atendimento no PDV.</p>
             <Button 
               variant="default"
               onClick={() => handleStartAttendance()}
               className="gap-2 bg-primary hover:bg-primary/90"
             >
               <ShoppingCart size={16} /> Venda Direta (Só Tutor)
             </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
