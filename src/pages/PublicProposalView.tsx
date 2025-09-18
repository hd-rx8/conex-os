import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProposals, Proposal, ProposalService } from '@/hooks/useProposals'; // Import ProposalService
import QuoteResult from '@/components/QuoteResult';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { useQuoteGenerator } from '@/hooks/useQuoteGenerator'; // To get default values for calculations
import { useGradientTheme } from '@/context/GradientThemeContext'; // To get gradient theme options

const PublicProposalView: React.FC = () => {
  const { share_token } = useParams<{ share_token: string }>();
  const { getProposalByShareToken } = useProposals();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use useQuoteGenerator to get default calculation functions and static services
  const {
    services: staticServices,
    paymentOptions,
    calculateOriginalSubtotal,
    calculateTotal,
    calculateCashDiscount,
    calculateFinalTotal,
    calculateInstallmentInterestRate,
    getTotalInstallmentValue,
    calculateOneTimeTotal, // New
    calculateMonthlyTotal, // New
  } = useQuoteGenerator('public-user-id'); // Pass a dummy user ID for public view

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

  if (error || !proposal) {
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

  // Reconstruct data for QuoteResult based on fetched proposal
  // This part would be more robust if full proposal details were stored in DB
  // Now we use proposal.proposal_services directly
  const reconstructedServices = proposal.proposal_services?.map(ps => ({
    id: ps.service_id,
    name: ps.name,
    description: ps.description || '',
    basePrice: ps.base_price,
    category: ps.category || 'Geral',
    icon: ps.icon || '✨',
    features: ps.features || [],
    quantity: ps.quantity,
    customPrice: ps.custom_price || undefined,
    discount: ps.discount,
    discountPercentage: ps.discount_percentage,
    discountType: ps.discount_type as 'percentage' | 'value',
    customFeatures: ps.features || [],
    isCustom: ps.is_custom,
    billing_type: ps.billing_type,
  })) || [];

  const reconstructedClientInfo = {
    name: proposal.clients?.name || 'Cliente',
    email: proposal.clients?.email || 'contato@conexhub.com.br',
    company: proposal.clients?.company || 'Empresa',
    phone: proposal.clients?.phone || '(XX) X XXXX-XXXX',
  };

  // For public view, we'll simplify payment to just the final amount
  const finalAmount = proposal.amount;
  const cashDiscountPercentage = 0; // No cash discount shown in public view unless explicitly stored
  const totalAfterCashDiscount = finalAmount;

  const reconstructedPayment = {
    name: 'Valor Total',
    fee: 0,
    installments: 1,
    type: 'cash',
    installmentValue: finalAmount,
    totalInstallmentValue: finalAmount,
  };

  // Calculate one-time and monthly totals from reconstructed services
  const oneTimeTotal = reconstructedServices
    .filter(s => s.billing_type === 'one_time')
    .reduce((sum, s) => sum + ((s.customPrice || s.basePrice) * s.quantity - (s.discount || 0)), 0);

  const monthlyTotal = reconstructedServices
    .filter(s => s.billing_type === 'monthly')
    .reduce((sum, s) => sum + ((s.customPrice || s.basePrice) * s.quantity - (s.discount || 0)), 0);


  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <QuoteResult
          selectedServices={reconstructedServices}
          clientInfo={reconstructedClientInfo}
          subtotal={oneTimeTotal + monthlyTotal} // Total subtotal
          discount={0}
          discountType="percentage"
          discountPercentage={0}
          total={oneTimeTotal + monthlyTotal} // Total after service discounts
          cashDiscount={cashDiscountPercentage}
          finalTotal={totalAfterCashDiscount}
          selectedPayment={reconstructedPayment}
          installmentTotal={finalAmount}
          notes={proposal.notes || ''} // Now uses the actual notes from the proposal
          isValidityEnabled={false} // Public view doesn't show validity
          validityDays={0}
          proposalTitle={proposal.title}
          proposalLogoUrl="/lovable-uploads/7ef1a887-0fe7-4cc3-bfc3-2d24e0251f8e.png" // Default logo for public view
          proposalGradientTheme="conexhub" // Default theme for public view
          oneTimeTotal={oneTimeTotal} // Pass one-time total
          monthlyTotal={monthlyTotal} // Pass monthly total
        />
      </div>
    </div>
  );
};

export default PublicProposalView;