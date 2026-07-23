import { Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { QuoteWizardProvider, type QuoteWizardMode } from '@/context/QuoteWizardContext';
import QuoteGeneratorPage from './QuoteGeneratorPage';

type QuoteGeneratorRouteProps = {
  userId: string;
  mode: QuoteWizardMode;
};

const QuoteGeneratorRoute = ({ userId, mode }: QuoteGeneratorRouteProps) => {
  const location = useLocation();
  const { proposalId } = useParams<{ proposalId: string }>();
  const [searchParams] = useSearchParams();

  if (mode === 'create') {
    const legacyProposalId = searchParams.get('proposalId');
    if (legacyProposalId) {
      return (
        <Navigate
          to={`/generator/${encodeURIComponent(legacyProposalId)}/edit`}
          replace
          state={location.state}
        />
      );
    }
  }

  if (mode === 'edit' && !proposalId) {
    return <div role="alert">Não foi possível carregar a proposta.</div>;
  }

  return (
    <QuoteWizardProvider
      key={`${mode}:${proposalId ?? 'create'}`}
      userId={userId}
      mode={mode}
      proposalId={proposalId}
    >
      <QuoteGeneratorPage userId={userId} />
    </QuoteWizardProvider>
  );
};

export default QuoteGeneratorRoute;
