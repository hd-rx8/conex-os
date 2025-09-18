import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrency } from '@/context/CurrencyContext';
import { format, startOfMonth, subMonths, endOfMonth } from 'date-fns'; // Adicionado endOfMonth
import { ptBR } from 'date-fns/locale'; // Import ptBR locale
import { Database } from '@/integrations/supabase/types'; // Import Database types
import { useSession } from './useSession'; // Import useSession

type BillingType = Database['public']['Enums']['billing_type'];

export interface ProposalService {
  id: string;
  proposal_id: string;
  service_id: string;
  name: string;
  description: string | null;
  base_price: number;
  quantity: number;
  custom_price: number | null;
  discount: number;
  discount_percentage: number;
  discount_type: string;
  features: string[];
  category: string | null;
  icon: string | null;
  is_custom: boolean;
  billing_type: BillingType;
  created_at: string;
}

export interface Proposal {
  id: string;
  title: string;
  amount: number;
  client_id: string | null;
  status: 'Criada' | 'Enviada' | 'Aprovada' | 'Rejeitada' | 'Rascunho';
  owner: string;
  created_at: string;
  updated_at: string;
  share_token: string | null;
  notes: string | null; // Added notes field
  expected_close_date: string | null; // NEW: expected_close_date
  app_users?: {
    name: string;
  };
  clients?: {
    name: string | null;
    email: string | null;
    company: string | null;
    phone: string | null;
  };
  proposal_services?: ProposalService[]; // Added proposal_services
}

export interface CreateProposalData {
  title: string;
  amount: number;
  client_id?: string | null;
  owner: string;
  status?: Proposal['status'];
  notes?: string | null; // Added notes field
  expected_close_date?: string | null; // NEW: expected_close_date
  services?: Omit<ProposalService, 'id' | 'proposal_id' | 'created_at'>[]; // Services to be inserted
}

export interface UpdateProposalData {
  title?: string;
  amount?: number;
  client_id?: string | null;
  owner?: string;
  status?: Proposal['status'];
  notes?: string | null; // Added notes field
  created_at?: string; // Added created_at for update
  updated_at?: string; // Added updated_at for update
  expected_close_date?: string | null; // NEW: expected_close_date
  services?: Omit<ProposalService, 'id' | 'proposal_id' | 'created_at'>[]; // Services to be updated/inserted
}

export interface ProposalFilters {
  status?: Proposal['status'] | 'all';
  ownerId?: string | 'all';
  search?: string;
  sortBy?: 'created_at' | 'amount';
  sortOrder?: 'asc' | 'desc';
  period?: 'today' | '7days' | '30days' | 'all';
}

export interface DashboardMetrics {
  totalProposals: number;
  totalValue: number;
  thisMonth: number; // NOW: total value approved this month (currency number)
  conversionRate: number;
}

export interface ChartData {
  month: string;
  approvedValue: number; // Represents total approved value for the month
  createdCount: number; // Represents total proposals created for the month
}

export const useProposals = () => {
  const queryClient = useQueryClient();
  const { user } = useSession(); // Get current user for RLS in RPC
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProposalFilters>({
    status: 'all',
    ownerId: 'all',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    period: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchProposals = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('proposals')
        .select(`
          *,
          app_users(name),
          clients(name, email, company, phone)
        `);

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.ownerId && filters.ownerId !== 'all') {
        query = query.eq('owner', filters.ownerId);
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,clients.name.ilike.%${filters.search}%`);
      }

      if (filters.period !== 'all') {
        const now = new Date();
        let filterDate = new Date();

        switch (filters.period) {
          case 'today':
            filterDate.setHours(0, 0, 0, 0);
            break;
          case '7days':
            filterDate.setDate(now.getDate() - 7);
            break;
          case '30days':
            filterDate.setDate(now.getDate() - 30);
            break;
        }
        query = query.gte('created_at', filterDate.toISOString());
      }

      if (filters.sortBy) {
        query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });
      }

      const { data, error } = await query;

      if (error) throw error;
      setProposals((data as Proposal[]) || []);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast.error('Erro ao carregar propostas');
    } finally {
      setLoading(false);
    }
  };

  const createProposal = async (proposalData: CreateProposalData) => {
    try {
      const { services, ...proposalHeaderData } = proposalData;

      const { data: newProposal, error: proposalError } = await supabase
        .from('proposals')
        .insert({ ...proposalHeaderData, status: proposalHeaderData.status || 'Enviada' })
        .select(`
          *,
          app_users(name),
          clients(name, email, company, phone)
        `)
        .single();

      if (proposalError) throw proposalError;

      if (services && newProposal) {
        const servicesToInsert = services.map(service => ({
          ...service,
          proposal_id: newProposal.id,
        }));
        const { error: servicesError } = await supabase
          .from('proposal_services')
          .insert(servicesToInsert);
        
        if (servicesError) throw servicesError;
      }
      
      // Refetch the newly created proposal with its services
      const { data: fetchedProposal, error: fetchError } = await supabase
        .from('proposals')
        .select(`
          *,
          app_users(name),
          clients(name, email, company, phone),
          proposal_services(*)
        `)
        .eq('id', newProposal.id)
        .single();

      if (fetchError) throw fetchError;

      setProposals(prev => [fetchedProposal as Proposal, ...prev]);
      toast.success('Proposta criada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['proposals', proposalData.owner] });
      return { data: fetchedProposal as Proposal, error: null };
    } catch (error: any) {
      console.error('Error creating proposal:', error);
      toast.error('Erro ao criar proposta');
      return { data: null, error };
    }
  };

  const createDraftProposal = async (proposalData: CreateProposalData) => {
    try {
      const { services, ...proposalHeaderData } = proposalData;

      const { data: newProposal, error: proposalError } = await supabase
        .from('proposals')
        .insert({ ...proposalHeaderData, status: 'Rascunho' })
        .select(`
          id,
          share_token,
          notes
        `) // Select notes here
        .single();

      if (proposalError) throw proposalError;

      if (services && newProposal) {
        const servicesToInsert = services.map(service => ({
          ...service,
          proposal_id: newProposal.id,
        }));
        const { error: servicesError } = await supabase
          .from('proposal_services')
          .insert(servicesToInsert);
        
        if (servicesError) throw servicesError;
      }
      
      toast.success('Rascunho da proposta salvo com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['proposals', proposalData.owner] });
      return { data: newProposal, error: null };
    } catch (error: any) {
      console.error('Error creating draft proposal:', error);
      toast.error('Erro ao salvar rascunho da proposta.');
      return { data: null, error };
    }
  };

  const getProposalByShareToken = async (shareToken: string) => {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select(`
          *,
          app_users(name),
          clients(name, email, company, phone),
          proposal_services(*)
        `)
        .eq('share_token', shareToken)
        .single();

      if (error) throw error;
      return { data: data as Proposal, error: null };
    } catch (error: any) {
      console.error('Error fetching proposal by share token:', error);
      return { data: null, error };
    }
  };

  const updateProposal = async (id: string, proposalData: UpdateProposalData) => {
    try {
      const { services, ...proposalHeaderData } = proposalData;

      const { data: updatedProposal, error: proposalError } = await supabase
        .from('proposals')
        .update(proposalHeaderData)
        .eq('id', id)
        .select(`
          *,
          app_users(name),
          clients(name, email, company, phone)
        `)
        .single();

      if (proposalError) throw proposalError;

      // Handle services update: delete existing and insert new ones
      if (services) {
        const { error: deleteError } = await supabase
          .from('proposal_services')
          .delete()
          .eq('proposal_id', id);
        
        if (deleteError) throw deleteError;

        const servicesToInsert = services.map(service => ({
          ...service,
          proposal_id: id,
        }));
        const { error: insertError } = await supabase
          .from('proposal_services')
          .insert(servicesToInsert);
        
        if (insertError) throw insertError;
      }
      
      // Refetch the updated proposal with its services
      const { data: fetchedProposal, error: fetchError } = await supabase
        .from('proposals')
        .select(`
          *,
          app_users(name),
          clients(name, email, company, phone),
          proposal_services(*)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      setProposals(prev => prev.map(proposal => proposal.id === id ? fetchedProposal as Proposal : proposal));
      toast.success('Proposta atualizada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['proposals', updatedProposal.owner] });
      return { data: fetchedProposal as Proposal, error: null };
    } catch (error: any) {
      console.error('Error updating proposal:', error);
      toast.error('Erro ao atualizar proposta');
      return { data: null, error };
    }
  };

  const updateProposalStatus = async (id: string, status: Proposal['status']) => {
    return updateProposal(id, { status });
  };

  const duplicateProposal = async (id: string, currentUserId: string) => {
    try {
      const originalProposal = proposals.find(p => p.id === id);
      if (!originalProposal) {
        toast.error('Proposta não encontrada');
        return { data: null, error: 'Proposal not found' };
      }

      // Fetch original proposal services
      const { data: originalServices, error: servicesFetchError } = await supabase
        .from('proposal_services')
        .select('*')
        .eq('proposal_id', id);

      if (servicesFetchError) throw servicesFetchError;

      const duplicateData: CreateProposalData = {
        title: `${originalProposal.title} (Cópia)`,
        amount: originalProposal.amount,
        client_id: originalProposal.client_id,
        owner: currentUserId,
        status: 'Rascunho', // Duplicates start as Rascunho
        notes: originalProposal.notes, // Include notes from original proposal
        expected_close_date: originalProposal.expected_close_date, // Include expected_close_date
        services: originalServices?.map(s => ({
          service_id: s.service_id,
          name: s.name,
          description: s.description,
          base_price: s.base_price,
          quantity: s.quantity,
          custom_price: s.custom_price,
          discount: s.discount,
          discount_percentage: s.discount_percentage,
          discount_type: s.discount_type,
          features: s.features,
          category: s.category,
          icon: s.icon,
          is_custom: s.is_custom,
          billing_type: s.billing_type,
        })) || []
      };

      return createProposal(duplicateData);
    } catch (error: any) {
      console.error('Error duplicating proposal:', error);
      toast.error('Erro ao duplicar proposta');
      return { data: null, error };
    }
  };

  const deleteProposal = async (id: string) => {
    try {
      // Deleting proposal_services is handled by CASCADE DELETE on proposal_id
      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setProposals(prev => prev.filter(proposal => proposal.id !== id));
      toast.success('Proposta excluída com sucesso');
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting proposal:', error);
      toast.error('Erro ao excluir proposta');
      return { error };
    }
  };

  // Calculate dashboard metrics
  const metrics = useMemo((): DashboardMetrics => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    
    // Total proposals count
    const total = proposals.length;

    // Total value across all proposals
    const totalValue = proposals.reduce((sum, p) => sum + Number(p.amount), 0);

    // Total approved value in current month
    const approvedThisMonth = proposals
      .filter(p => p.status === 'Aprovada' && new Date(p.created_at) >= thisMonthStart)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const approvedProposals = proposals.filter(p => p.status === 'Aprovada');
    
    return {
      totalProposals: total,
      totalValue: totalValue,
      thisMonth: approvedThisMonth,
      conversionRate: proposals.length > 0 ? (approvedProposals.length / proposals.length) * 100 : 0
    };
  }, [proposals]);

  // Fetch chart data using Supabase RPC function
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      if (!user?.id) {
        setChartData([]);
        setChartLoading(false);
        return;
      }

      setChartLoading(true);
      try {
        const now = new Date();
        const sixMonthsAgo = subMonths(startOfMonth(now), 5); // Start of the month 6 months ago
        const endOfCurrentMonth = endOfMonth(now); // End of the current month

        const { data, error } = await supabase.rpc('proposals_aggregate', {
          p_user: user.id,
          p_from: sixMonthsAgo.toISOString(),
          p_to: endOfCurrentMonth.toISOString(),
          p_granularity: 'monthly'
        });

        if (error) throw error;

        const formattedData: ChartData[] = data.map(item => ({
          month: item.bucket_label, // e.g., "Jan 2023"
          approvedValue: Number(item.total_amount),
          createdCount: Number(item.total_count)
        }));
        setChartData(formattedData);
      } catch (error) {
        console.error('Error fetching chart data:', error);
        toast.error('Erro ao carregar dados do gráfico');
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartData();
  }, [user?.id]); // Refetch when user changes

  // Pagination
  const totalItems = proposals.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedProposals = proposals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    fetchProposals();
  }, [filters, currentPage]);

  return {
    proposals: paginatedProposals,
    allProposals: proposals,
    loading,
    filters,
    setFilters,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    createProposal,
    createDraftProposal,
    getProposalByShareToken,
    updateProposal,
    updateProposalStatus,
    duplicateProposal,
    deleteProposal,
    metrics,
    chartData,
    chartLoading, // Export chart loading state
    refetch: fetchProposals
  };
};