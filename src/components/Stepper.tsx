import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useQuoteWizard } from '@/context/QuoteWizardContext'; // Import useQuoteWizard

interface StepperProps {
  // steps: { id: string; name: string }[]; // No longer needed as steps come from context
  // currentStep: number; // No longer needed as currentStep comes from context
}

const Stepper: React.FC<StepperProps> = () => {
  const { steps, currentStep, setStep } = useQuoteWizard(); // Get state and setStep from context

  return (
    <div className="no-print overflow-x-auto pb-2">
      <div className="mx-auto flex min-w-[560px] max-w-3xl items-center justify-between px-2 py-3">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <button
            type="button"
            onClick={() => setStep(index)}
            aria-label={`Ir para o passo: ${step.name}`}
            aria-current={index === currentStep ? 'step' : undefined}
            className="group relative flex min-w-24 flex-col items-center rounded-lg p-1 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white transition-colors duration-300",
                index === currentStep
                  ? "bg-primary shadow-md group-hover:bg-primary/90"
                  : index < currentStep
                  ? "bg-green-500 group-hover:bg-green-600"
                  : "bg-muted-foreground/50 group-hover:bg-muted-foreground/70"
              )}
            >
              {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
            </div>
            <p
              className={cn(
                "mt-2 max-w-28 truncate text-center text-xs transition-colors duration-300",
                index === currentStep
                  ? "text-primary font-medium group-hover:text-primary/90"
                  : index < currentStep
                  ? "text-muted-foreground group-hover:text-muted-foreground/80"
                  : "text-muted-foreground/70 group-hover:text-muted-foreground/90"
              )}
            >
              {step.name}
            </p>
          </button>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "mx-2 h-0.5 flex-1 transition-colors duration-300",
                index < currentStep ? "bg-green-500" : "bg-muted-foreground/30"
              )}
            />
          )}
        </React.Fragment>
      ))}
      </div>
    </div>
  );
};

export default Stepper;
