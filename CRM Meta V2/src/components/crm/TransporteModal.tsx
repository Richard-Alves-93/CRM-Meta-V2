import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { transporteService } from "@/services/transporteService";
import { fetchCustomers } from "@/services/customerService";
import { fetchPetsByCustomer } from "@/services/petService";
import { Customer, Pet, Profile, TransporteTipo } from "@/lib/types";
import { toast } from "sonner";
import { Truck, Calendar as CalendarIcon, MapPin, User, Dog, Clock, Check, ChevronsUpDown, Search } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { fetchCustomersWithPets } from "@/services/customerService";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ptBR } from "date-fns/locale";
import { addCustomer } from "@/services/customerService";
import { addPet } from "@/services/petService";

import { Transporte } from "@/lib/types";

interface TransporteModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transporteToEdit?: Transporte | null;
}

const TransporteModal = ({ open, onClose, onSuccess, transporteToEdit }: TransporteModalProps) => {
  const [loading, setLoading] = useState(false);
  
  // Estados para Transporte
  const [tipo, setTipo] = useState<TransporteTipo>("BUSCA");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [hora, setHora] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [selectedMotoristaId, setSelectedMotoristaId] = useState<string>("");
  const [endereco, setEndereco] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Listagens
  const [customers, setCustomers] = useState<(Customer & { pets: Pet[] })[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [motoristas, setMotoristas] = useState<Profile[]>([]);
  const [isCustomerComboOpen, setIsCustomerComboOpen] = useState(false);

  // Estados para Cadastro Rápido
  const [isQuickAdd, setIsQuickAdd] = useState(false);
  const [quickTutorName, setQuickTutorName] = useState("");
  const [quickPetName, setQuickPetName] = useState("");
  const [quickPetRaca, setQuickPetRaca] = useState("");

  useEffect(() => {
    if (open) {
      fetchCustomersWithPets().then((data) => {
        setCustomers(data);
        if (transporteToEdit && transporteToEdit.pet_id) {
          const c = data.find(curr => curr.pets.some(p => p.id === transporteToEdit.pet_id));
          if (c) setSelectedCustomerId(c.id);
        }
      });
      transporteService.fetchMotoristasDaEmpresa().then(setMotoristas);
      
      if (transporteToEdit) {
        setTipo(transporteToEdit.tipo);
        if (transporteToEdit.data_hora) {
          const d = new Date(transporteToEdit.data_hora);
          setDate(d);
          setHora(format(d, 'HH:mm'));
        }
        setSelectedPetId(transporteToEdit.pet_id || "");
        setSelectedMotoristaId(transporteToEdit.motorista_id || "");
        // setTimeout is a small hack to ensure setEndereco doesn't get overridden by Customer Selection Effect
        setTimeout(() => setEndereco(transporteToEdit.endereco_transporte || ""), 100);
        setObservacoes(transporteToEdit.observacoes || "");
        setIsQuickAdd(false);
      } else {
        // Reset fields on open for New
        setTipo("BUSCA");
        setDate(undefined);
        setHora("");
        setSelectedCustomerId("");
        setSelectedPetId("");
        setSelectedMotoristaId("");
        setEndereco("");
        setObservacoes("");
        setIsQuickAdd(false);
        setQuickTutorName("");
        setQuickPetName("");
        setQuickPetRaca("");
      }
    }
  }, [open]);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchPetsByCustomer(selectedCustomerId).then(setPets);
      const c = customers.find(curr => curr.id === selectedCustomerId);
      if (c) {
        // Monta o endereço completo para facilitar pro usuário
        const parts = [];
        if (c.endereco) parts.push(c.endereco);
        if (c.numero) parts.push(c.numero);
        
        let fullAddr = parts.join(", ");
        
        if (c.complemento) {
          fullAddr += (fullAddr ? " - " : "") + c.complemento;
        }
        
        const subParts = [];
        if (c.bairro) subParts.push(c.bairro);
        if (c.cidade) subParts.push(c.cidade);
        
        if (subParts.length > 0) {
          fullAddr += (fullAddr ? " - " : "") + subParts.join(", ");
        }
        
        setEndereco(fullAddr);
      }
    } else {
      setPets([]);
      setEndereco("");
    }
  }, [selectedCustomerId, customers]);

  const handleSave = async () => {
    if (isQuickAdd) {
      if (!quickTutorName || !quickPetName || !selectedMotoristaId || !date || !hora) {
        toast.error("Por favor, preencha o nome do tutor, do pet e o motorista.");
        return;
      }
    } else {
      if (!date || !hora || !selectedMotoristaId || !selectedCustomerId || !selectedPetId) {
        toast.error("Por favor, preencha todos os campos obrigatórios.");
        return;
      }
    }

    setLoading(true);
    try {
      let finalCustomerId = selectedCustomerId;
      let finalPetId = selectedPetId;

      // Se for cadastro rápido, cria tutor e pet primeiro
      if (isQuickAdd) {
        const newCustomer = await addCustomer({
          nome: quickTutorName,
          endereco: endereco || null,
          telefone: null,
          whatsapp: null,
          email: null,
          observacoes: "Cadastrado via Agendamento Rápido"
        });
        finalCustomerId = newCustomer.id;

        const newPet = await addPet({
          customer_id: finalCustomerId,
          nome: quickPetName,
          raca: quickPetRaca || null,
          especie: "Cão", // Default
          sexo: "Macho",
          porte: "Médio",
          peso: null,
          data_aniversario: null,
          ativo: true
        });
        finalPetId = newPet.id;
      }

      // Combina data e hora para ISO string
      const datePart = format(date, "yyyy-MM-dd");
      const dataHoraISO = new Date(`${datePart}T${hora}`).toISOString();

      if (transporteToEdit) {
        await transporteService.updateTransporte(transporteToEdit.id, {
          venda_id: transporteToEdit.venda_id,
          tipo,
          data_hora: dataHoraISO,
          motorista_id: selectedMotoristaId,
          endereco_transporte: endereco,
          status: transporteToEdit.status,
          pet_id: finalPetId,
          observacoes
        });
        toast.success("Transporte atualizado com sucesso!");
      } else {
        await transporteService.addTransporte({
          venda_id: null, 
          tipo,
          data_hora: dataHoraISO,
          motorista_id: selectedMotoristaId,
          endereco_transporte: endereco,
          status: "AGUARDANDO",
          pet_id: finalPetId,
          observacoes
        });
        toast.success("Transporte agendado com sucesso!");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Erro ao agendar transporte:", error);
      // Mostrar o erro real para facilitar o diagnóstico
      const msg = error?.message || error?.error_description || JSON.stringify(error);
      toast.error(`Erro: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Truck className="w-5 h-5" />
            {transporteToEdit ? "Editar Agendamento de Transporte" : "Novo Agendamento de Transporte"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Truck className="w-3.5 h-3.5" /> Tipo de Serviço
            </Label>
            <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BUSCA">Busca (Buscar Pet)</SelectItem>
                <SelectItem value="ENTREGA">Entrega (Levar Pet)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-1">
             <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground/80">
                  <CalendarIcon className="w-3.5 h-3.5" /> Data
                </Label>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full h-9 justify-start text-left font-normal px-3 text-xs",
                        !date && "text-muted-foreground"
                      )}
                    >
                      {date ? format(date, "dd/MM/yyyy") : <span>dd/mm/aaaa</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground/80">
                  <Clock className="w-3.5 h-3.5" /> Hora
                </Label>
                <Input 
                  type="time" 
                  value={hora} 
                  onChange={(e) => setHora(e.target.value)} 
                  className="h-9 px-3 text-xs"
                />
              </div>
          </div>

          {!isQuickAdd ? (
            <>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-muted-foreground/80">
                    <User className="w-3.5 h-3.5" /> Cliente / Tutor
                  </Label>
                  <Button 
                    variant="link" 
                    className="h-auto p-0 text-[10px] text-primary"
                    onClick={() => setIsQuickAdd(true)}
                  >
                    + Novo Cliente
                  </Button>
                </div>
                
                <Popover open={isCustomerComboOpen} onOpenChange={setIsCustomerComboOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isCustomerComboOpen}
                      className="w-full h-10 justify-between bg-slate-50/30 font-normal px-3"
                    >
                      {selectedCustomerId
                        ? customers.find((c) => c.id === selectedCustomerId)?.nome
                        : "Pesquisar cliente ou pet..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command className="w-full">
                      <CommandInput placeholder="Digite o nome do cliente ou do pet..." className="h-9" />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty className="flex flex-col items-center py-4 gap-2">
                          <span className="text-xs text-muted-foreground">Nenhum resultado.</span>
                          <Button size="sm" variant="outline" onClick={() => { setIsQuickAdd(true); setIsCustomerComboOpen(false); }}>
                            Cadastrar Novo Cliente
                          </Button>
                        </CommandEmpty>
                        <CommandGroup>
                          {customers.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={`${c.nome} ${c.pets.map(p => p.nome).join(" ")}`}
                              onSelect={() => {
                                setSelectedCustomerId(c.id);
                                setIsCustomerComboOpen(false);
                              }}
                              className="flex flex-col items-start py-2 px-3 cursor-pointer"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-semibold text-sm">{c.nome}</span>
                                {selectedCustomerId === c.id && <Check className="h-4 w-4 text-primary" />}
                              </div>
                              {c.pets && c.pets.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {c.pets.map(p => (
                                    <span key={p.id} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                      <Dog className="w-2 h-2" />
                                      {p.nome} {p.raca ? `(${p.raca})` : ""}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Dog className="w-3.5 h-3.5" /> Pet
                </Label>
                <Select value={selectedPetId} onValueChange={setSelectedPetId} disabled={!selectedCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedCustomerId ? "Selecione o pet" : "Aguardando cliente..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {pets.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2 col-span-1 md:col-span-2 bg-primary/5 p-3 rounded-lg border border-primary/10">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-primary uppercase flex items-center gap-2">
                    <User className="w-3 h-3" /> Cadastro Rápido
                  </h4>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 text-[10px] text-muted-foreground hover:text-foreground"
                    onClick={() => setIsQuickAdd(false)}
                  >
                    Voltar para busca
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">Nome do Tutor *</Label>
                    <Input 
                      placeholder="Ex: Richard Alves" 
                      value={quickTutorName} 
                      onChange={e => setQuickTutorName(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">Nome do Pet *</Label>
                    <Input 
                      placeholder="Ex: Thor" 
                      value={quickPetName} 
                      onChange={e => setQuickPetName(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[10px] uppercase text-muted-foreground">Raça (Opcional)</Label>
                    <Input 
                      placeholder="Ex: Golden Retriever" 
                      value={quickPetRaca} 
                      onChange={e => setQuickPetRaca(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Truck className="w-3.5 h-3.5" /> Motorista
            </Label>
            <Select value={selectedMotoristaId} onValueChange={setSelectedMotoristaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motorista" />
              </SelectTrigger>
              <SelectContent>
                {motoristas.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.display_name || m.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 col-span-1 md:col-span-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" /> Endereço de Transporte
            </Label>
            <Input 
              value={endereco} 
              onChange={(e) => setEndereco(e.target.value)} 
              placeholder="Ex: Rua das Flores, 123 - Centro" 
            />
          </div>

          <div className="space-y-2 col-span-1 md:col-span-2">
            <Label>Observações Adicionais</Label>
            <Textarea 
              value={observacoes} 
              onChange={(e) => setObservacoes(e.target.value)} 
              placeholder="Ex: Tocar a campainha, pet é arrisco..."
              className="resize-none h-20"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-primary hover:bg-primary/90">
            {loading ? "Salvando..." : (transporteToEdit ? "Salvar Alterações" : "Agendar Transporte")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransporteModal;
