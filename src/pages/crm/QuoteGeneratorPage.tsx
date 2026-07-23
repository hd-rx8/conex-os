import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useProposals } from '@/hooks/useProposals';
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
  const navigate = useNavigate();
  const { duplicateProposal } = useProposals();
  const [isDuplicating, setIsDuplicating] = React.useState(false);
  const isDuplicatingRef = React.useRef(false);
  const {
    mode,
    proposalMeta,
    isHydrating,
    loadError,
    isLocked,
    isDirty,
    currentStep,
    goToNextStep,
    goToPreviousStep,
    reloadProposal,
    steps,
    selectedServices,
    clientInfo,
    proposalTitle,
  } = useQuoteWizard();
  const isEditing = mode === 'edit';

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

  const handleDuplicateProposal = async () => {
    if (!proposalMeta || isDuplicatingRef.current) return;

    isDuplicatingRef.current = true;
    setIsDuplicating(true);
    try {
      const { data, error } = await duplicateProposal(proposalMeta.id, userId);
      if (!error && data?.id) {
        navigate(`/generator/${data.id}/edit`);
      }
    } finally {
      isDuplicatingRef.current = false;
      setIsDuplicating(false);
    }
  };

  const header = (
    <PageHeader
      eyebrow="CRM"
      title={isEditing ? 'Editando proposta' : 'Gerador de propostas'}
      description={isEditing && proposalMeta
        ? proposalMeta.title
        : `Etapa ${currentStep + 1} de ${steps.length}: ${steps[currentStep]?.name || 'Configuração'}.`}
      actions={isEditing && proposalMeta ? (
        <>
          <Badge variant="outline">{proposalMeta.status}</Badge>
          {isDirty && <Badge variant="secondary">Alterações não salvas</Badge>}
        </>
      ) : undefined}
    />
  );

  if (isEditing && isHydrating) {
    return (
      <MainLayout module="crm">
        <div className="app-page">
          {header}
          <div className="mx-auto w-full max-w-6xl" data-testid="proposal-editor-loading">
            <ContentCard contentClassName="space-y-6 p-4 sm:p-6">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-[360px] w-full" />
              <div className="flex justify-between border-t pt-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </ContentCard>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isEditing && loadError) {
    return (
      <MainLayout module="crm">
        <div className="app-page">
          {header}
          <div className="mx-auto w-full max-w-3xl">
            <ContentCard
              title="Não foi possível abrir a proposta"
              description="Não foi possível abrir esta proposta. Ela pode não existir ou não estar disponível para sua conta."
              contentClassName="flex flex-wrap gap-3 p-4 sm:p-6"
            >
              <Button onClick={() => void reloadProposal()}>Tentar novamente</Button>
              <Button variant="outline" onClick={() => navigate('/opportunities')}>Voltar para oportunidades</Button>
            </ContentCard>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isEditing && isLocked) {
    const status = proposalMeta?.status ?? 'finalizada';
    return (
      <MainLayout module="crm">
        <div className="app-page">
          {header}
          <div className="mx-auto w-full max-w-3xl">
            <ContentCard
              title="Proposta bloqueada para edição"
              description={`Esta proposta está ${status} e não pode mais ser alterada. Você ainda pode visualizá-la ou criar uma cópia editável.`}
              contentClassName="flex flex-wrap gap-3 p-4 sm:p-6"
            >
              <Button
                onClick={() => {
                  if (proposalMeta?.shareToken) window.open(`/p/${proposalMeta.shareToken}`, '_blank', 'noopener,noreferrer');
                }}
                disabled={!proposalMeta?.shareToken}
              >
                Visualizar proposta
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleDuplicateProposal()}
                disabled={isDuplicating}
              >
                {isDuplicating && <Loader2 className="h-4 w-4 animate-spin" />}
                {isDuplicating ? 'Duplicando proposta...' : 'Duplicar proposta'}
              </Button>
            </ContentCard>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout module="crm">
      <div className="app-page">
        {header}

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
