import { User, PawPrint, Package, Check } from "lucide-react";

interface WizardProgressProps {
  currentStep: number;
}

/**
 * ETAPA 6d: WizardProgress - Visual Progress Indicator
 * Shows which step user is on
 * ~50 lines of pure presentation
 */

export function WizardProgress({ currentStep }: WizardProgressProps) {
  const steps = [
    { number: 1, label: 'Tutor', icon: User },
    { number: 2, label: 'Pets', icon: PawPrint },
    { number: 3, label: 'Compras', icon: Package }
  ];

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;

          return (
            <div key={step.number} className="flex items-center flex-1">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                    isActive
                      ? 'border-primary bg-primary/10'
                      : isCompleted
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-border bg-secondary/50'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <StepIcon
                      className={`w-5 h-5 ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    />
                  )}
                </div>
                <span className={`text-[10px] font-bold mt-1 uppercase tracking-tighter ${
                  isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
                }`}>
                  {step.label}
                </span>
              </div>

              {/* Divider line */}
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-px mx-1 transition-all ${
                    isCompleted ? 'bg-green-500' : 'bg-border'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
