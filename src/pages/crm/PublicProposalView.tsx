import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProposals, Proposal, ProposalService } from '@/hooks/useProposals'; // Import ProposalService
import ProposalDocument from '@/components/ProposalDocument';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { reconstructService, calculateServiceTotals, normalizeProposal, computeTotals } from '@/lib/proposalUtils';
import { ProposalSnapshot } from '@/types/proposalSnapshot';

const PublicProposalView: React.FC = () => {
  const { share_token } = useParams<{ share_token: string }>();
  const { getProposalByShareToken } = useProposals();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [snapshot, setSnapshot] = useState<ProposalSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProposal = async () => {
      if (!share_token) {
        setError('Token de compartilhamento inválido.');
        setLoading(false);
        return;
      }

      const { data, error } = await getProposalByShareToken(share_token);
      if (error) {
        setError('Proposta não encontrada ou token inválido.');
      } else {
        setProposal(data);
        
        // Create snapshot from the proposal data
        if (data) {
          const normalizedProposal = normalizeProposal(data);
          const { totalCash, totalInstallment } = computeTotals(normalizedProposal);
          const reconstructedServices = data.proposal_services?.map(ps => reconstructService(ps)) || [];
          const { oneTimeTotal, monthlyTotal } = calculateServiceTotals(reconstructedServices);
          
          const proposalSnapshot: ProposalSnapshot = {
            id: data.id,
            title: data.title,
            amount: normalizedProposal.amount,
            status: data.status,
            created_at: data.created_at,
            updated_at: data.updated_at,
            notes: data.notes,
            
            client: {
              id: data.clients?.id || '',
              name: data.clients?.name || 'Cliente',
              email: data.clients?.email || 'contato@conexhub.com.br',
              company: data.clients?.company || 'Empresa',
              phone: data.clients?.phone || '(XX) X XXXX-XXXX',
            },
            
            services: data.proposal_services?.map(ps => ({
              id: ps.id,
              service_id: ps.service_id,
              name: ps.name,
              description: ps.description || '',
              base_price: Number(ps.base_price) || 0,
              quantity: Number(ps.quantity) || 1,
              custom_price: ps.custom_price ? Number(ps.custom_price) : undefined,
              discount: Number(ps.discount) || 0,
              discount_percentage: Number(ps.discount_percentage) || 0,
              discount_type: ps.discount_type || 'percentage',
              features: Array.isArray(ps.features) ? ps.features : [],
              category: ps.category || 'Geral',
              icon: ps.icon || '✨',
              is_custom: Boolean(ps.is_custom),
              billing_type: ps.billing_type || 'one_time',
            })) || [],
            
            payment: {
              type: (data.payment_type as 'cash' | 'installment') || 'cash',
              cash_discount_percentage: normalizedProposal.cash_discount_percentage,
              installment_number: normalizedProposal.installment_number,
              installment_value: normalizedProposal.installment_value,
              manual_installment_total: normalizedProposal.manual_installment_total,
            },
            
            validity: {
              enabled: Boolean(data.is_validity_enabled),
              days: Number(data.validity_days) || 0,
            },
            
            theme: {
              logo_url: data.proposal_logo_url || '/lovable-uploads/7ef1a887-0fe7-4cc3-bfc3-2d24e0251f8e.png',
              resolved_logo_url: data.proposal_logo_url || '/lovable-uploads/7ef1a887-0fe7-4cc3-bfc3-2d24e0251f8e.png',
              gradient_theme: data.proposal_gradient_theme || 'conexhub',
            },
            
            totals: {
              oneTimeTotal,
              monthlyTotal,
              subtotal: oneTimeTotal + monthlyTotal,
              totalCash,
              totalInstallment,
            },
          };
          
          setSnapshot(proposalSnapshot);
        }
      }
      setLoading(false);
    };

    fetchProposal();
  }, [share_token, getProposalByShareToken]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        <p className="ml-4 text-muted-foreground">Carregando proposta...</p>
      </div>
    );
  }

  if (error || !proposal || !snapshot) {
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
            <p className="text-red-800">{error || 'A proposta não pôde ser carregada. Verifique o link.'}</p>
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