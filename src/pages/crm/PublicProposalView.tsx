import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ProposalDocument from '@/components/ProposalDocument';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { calculateServiceTotals, computeTotals, normalizeProposal, reconstructService } from '@/lib/proposalUtils';
import { getPublicProposalByToken } from '@/features/crm/proposals/proposalEditorApi';
import { ProposalSnapshot } from '@/types/proposalSnapshot';

type PublicProposalDocument = Record<string, unknown> & {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  proposal_services: Record<string, unknown>[];
};

const SAFE_PUBLIC_ERROR = 'Proposta não encontrada ou token inválido.';
const DEFAULT_LOGO = '/lovable-uploads/7ef1a887-0fe7-4cc3-bfc3-2d24e0251f8e.png';

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null
);

const stringValue = (value: unknown, fallback = ''): string => (
  typeof value === 'string' ? value : fallback
);

const numberValue = (value: unknown): number => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

const isPublicProposalDocument = (value: unknown): value is PublicProposalDocument => (
  isRecord(value)
  && typeof value.id === 'string'
  && typeof value.title === 'string'
  && typeof value.status === 'string'
  && typeof value.created_at === 'string'
  && typeof value.updated_at === 'string'
  && Array.isArray(value.proposal_services)
  && value.proposal_services.every(isRecord)
);

const mapPublicProposalSnapshot = (proposal: PublicProposalDocument): ProposalSnapshot => {
  const normalizedProposal = normalizeProposal(proposal);
  const { totalCash, totalInstallment } = computeTotals(normalizedProposal);
  const reconstructedServices = proposal.proposal_services.map(reconstructService);
  const { oneTimeTotal, monthlyTotal } = calculateServiceTotals(reconstructedServices);
  const client = isRecord(proposal.client) ? proposal.client : {};
  const logoUrl = stringValue(proposal.proposal_logo_url, DEFAULT_LOGO) || DEFAULT_LOGO;
  const gradientTheme = proposal.proposal_gradient_theme;

  return {
    id: proposal.id,
    title: proposal.title,
    amount: normalizedProposal.amount,
    status: proposal.status,
    created_at: proposal.created_at,
    updated_at: proposal.updated_at,
    notes: typeof proposal.notes === 'string' ? proposal.notes : undefined,
    client: {
      id: stringValue(client.id),
      name: stringValue(client.name, 'Cliente'),
      email: stringValue(client.email, 'contato@conexhub.com.br'),
      company: stringValue(client.company, 'Empresa'),
      phone: stringValue(client.phone, '(XX) X XXXX-XXXX'),
    },
    services: proposal.proposal_services.map((service) => ({
      id: stringValue(service.id),
      service_id: stringValue(service.service_id),
      name: stringValue(service.name, 'Serviço'),
      description: stringValue(service.description),
      base_price: numberValue(service.base_price),
      quantity: numberValue(service.quantity) || 1,
      custom_price: service.custom_price == null ? undefined : numberValue(service.custom_price),
      discount: numberValue(service.discount),
      discount_percentage: numberValue(service.discount_percentage),
      discount_type: stringValue(service.discount_type, 'percentage'),
      features: Array.isArray(service.features) ? service.features.filter((feature): feature is string => typeof feature === 'string') : [],
      category: stringValue(service.category, 'Geral'),
      icon: stringValue(service.icon, '✨'),
      is_custom: Boolean(service.is_custom),
      billing_type: service.billing_type === 'monthly' ? 'monthly' : 'one_time',
    })),
    payment: {
      type: proposal.payment_type === 'installment' ? 'installment' : 'cash',
      cash_discount_percentage: normalizedProposal.cash_discount_percentage,
      installment_number: normalizedProposal.installment_number,
      installment_value: normalizedProposal.installment_value,
      manual_installment_total: normalizedProposal.manual_installment_total,
      show_interest_rate: typeof proposal.show_interest_rate === 'boolean'
        ? proposal.show_interest_rate
        : true,
    },
    validity: {
      enabled: Boolean(proposal.is_validity_enabled),
      days: numberValue(proposal.validity_days),
    },
    theme: {
      logo_url: logoUrl,
      resolved_logo_url: logoUrl,
      gradient_theme: gradientTheme === 'alt1' || gradientTheme === 'alt2' ? gradientTheme : 'conexhub',
    },
    totals: {
      oneTimeTotal,
      monthlyTotal,
      subtotal: oneTimeTotal + monthlyTotal,
      totalCash,
      totalInstallment,
    },
  };
};

const PublicProposalView: React.FC = () => {
  const { share_token } = useParams<{ share_token: string }>();
  const [snapshot, setSnapshot] = useState<ProposalSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchProposal = async () => {
      if (!share_token) {
        if (active) {
          setError('Token de compartilhamento inválido.');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      setSnapshot(null);

      try {
        const document = await getPublicProposalByToken(share_token);
        if (!isPublicProposalDocument(document)) throw new Error('invalid public proposal document');

        if (active) setSnapshot(mapPublicProposalSnapshot(document));
      } catch {
        if (active) setError(SAFE_PUBLIC_ERROR);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchProposal();
    return () => { active = false; };
  }, [share_token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
        <p className="ml-4 text-muted-foreground">Carregando proposta...</p>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50/50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center justify-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Erro ao Carregar Proposta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800">{error || SAFE_PUBLIC_ERROR}</p>
            <a href="/" className="text-blue-500 hover:text-blue-700 underline mt-4 block">
              Voltar para a página inicial
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <ProposalDocument snapshot={snapshot} />
      </div>
    </div>
  );
};

export default PublicProposalView;
