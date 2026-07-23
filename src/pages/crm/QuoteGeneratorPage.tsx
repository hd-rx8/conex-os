import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Stepper from '@/components/Stepper';
import { useQuoteWizard } from '@/context/QuoteWizardContext';
import StepServices from '@/components/quote-wizard/StepServices';
import StepSettings from '@/components/quote-wizard/StepSettings';
import StepClient from '@/components/quote-wizard/StepClient';
import StepReview from '@/components/quote-wizard/StepReview';
import MainLayout from '@/components/MainLayout';
import { ContentCard } from '@/components/layout/ContentCard';
import { PageHeader } from '@/components/layout/PageHeader';

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
    <MainLayout module="crm">
      <div className="app-page">
        <PageHeader
          eyebrow="CRM"
          title="Gerador de propostas"
          description={`Etapa ${currentStep + 1} de ${steps.length}: ${steps[currentStep]?.name || 'Configuração'}.`}
        />

        <div className="mx-auto w-full max-w-6xl">
          <ContentCard
            className="overflow-visible"
            contentClassName="space-y-6 p-4 sm:p-6"
          >
            <Stepper />

            <div className="min-h-[360px]">
              {renderStepContent()}
            </div>

            <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-between border-t bg-background/95 px-4 py-4 backdrop-blur no-print sm:-mx-6 sm:px-6">
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
          </ContentCard>
        </div>
      </div>
    </MainLayout>
  );
};

export default QuoteGeneratorPage;
