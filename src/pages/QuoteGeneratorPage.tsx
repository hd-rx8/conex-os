import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Calculator as CalculatorIcon } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Stepper from '@/components/Stepper';
import { useQuoteWizard } from '@/context/QuoteWizardContext';
import StepServices from '@/components/quote-wizard/StepServices';
import StepSettings from '@/components/quote-wizard/StepSettings';
import StepClient from '@/components/quote-wizard/StepClient';
import StepReview from '@/components/quote-wizard/StepReview';
import Layout from '@/components/Layout';

interface QuoteGeneratorPageProps {
  userId: string;
}

const QuoteGeneratorPage: React.FC<QuoteGeneratorPageProps> = ({ userId }) => {
  const { currentStep, goToNextStep, goToPreviousStep, steps, selectedServices, clientInfo, proposalTitle } = useQuoteWizard();

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'services':
        return <StepServices />;
      case 'settings':
        return <StepSettings />;
      case 'client':
        return <StepClient />;
      case 'review':
        return <StepReview />;
      default:
        return null;
    }
  };

  // Validation for "Next" button
  const isStepValid = () => {
    switch (steps[currentStep].id) {
      case 'services':
        return selectedServices.length > 0;
      case 'settings':
        return !!proposalTitle.trim(); // Proposal title is required
      case 'client':
        return !!clientInfo.name.trim() && !!clientInfo.email.trim();
      case 'review':
        return selectedServices.length > 0 && !!clientInfo.name.trim() && !!clientInfo.email.trim() && !!proposalTitle.trim();
      default:
        return true;
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <PageHeader
        title="Gerador de Orçamentos"
        subtitle="Crie propostas profissionais em minutos"
        icon={CalculatorIcon}
      />

      <Stepper />

      <div className="flex-1 pb-20">
        {renderStepContent()}
      </div>

      {/* Fixed Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-40 no-print">
        <div className="container mx-auto px-4 py-3 flex justify-between">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={goToNextStep}
              disabled={!isStepValid()}
              className="gradient-button-bg"
            >
              Próximo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <div /> 
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteGeneratorPage;