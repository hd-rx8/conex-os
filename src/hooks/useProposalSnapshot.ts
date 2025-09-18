import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProposalSnapshot } from '@/types/proposalSnapshot';
import { normalizeProposal, computeTotals, calculateServiceTotals, reconstructService } from '@/lib/proposalUtils';

/**
 * Fetches a complete proposal snapshot for print/PDF generation
 * This is the single source of truth for proposal data
 */
export const getProposalSnapshot = async (proposalId: string): Promise<ProposalSnapshot> => {
  // Fetch proposal with all related data
  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .select(`
      *,
      app_users(name),
      clients(id, name, email, company, phone),
      proposal_services(*)
    `)
    .eq('id', proposalId)
    .single();

  if (proposalError) {
    throw new Error(`Failed to fetch proposal: ${proposalError.message}`);
  }

  if (!proposal) {
    throw new Error('Proposal not found');
  }

  // Normalize the proposal data
  const normalizedProposal = normalizeProposal(proposal);
  
  // Compute totals
  const { totalCash, totalInstallment } = computeTotals(normalizedProposal);
  
  // Reconstruct services
  const reconstructedServices = proposal.proposal_services?.map(ps => reconstructService(ps)) || [];
  const { oneTimeTotal, monthlyTotal } = calculateServiceTotals(reconstructedServices);
  
  // Resolve logo URL (handle both relative and absolute URLs)
  const resolveLogoUrl = (logoUrl: string): string => {
    if (!logoUrl) {
      return '/lovable-uploads/7ef1a887-0fe7-4cc3-bfc3-2d24e0251f8e.png'; // Default logo
    }
    
    // If it's already an absolute URL, return as is
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
      return logoUrl;
    }
    
    // If it's a Supabase storage URL, we might need to create a signed URL
    // For now, return as is - this can be enhanced later
    return logoUrl;
  };

  // Build the snapshot
  const snapshot: ProposalSnapshot = {
    // Basic proposal data
    id: proposal.id,
    title: proposal.title,
    amount: normalizedProposal.amount,
    status: proposal.status,
    created_at: proposal.created_at,
    updated_at: proposal.updated_at,
    notes: proposal.notes,
    
    // Client data
    client: {
      id: proposal.clients?.id || '',
      name: proposal.clients?.name || 'Cliente',
      email: proposal.clients?.email || 'contato@conexhub.com.br',
      company: proposal.clients?.company || 'Empresa',
      phone: proposal.clients?.phone || '(XX) X XXXX-XXXX',
    },
    
    // Services data
    services: proposal.proposal_services?.map(ps => ({
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
    
    // Payment and settings
    payment: {
      type: (proposal.payment_type as 'cash' | 'installment') || 'cash',
      cash_discount_percentage: normalizedProposal.cash_discount_percentage,
      installment_number: normalizedProposal.installment_number,
      installment_value: normalizedProposal.installment_value,
      manual_installment_total: normalizedProposal.manual_installment_total,
    },
    
    // Validity settings
    validity: {
      enabled: Boolean(proposal.is_validity_enabled),
      days: Number(proposal.validity_days) || 0,
    },
    
    // Theme and branding
    theme: {
      logo_url: proposal.proposal_logo_url || '/lovable-uploads/7ef1a887-0fe7-4cc3-bfc3-2d24e0251f8e.png',
      resolved_logo_url: resolveLogoUrl(proposal.proposal_logo_url || '/lovable-uploads/7ef1a887-0fe7-4cc3-bfc3-2d24e0251f8e.png'),
      gradient_theme: proposal.proposal_gradient_theme || 'conexhub',
    },
    
    // Computed totals
    totals: {
      oneTimeTotal,
      monthlyTotal,
      subtotal: oneTimeTotal + monthlyTotal,
      totalCash,
      totalInstallment,
    },
  };

  return snapshot;
};

/**
 * React hook for fetching proposal snapshot
 */
export const useProposalSnapshot = (proposalId: string, enabled = true) => {
  return useQuery({
    queryKey: ['proposal-snapshot', proposalId],
    queryFn: () => getProposalSnapshot(proposalId),
    enabled: enabled && !!proposalId,
    refetchOnMount: 'always', // Always fetch fresh data for print
    staleTime: 0, // Never use stale data for print
    retry: 2,
  });
};
