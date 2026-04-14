import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WizardTutor } from "../hooks/useWizardState";
import { toast } from "sonner";

interface Step1TutorProps {
  tutor: WizardTutor;
  onTutorChange: (field: keyof WizardTutor, value: string) => void;
}

const formatPhone = (value: string) => {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 14);
  }
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .slice(0, 15);
};

export function Step1Tutor({ tutor, onTutorChange }: Step1TutorProps) {
  const numberInputRef = useRef<HTMLInputElement>(null);

  const handlePhoneChange = (field: 'whatsapp' | 'telefone', value: string) => {
    const formatted = formatPhone(value);
    onTutorChange(field, formatted);
  };

  const handleCEPChange = async (value: string) => {
    // Remove tudo que não é dígito
    const cleanCEP = value.replace(/\D/g, "");
    
    // Formata como 00000-000
    let formattedCEP = cleanCEP;
    if (cleanCEP.length > 5) {
      formattedCEP = `${cleanCEP.slice(0, 5)}-${cleanCEP.slice(5, 8)}`;
    }
    
    onTutorChange('cep', formattedCEP);

    // Busca apenas quando atingir 8 dígitos exatos
    if (cleanCEP.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data = await response.json();
        
        if (data.erro) {
          toast.error("CEP não encontrado.");
          return;
        }

        // Agora as atualizações funcionam em sequência graças ao setTutor(prev => ...)
        onTutorChange('endereco', data.logradouro || "");
        onTutorChange('bairro', data.bairro || "");
        onTutorChange('cidade', data.localidade || "");
        
        // Auto-focus no campo de número
        setTimeout(() => numberInputRef.current?.focus(), 150);
        toast.success("Endereço preenchido!");
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        toast.error("Erro ao buscar CEP. Verifique sua conexão.");
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Linha 1: Nome, WhatsApp e CEP */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-6 space-y-1">
          <Label htmlFor="tutor-nome" className="text-[10px] font-bold text-muted-foreground uppercase">
            Nome do Tutor *
          </Label>
          <Input
            id="tutor-nome"
            placeholder="Ex: Richard Alves"
            value={tutor.nome}
            onChange={(e) => onTutorChange('nome', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="col-span-6 sm:col-span-3 space-y-1">
          <Label htmlFor="tutor-whatsapp" className="text-[10px] font-bold text-muted-foreground uppercase">
            WhatsApp *
          </Label>
          <Input
            id="tutor-whatsapp"
            placeholder="(11) 98765-4321"
            value={tutor.whatsapp}
            onChange={(e) => handlePhoneChange('whatsapp', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="col-span-6 sm:col-span-3 space-y-1">
          <Label htmlFor="tutor-cep" className="text-[10px] font-bold text-muted-foreground uppercase">
            CEP *
          </Label>
          <Input
            id="tutor-cep"
            placeholder="00000-000"
            value={tutor.cep}
            onChange={(e) => handleCEPChange(e.target.value)}
            maxLength={9}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Linha 2: Rua, Nº, Compl, Bairro, Cidade */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-4 space-y-1">
          <Label htmlFor="tutor-end" className="text-[10px] font-bold text-muted-foreground uppercase">
            Rua *
          </Label>
          <Input
            id="tutor-end"
            placeholder="Logradouro..."
            value={tutor.endereco}
            onChange={(e) => onTutorChange('endereco', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="col-span-12 sm:col-span-1 space-y-1">
          <Label htmlFor="tutor-num" className="text-[10px] font-bold text-muted-foreground uppercase text-primary">
            Nº *
          </Label>
          <Input
            id="tutor-num"
            ref={numberInputRef}
            placeholder="123"
            value={tutor.numero}
            onChange={(e) => onTutorChange('numero', e.target.value)}
            className="h-8 text-sm border-primary/30"
          />
        </div>
        <div className="col-span-12 sm:col-span-2 space-y-1">
          <Label htmlFor="tutor-comp" className="text-[10px] font-bold text-muted-foreground uppercase">
            Compl.
          </Label>
          <Input
            id="tutor-comp"
            placeholder="Opcional"
            value={tutor.complemento}
            onChange={(e) => onTutorChange('complemento', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="col-span-12 sm:col-span-2 space-y-1">
          <Label htmlFor="tutor-bairro" className="text-[10px] font-bold text-muted-foreground uppercase">
            Bairro *
          </Label>
          <Input
            id="tutor-bairro"
            placeholder="..."
            value={tutor.bairro}
            onChange={(e) => onTutorChange('bairro', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="col-span-12 sm:col-span-3 space-y-1">
          <Label htmlFor="tutor-cidade" className="text-[10px] font-bold text-muted-foreground uppercase">
            Cidade *
          </Label>
          <Input
            id="tutor-cidade"
            placeholder="..."
            value={tutor.cidade}
            onChange={(e) => onTutorChange('cidade', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Linha 3: Email, Tel e Obs */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-4 space-y-1">
          <Label htmlFor="tutor-email" className="text-[10px] font-bold text-muted-foreground uppercase">
            Email
          </Label>
          <Input
            id="tutor-email"
            placeholder="joao@email.com"
            type="email"
            value={tutor.email}
            onChange={(e) => onTutorChange('email', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="col-span-12 sm:col-span-3 space-y-1">
          <Label htmlFor="tutor-telefone" className="text-[10px] font-bold text-muted-foreground uppercase">
            Outro Telefone
          </Label>
          <Input
            id="tutor-telefone"
            placeholder="Fixo ou secundário"
            value={tutor.telefone}
            onChange={(e) => handlePhoneChange('telefone', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="col-span-12 sm:col-span-5 space-y-1">
          <Label htmlFor="tutor-obs" className="text-[10px] font-bold text-muted-foreground uppercase">
            Observações
          </Label>
          <textarea
            id="tutor-obs"
            placeholder="Observações adicionais..."
            value={tutor.observacoes}
            onChange={(e) => onTutorChange('observacoes', e.target.value)}
            className="w-full px-3 py-1 border border-input rounded-md bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 min-h-[32px] max-h-[32px] resize-none"
            rows={1}
          />
        </div>
      </div>
    </div>
  );
}
