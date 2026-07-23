import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { startOfMonth, endOfMonth } from 'date-fns';
import { Database } from '@/integrations/supabase/types';
import { useSession } from './useSession';
import type { ProposalStatus } from '@/features/crm/proposals/proposalStatus';

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
  status: ProposalStatus;
  owner: string;
  created_at: string;
  updated_at: string;
  approved_at?: string | null;
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
  // Payment and settings
  payment_type?: string | null;
  cash_discount_percentage?: number | null;
  installment_number?: number | null;
  installment_value?: number | null;
  manual_installment_total?: number | null;
  // Validity settings
  is_validity_enabled?: boolean | null;
  validity_days?: number | null;
  // Theme settings
  proposal_logo_url?: string | null;
  proposal_gradient_theme?: string | null;
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
  clientId?: string | 'all';
  search?: string;
  sortBy?: 'created_at' | 'amount' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  period?: 'today' | '7days' | '30days' | '90days' | 'currentMonth' | 'all' | 'custom';
  dateField?: 'created_at' | 'approved_at'; // NEW: choose which date to filter
  customStartDate?: string; // NEW: custom date range start
  customEndDate?: string; // NEW: custom date range end
}

export const useProposals = () => {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const [filters, setFilters] = useState<ProposalFilters>({
    status: 'all',
    ownerId: 'all',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    period: 'all',
    dateField: 'created_at', // Default to creation date
    customStartDate: undefined,
    customEndDate: undefined
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Use React Query to fetch and cache proposals
  const { 
    data: proposals = [], 
    isLoading: loading,
    refetch: refetchProposals
  } = useQuery({
    queryKey: ['proposals', user?.id, filters],
    queryFn: async () => {
      try {
        if (!user?.id) return [];

        let query = supabase
          .from('proposals')
          .select(`
            *,
            app_users(name),
            clients(name, email, company, phone)
          `)
          .eq('owner', user.id);

        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        if (filters.ownerId && filters.ownerId !== 'all') {
          query = query.eq('owner', filters.ownerId);
        }

        if (filters.clientId && filters.clientId !== 'all') {
          query = query.eq('client_id', filters.clientId);
        }

        if (filters.search) {
          query = query.or(`title.ilike.%${filters.search}%,clients.name.ilike.%${filters.search}%`);
        }

        const dateField = filters.dateField || 'created_at';

        if (dateField === 'approved_at' && filters.period === 'all') {
          query = query.not('approved_at', 'is', null);
        }

        // Date filtering logic
        if (filters.period !== 'all') {
          const now = new Date();
          let filterStartDate: Date | null = null;
          let filterEndDate: Date | null = null;

          switch (filters.period) {
            case 'today':
              filterStartDate = new Date();
              filterStartDate.setHours(0, 0, 0, 0);
              filterEndDate = new Date();
              filterEndDate.setHours(23, 59, 59, 999);
              break;
            case '7days':
              filterStartDate = new Date();
              filterStartDate.setDate(now.getDate() - 7);
              filterStartDate.setHours(0, 0, 0, 0);
              break;
            case '30days':
              filterStartDate = new Date();
              filterStartDate.setDate(now.getDate() - 30);
              filterStartDate.setHours(0, 0, 0, 0);
              break;
            case '90days':
              filterStartDate = new Date();
              filterStartDate.setDate(now.getDate() - 90);
              filterStartDate.setHours(0, 0, 0, 0);
              break;
            case 'currentMonth':
              filterStartDate = startOfMonth(now);
              filterEndDate = endOfMonth(now);
              break;
            case 'custom':
              if (filters.customStartDate) {
                filterStartDate = new Date(filters.customStartDate);
                filterStartDate.setHours(0, 0, 0, 0);
              }
              if (filters.customEndDate) {
                filterEndDate = new Date(filters.customEndDate);
                filterEndDate.setHours(23, 59, 59, 999);
              }
              break;
          }

          // Apply date filters based on selected date field
          if (filterStartDate) {
            query = query.gte(dateField, filterStartDate.toISOString());
          }
          if (filterEndDate) {
            query = query.lte(dateField, filterEndDate.toISOString());
          }
        }

        const sortField = filters.sortBy || 'created_at';
        query = query.order(sortField, { ascending: filters.sortOrder === 'asc' });

        const { data, error } = await query;

        if (error) throw error;
        return data as Proposal[];
      } catch (error) {
        console.error('Error fetching proposals:', error);
        toast.error('Erro ao carregar propostas');
        return [];
      }
    },
    staleTime: 30000, // 30 seconds before refetching
    enabled: !!user?.id,
  });
  
  const fetchProposals = useCallback(() => {
    return refetchProposals();
  }, [refetchProposals]);

  const createProposal = async (proposalData: CreateProposalData) => {
    try {
      const { services, ...proposalHeaderData } = proposalData;
      
      // Definir created_at e updated_at para a data atual
      const currentTimestamp = new Date().toISOString();
      
      const { data: newProposal, error: proposalError } = await supabase
        .from('proposals')
        .insert({ 
          ...proposalHeaderData, 
          status: proposalHeaderData.status || 'Enviada',
          created_at: currentTimestamp,
          updated_at: currentTimestamp
        })
        .select(`
          *,
          app_users(name),
          clients(name, email, company, phone)
        `)
        .single();

      if (proposalError) {
        console.error('Proposal creation error:', proposalError);
        throw proposalError;
      }

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

      // Invalidate all proposal queries to refresh data everywhere
      queryClient.invalidateQueries();
      toast.success('Proposta criada com sucesso');
      return { data: fetchedProposal as Proposal, error: null };
    } catch (error: unknown) {
      console.error('Error creating proposal:', error);
      toast.error('Erro ao criar proposta');
      return { data: null, error };
    }
  };

  const createDraftProposal = async (proposalData: CreateProposalData) => {
    try {
      const { services, ...proposalHeaderData } = proposalData;
      
      // Definir created_at e updated_at para a data atual
      const currentTimestamp = new Date().toISOString();

      const { data: newProposal, error: proposalError } = await supabase
        .from('proposals')
        .insert({ 
          ...proposalHeaderData, 
          status: 'Rascunho',
          created_at: currentTimestamp,
          updated_at: currentTimestamp
        })
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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

      // Invalidate all proposal queries to refresh data everywhere
      queryClient.invalidateQueries();
      toast.success('Proposta atualizada com sucesso');
      return { data: fetchedProposal as Proposal, error: null };
    } catch (error: unknown) {
      console.error('Error updating proposal:', error);
      toast.error('Erro ao atualizar proposta');
      return { data: null, error };
    }
  };

  const updateProposalStatus = async (id: string, status: Proposal['status']) => {
    return updateProposal(id, { status });
  };

  const duplicateProposal = async (id: string, currentUserId: string, options?: {
    newClientId?: string | null;
    newTitle?: string;
  }) => {
    try {
      // Fetch the proposal to duplicate
      const { data: originalProposal, error: fetchError } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError || !originalProposal) {
        toast.error('Proposta não encontrada');
        return { data: null, error: fetchError || 'Proposal not found' };
      }

      // Fetch original proposal services
      const { data: originalServices, error: servicesFetchError } = await supabase
        .from('proposal_services')
        .select('*')
        .eq('proposal_id', id);

      if (servicesFetchError) throw servicesFetchError;

      // Data atual para os campos created_at e updated_at
      const currentTimestamp = new Date().toISOString();

      // Converter todos os valores numéricos com segurança
      const safeNumber = (value: unknown): number => {
        if (value === null || value === undefined || value === '') return 0;
        const num = Number(value);
        return Number.isNaN(num) ? 0 : num;
      };

      const duplicateData: CreateProposalData = {
        title: options?.newTitle || `${originalProposal.title} (Cópia)`,
        amount: safeNumber(originalProposal.amount),
        client_id: options?.newClientId !== undefined ? options.newClientId : originalProposal.client_id,
        owner: currentUserId,
        status: 'Criada', // Sempre define o status como 'Criada' para evitar o constraint error
        notes: originalProposal.notes || null,
        expected_close_date: originalProposal.expected_close_date || null,
        // Copy all payment and theme settings
        payment_type: originalProposal.payment_type || null,
        cash_discount_percentage: safeNumber(originalProposal.cash_discount_percentage),
        installment_number: safeNumber(originalProposal.installment_number),
        installment_value: safeNumber(originalProposal.installment_value),
        manual_installment_total: safeNumber(originalProposal.manual_installment_total),
        is_validity_enabled: originalProposal.is_validity_enabled || null,
        validity_days: safeNumber(originalProposal.validity_days),
        proposal_logo_url: originalProposal.proposal_logo_url || null,
        proposal_gradient_theme: originalProposal.proposal_gradient_theme || null,
        services: originalServices?.map(s => ({
          service_id: s.service_id || '',
          name: s.name || '',
          description: s.description || null,
          base_price: safeNumber(s.base_price),
          quantity: safeNumber(s.quantity) || 1,
          custom_price: s.custom_price !== null ? safeNumber(s.custom_price) : null,
          discount: safeNumber(s.discount),
          discount_percentage: safeNumber(s.discount_percentage),
          discount_type: s.discount_type || 'fixed',
          features: Array.isArray(s.features) ? s.features : [],
          category: s.category || null,
          icon: s.icon || '✨',
          is_custom: Boolean(s.is_custom),
          billing_type: s.billing_type || 'one_time',
        })) || []
      };

      // Log para debug dos valores copiados
      console.log('Duplicating proposal with data:', {
        cash_discount_percentage: duplicateData.cash_discount_percentage,
        installment_number: duplicateData.installment_number,
        installment_value: duplicateData.installment_value,
        manual_installment_total: duplicateData.manual_installment_total,
        services_with_discount: duplicateData.services?.filter(s => s.discount > 0 || s.discount_percentage > 0)
      });
      
      return createProposal(duplicateData);
    } catch (error: unknown) {
      console.error('Error duplicating proposal:', error);
      toast.error('Erro ao duplicar proposta');
      return { data: null, error };
    }
  };

  const deleteProposal = async (id: string) => {
    try {
      // First, explicitly delete all related proposal_services
      const { error: servicesError } = await supabase
        .from('proposal_services')
        .delete()
        .eq('proposal_id', id);

      if (servicesError) {
        console.warn('Error deleting proposal services:', servicesError);
        // Continue with proposal deletion even if services deletion fails
        // (CASCADE DELETE should handle this)
      }

      // Then delete the proposal itself
      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Invalidate ALL queries that might contain proposals
      // This will force all components using proposals to refetch
      queryClient.invalidateQueries();
      
      toast.success('Proposta e todos os dados relacionados foram excluídos com sucesso');
      return { error: null };
    } catch (error: unknown) {
      console.error('Error deleting proposal:', error);
      toast.error('Erro ao excluir proposta');
      return { error };
    }
  };

  // Pagination
  const totalItems = proposals.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedProposals = proposals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
    refetch: fetchProposals
  };
};
