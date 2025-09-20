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
    <div className="flex items-center justify-between w-full max-w-3xl mx-auto mt-8 mb-8 no-print">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <button
            type="button"
            onClick={() => setStep(index)}
            aria-label={`Ir para o passo: ${step.name}`}
            aria-current={index === currentStep ? 'step' : undefined}
            className="flex flex-col items-center relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md p-1 -m-1 transition-all duration-200"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white transition-colors duration-300",
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
                "text-sm mt-2 text-center transition-colors duration-300",
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
                "flex-1 h-0.5 mx-2 transition-colors duration-300",
                index < currentStep ? "bg-green-500" : "bg-muted-foreground/30"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Stepper;