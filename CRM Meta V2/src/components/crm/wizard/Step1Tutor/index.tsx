import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WizardTutor } from "../hooks/useWizardState";
import { User } from "lucide-react";

interface Step1TutorProps {
  tutor: WizardTutor;
  onTutorChange: (field: keyof WizardTutor, value: string) => void;
}

/**
 * ETAPA 6b: Step1Tutor - Presentation Component
 * Renders tutor form for step 1
 * ~80 lines of clean, reusable JSX
 */

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
  const handlePhoneChange = (field: 'whatsapp' | 'telefone', value: string) => {
    const formatted = formatPhone(value);
    onTutorChange(field, formatted);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Dados do Tutor</h3>
          <p className="text-sm text-muted-foreground">Informações básicas do tutor</p>
        </div>
      </div>

      <div className="grid gap-4">
        <div>
          <Label htmlFor="tutor-nome" className="text-sm font-medium">
            Nome do Tutor *
          </Label>
          <Input
            id="tutor-nome"
            placeholder="Ex: João Silva"
            value={tutor.nome}
            onChange={(e) => onTutorChange('nome', e.target.value)}
            className="mt-2"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tutor-whatsapp" className="text-sm font-medium">
              WhatsApp *
            </Label>
            <Input
              id="tutor-whatsapp"
              placeholder="Ex: (11) 98765-4321"
              value={tutor.whatsapp}
              onChange={(e) => handlePhoneChange('whatsapp', e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="tutor-telefone" className="text-sm font-medium">
              Telefone
            </Label>
            <Input
              id="tutor-telefone"
              placeholder="Ex: (11) 3456-7890"
              value={tutor.telefone}
              onChange={(e) => handlePhoneChange('telefone', e.target.value)}
              className="mt-2"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="tutor-email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="tutor-email"
            placeholder="Ex: joao@email.com"
            type="email"
            value={tutor.email}
            onChange={(e) => onTutorChange('email', e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="tutor-obs" className="text-sm font-medium">
            Observações
          </Label>
          <textarea
            id="tutor-obs"
            placeholder="Observações adicionais..."
            value={tutor.observacoes}
            onChange={(e) => onTutorChange('observacoes', e.target.value)}
            className="mt-2 w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
