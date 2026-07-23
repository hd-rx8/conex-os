import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useQuoteGenerator, SelectedService, ClientInfo, Service, PaymentOption } from '@/hooks/useQuoteGenerator';
import { useCustomServices, CustomService, CreateCustomServiceData, UpdateCustomServiceData } from '@/hooks/useCustomServices'; // Importar tipos aqui
import { useProposals, CreateProposalData, ProposalService } from '@/hooks/useProposals'; // Import ProposalService
import { useClients, Client, CreateClientData } from '@/hooks/useClients'; // Import useClients and Client types
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client'; // For client management
import { Database } from '@/integrations/supabase/types'; // Import Database types
import {
  getProposalEditorSnapshot,
  mapProposalEditorError,
  ProposalEditorDomainError,
  proposalQueryKeys,
  saveProposalEdit,
} from '@/features/crm/proposals/proposalEditorApi';
import {
  fingerprintProposalDraft,
  mapSnapshotToDraft,
} from '@/features/crm/proposals/proposalEditorMapper';
import type {
  ProposalEditorDraft,
  ProposalEditorErrorCode,
  ProposalEditorSnapshot,
} from '@/features/crm/proposals/proposalEditorTypes';
import { isLockedProposal } from '@/features/crm/proposals/proposalStatus';

type BillingType = Database['public']['Enums']['billing_type'];

export type QuoteWizardMode = 'create' | 'edit';

export interface ProposalMeta {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  shareToken: string | null;
}

interface QuoteWizardContextType {
  mode: QuoteWizardMode;
  proposalMeta: ProposalMeta | null;
  isHydrating: boolean;
  loadError: ProposalEditorErrorCode | null;
  isLocked: boolean;
  isDirty: boolean;
  isSaving: boolean;
  saveError: ProposalEditorErrorCode | null;
  saveProposalChanges?: () => Promise<boolean>;
  reloadProposal: () => Promise<void>;
  // Stepper state
  currentStep: number;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  setStep: (step: number) => void;
  steps: { id: string; name: string }[];

  // QuoteGenerator state and actions
  selectedServices: SelectedService[];
  clientInfo: ClientInfo;
  paymentType: 'cash' | 'installment';
  installmentNumber: number;
  installmentValue: number;
  manualInstallmentTotal: number | null;
  cashDiscountPercentage: number;
  notes: string;
  isValidityEnabled: boolean;
  validityDays: number;
  proposalTitle: string;
  proposalLogoUrl: string;
  proposalGradientTheme: 'conexhub' | 'alt1' | 'alt2';
  showInterestRate: boolean; // Novo: controle para mostrar taxa de juros

  addService: (service: Service) => void;
  removeService: (serviceId: string) => void;
  updateServiceQuantity: (serviceId: string, quantity: number) => void;
  updateServicePrice: (serviceId: string, customPrice: number) => void;
  updateServiceDiscount: (serviceId: string, discountValue: number, discountType?: 'percentage' | 'value') => void;
  updateServiceDiscountType: (serviceId: string, discountType: 'percentage' | 'value') => void;
  updateServiceFeatures: (serviceId: string, newFeatures: string[]) => void;
  setClientInfo: React.Dispatch<React.SetStateAction<ClientInfo>>;
  setPaymentType: React.Dispatch<React.SetStateAction<'cash' | 'installment'>>;
  setInstallmentNumber: React.Dispatch<React.SetStateAction<number>>;
  setInstallmentValue: React.Dispatch<React.SetStateAction<number>>;
  setManualInstallmentTotal: React.Dispatch<React.SetStateAction<number | null>>;
  setCashDiscountPercentage: React.Dispatch<React.SetStateAction<number>>;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
  setIsValidityEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setValidityDays: React.Dispatch<React.SetStateAction<number>>;
  setProposalTitle: React.Dispatch<React.SetStateAction<string>>;
  setProposalLogoUrl: React.Dispatch<React.SetStateAction<string>>;
  setProposalGradientTheme: React.Dispatch<React.SetStateAction<'conexhub' | 'alt1' | 'alt2'>>;
  setShowInterestRate: React.Dispatch<React.SetStateAction<boolean>>; // Novo: setter para mostrar taxa de juros

  calculateSubtotal: () => number;
  calculateOriginalSubtotal: () => number;
  calculateTotal: () => number;
  calculateOneTimeTotal: () => number; // New
  calculateMonthlyTotal: () => number; // New
  calculateCashDiscount: () => number;
  calculateCashTotal: () => number;
  calculateFinalTotal: () => number;
  calculateInstallmentInterestRate: () => number;
  getTotalInstallmentValue: () => number;
  getSelectedPayment: () => { name: string; fee: number; installments: number; type: 'cash' | 'installment'; installmentValue?: number; totalInstallmentValue?: number; };
  clearQuote: () => void;
  allAvailableServices: Service[];
  paymentOptions: PaymentOption[];

  // Custom Services
  customServices: CustomService[];
  fetchCustomServices: () => Promise<void>;
  createCustomService: (serviceData: CreateCustomServiceData) => Promise<{ data: CustomService | null; error: Error | null }>;
  updateCustomService: (id: string, serviceData: UpdateCustomServiceData) => Promise<{ data: CustomService | null; error: Error | null }>;
  deleteCustomService: (id: string) => Promise<{ error: Error | null }>;

  // Client Management
  existingClients: Client[]; // Changed type to Client[]
  fetchExistingClients: () => Promise<void>;
  selectedClientId: string | null;
  setSelectedClientId: React.Dispatch<React.SetStateAction<string | null>>;
  isNewClient: boolean;
  setIsNewClient: React.Dispatch<React.SetStateAction<boolean>>;
  createClient: (clientData: CreateClientData) => Promise<{ data: Client | null; error: Error | null }>; // Explicitly add createClient

  // New proposal actions
  generateShareableLink: (ownerId: string) => Promise<string | null>;
  registerProposal: (ownerId: string) => Promise<boolean>;
  
  // State for shareable link
  generatedShareLink: string | null;
  isGeneratingLink: boolean;
}

const QuoteWizardContext = createContext<QuoteWizardContextType | undefined>(undefined);

export const QuoteWizardProvider = ({
  children,
  userId,
  mode,
  proposalId,
}: {
  children: ReactNode;
  userId: string;
  mode: QuoteWizardMode;
  proposalId?: string;
}) => {
  const {
    selectedServices, clientInfo, selectedPayment, paymentType, installmentNumber, installmentValue, manualInstallmentTotal,
    cashDiscountPercentage, notes, isValidityEnabled, validityDays,
    addService, removeService, updateServiceQuantity, updateServicePrice, updateServiceDiscount, updateServiceDiscountType,
    updateServiceFeatures, setClientInfo, setSelectedPayment, setPaymentType, setInstallmentNumber, setInstallmentValue,
    setManualInstallmentTotal, setCashDiscountPercentage, setNotes, setIsValidityEnabled, setValidityDays,
    calculateSubtotal, calculateOriginalSubtotal, calculateTotal, calculateOneTimeTotal, calculateMonthlyTotal, calculateCashDiscount, calculateCashTotal,
    calculateFinalTotal, calculateInstallmentInterestRate, getTotalInstallmentValue, getSelectedPayment, clearQuote,
    services: allAvailableServicesFromHook, paymentOptions,
    proposalTitle, setProposalTitle, proposalLogoUrl, setProposalLogoUrl, proposalGradientTheme, setProposalGradientTheme,
    showInterestRate, setShowInterestRate, hydrateQuote,
  } = useQuoteGenerator(userId, []);

  const { customServices, fetchCustomServices, createCustomService, updateCustomService, deleteCustomService } = useCustomServices();
  const { createProposal, createDraftProposal } = useProposals();
  const { clients: existingClients, fetchClients: fetchExistingClients, createClient } = useClients(); // This is where createClient comes from
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isNewClient, setIsNewClient] = useState(false); // Default to false (select existing)
  const [generatedShareLink, setGeneratedShareLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [proposalMeta, setProposalMeta] = useState<ProposalMeta | null>(null);
  const [isHydrating, setIsHydrating] = useState(mode === 'edit');
  const [loadError, setLoadError] = useState<ProposalEditorErrorCode | null>(null);
  const [baselineFingerprint, setBaselineFingerprint] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<ProposalEditorErrorCode | null>(null);
  const hydratedVersionRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const steps = useMemo(() => [
    { id: 'services', name: 'Serviços' },
    { id: 'settings', name: 'Configurações' },
    { id: 'client', name: 'Cliente' },
    { id: 'review', name: 'Revisar' },
  ], []);

  const currentDraft = useMemo<ProposalEditorDraft>(() => ({
    selectedServices,
    clientInfo,
    selectedClientId,
    isNewClient,
    paymentType,
    installmentNumber,
    installmentValue,
    manualInstallmentTotal,
    cashDiscountPercentage,
    notes,
    isValidityEnabled,
    validityDays,
    proposalTitle,
    proposalLogoUrl,
    proposalGradientTheme,
    showInterestRate,
  }), [
    cashDiscountPercentage,
    clientInfo,
    installmentNumber,
    installmentValue,
    isNewClient,
    isValidityEnabled,
    manualInstallmentTotal,
    notes,
    paymentType,
    proposalGradientTheme,
    proposalLogoUrl,
    proposalTitle,
    selectedClientId,
    selectedServices,
    showInterestRate,
    validityDays,
  ]);
  const currentDraftRef = useRef(currentDraft);
  currentDraftRef.current = currentDraft;
  const isDirty = mode === 'edit'
    && baselineFingerprint !== null
    && fingerprintProposalDraft(currentDraft) !== baselineFingerprint;
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;
  const isLocked = mode === 'edit'
    && proposalMeta !== null
    && isLockedProposal(proposalMeta.status);

  const applySnapshot = useCallback((snapshot: ProposalEditorSnapshot) => {
    const draft = mapSnapshotToDraft(snapshot);
    const version = `${snapshot.id}:${snapshot.updated_at}`;
    setProposalMeta({
      id: snapshot.id,
      title: snapshot.title,
      status: snapshot.status,
      updatedAt: snapshot.updated_at,
      shareToken: snapshot.share_token,
    });

    if (hydratedVersionRef.current === version || isDirtyRef.current) return;

    hydratedVersionRef.current = version;
    hydrateQuote(draft);
    setSelectedClientId(draft.selectedClientId);
    setIsNewClient(draft.isNewClient);
    setCurrentStep(0);
    setGeneratedShareLink(snapshot.share_token ? `${window.location.origin}/p/${snapshot.share_token}` : null);
    setBaselineFingerprint(fingerprintProposalDraft(draft));
  }, [hydrateQuote]);

  const reloadProposal = useCallback(async () => {
    if (mode !== 'edit' || !proposalId) return;

    setIsHydrating(true);
    setLoadError(null);
    try {
      const snapshot = await getProposalEditorSnapshot(proposalId);
      if (!isMountedRef.current) return;
      applySnapshot(snapshot);
    } catch (error) {
      if (!isMountedRef.current) return;
      setLoadError(error instanceof ProposalEditorDomainError ? error.code : mapProposalEditorError(error));
    } finally {
      if (isMountedRef.current) setIsHydrating(false);
    }
  }, [applySnapshot, mode, proposalId]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (mode !== 'edit') return;
    void reloadProposal();
  }, [mode, reloadProposal]);

  const saveProposalChanges = useCallback(async (): Promise<boolean> => {
    if (mode !== 'edit' || !proposalId || !proposalMeta || isLocked) return false;

    const draft = currentDraftRef.current;
    setIsSaving(true);
    setSaveError(null);
    try {
      const result = await saveProposalEdit({
        proposalId,
        expectedUpdatedAt: proposalMeta.updatedAt,
        proposal: {
          title: draft.proposalTitle,
          client_id: draft.selectedClientId,
          notes: draft.notes || null,
          payment_type: draft.paymentType,
          cash_discount_percentage: draft.cashDiscountPercentage,
          installment_number: draft.installmentNumber,
          installment_value: draft.installmentValue,
          manual_installment_total: draft.manualInstallmentTotal,
          is_validity_enabled: draft.isValidityEnabled,
          validity_days: draft.validityDays,
          proposal_logo_url: draft.proposalLogoUrl,
          proposal_gradient_theme: draft.proposalGradientTheme,
          show_interest_rate: draft.showInterestRate,
        },
        services: draft.selectedServices.map((service) => ({
          service_id: service.id,
          name: service.name,
          description: service.description || null,
          base_price: service.base_price,
          quantity: service.quantity,
          custom_price: service.customPrice ?? null,
          discount: service.discount ?? 0,
          discount_percentage: service.discountPercentage ?? 0,
          discount_type: service.discountType ?? 'percentage',
          features: service.customFeatures ?? service.features,
          category: service.category || null,
          icon: service.icon || null,
          is_custom: service.isCustom ?? false,
          billing_type: service.billing_type,
        })),
        newClient: draft.isNewClient ? {
          name: draft.clientInfo.name,
          email: draft.clientInfo.email || null,
          company: draft.clientInfo.company || null,
          phone: draft.clientInfo.phone || null,
        } : null,
      });

      if (!result.success) {
        setSaveError(result.errorCode ?? 'unknown');
        return false;
      }

      const savedFingerprint = fingerprintProposalDraft(draft);
      isDirtyRef.current = false;
      setBaselineFingerprint(savedFingerprint);
      queryClient.invalidateQueries({ queryKey: proposalQueryKeys.ownerLists(userId) });
      queryClient.invalidateQueries({ queryKey: proposalQueryKeys.editor(proposalId) });
      queryClient.invalidateQueries({ queryKey: proposalQueryKeys.snapshot(proposalId) });
      if (proposalMeta.shareToken) {
        queryClient.invalidateQueries({ queryKey: proposalQueryKeys.public(proposalMeta.shareToken) });
      }
      await reloadProposal();
      return true;
    } catch {
      setSaveError('unknown');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [isLocked, mode, proposalId, proposalMeta, queryClient, reloadProposal, userId]);

  const validateCurrentStep = useCallback(() => {
    switch (steps[currentStep].id) {
      case 'services':
        if (selectedServices.length === 0) {
          toast.error('Selecione pelo menos um serviço para continuar.');
          return false;
        }
        return true;
      case 'settings':
        if (!proposalTitle.trim()) {
          toast.error('O título da proposta é obrigatório.');
          return false;
        }
        // Validação para pagamento parcelado
        if (paymentType === 'installment' && installmentValue === 0 && (manualInstallmentTotal === null || manualInstallmentTotal === 0)) {
          toast.error('Para pagamento parcelado, preencha o valor da parcela ou o total parcelado manual.');
          return false;
        }
        return true;
      case 'client':
        if (!clientInfo.name.trim() || !clientInfo.email.trim()) {
          toast.error('Nome e e-mail do cliente são obrigatórios.');
          return false;
        }
        return true;
      case 'review':
        // Review step implicitly validates previous steps, but we can add a final check
        if (selectedServices.length === 0 || !clientInfo.name.trim() || !clientInfo.email.trim() || !proposalTitle.trim()) {
          toast.error('Por favor, complete todos os passos obrigatórios antes de revisar.');
          return false;
        }
        return true;
      default:
        return true;
    }
  }, [currentStep, selectedServices, proposalTitle, clientInfo.name, clientInfo.email, steps, paymentType, installmentValue, manualInstallmentTotal]);


  const goToNextStep = useCallback(() => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  }, [validateCurrentStep, steps.length]);

  const goToPreviousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const setStep = useCallback((stepIndex: number) => {
    // Only allow direct jump to previous steps or the current step without validation
    if (stepIndex < currentStep) {
      setCurrentStep(stepIndex);
      return;
    }
    // For current or future steps, validate the current step first
    if (validateCurrentStep()) {
      setCurrentStep(Math.max(0, Math.min(stepIndex, steps.length - 1)));
    }
  }, [currentStep, validateCurrentStep, steps.length]);

  // Merge static and custom services
  const allAvailableServices = React.useMemo(() => {
    return [
      ...allAvailableServicesFromHook,
      ...customServices.map(cs => ({ ...cs, base_price: cs.base_price, isCustom: true }))
    ];
  }, [allAvailableServicesFromHook, customServices]);

  // Fetch custom services and existing clients on mount
  useEffect(() => {
    fetchCustomServices();
    fetchExistingClients();
  }, [fetchCustomServices, fetchExistingClients]);

  // When selecting an existing client, update clientInfo
  // OR when toggling to new client, clear clientInfo
  useEffect(() => {
    if (!isNewClient && selectedClientId) {
      const client = existingClients.find(c => c.id === selectedClientId);
      if (client) {
        setClientInfo({
          id: client.id,
          name: client.name,
          email: client.email || '',
          company: client.company || '',
          phone: client.phone || ''
        });
      }
    } else if (isNewClient) {
      // Clear clientInfo if switching to new client
      setClientInfo({ name: '', email: '', company: '', phone: '' });
      setSelectedClientId(null); // Clear selected client when creating new
    } else {
      // If not new client and no selected client, clear clientInfo
      setClientInfo({ name: '', email: '', company: '', phone: '' });
    }
  }, [isNewClient, selectedClientId, existingClients, setClientInfo]);


  const getOrCreateClientId = async (currentUserId: string): Promise<string | null> => {
    if (!currentUserId) {
      toast.error('Usuário logado não encontrado.');
      return null;
    }

    if (!isNewClient && selectedClientId) {
      return selectedClientId; // Use existing client
    } else if (isNewClient) { // Only create if isNewClient is true
      // Create new client
      const clientData: CreateClientData = {
        name: clientInfo.name,
        email: clientInfo.email || null,
        company: clientInfo.company || null,
        phone: clientInfo.phone || null,
        created_by: currentUserId,
      };
      const { data, error } = await createClient(clientData);
      if (error) {
        console.error('Error creating new client:', error);
        toast.error(`Erro ao criar novo cliente: ${error.message}`);
        return null;
      }
      return data?.id || null;
    }
    // If not new client and no selected client, return null (should be caught by validation)
    return null;
  };

  const buildProposalData = async (ownerId: string, status: CreateProposalData['status']): Promise<CreateProposalData | null> => {
    const clientId = await getOrCreateClientId(ownerId);
    if (!clientId) {
      return null;
    }

    const proposalServices: Omit<ProposalService, 'id' | 'proposal_id' | 'created_at'>[] = selectedServices.map(service => ({
      service_id: service.id,
      name: service.name,
      description: service.description,
      base_price: service.base_price,
      quantity: service.quantity,
      custom_price: service.customPrice || null,
      discount: service.discount || 0,
      discount_percentage: service.discountPercentage || 0,
      discount_type: service.discountType || 'percentage',
      features: service.customFeatures || service.features,
      category: service.category,
      icon: service.icon,
      is_custom: service.isCustom || false,
      billing_type: service.billing_type,
    }));

    return {
      title: proposalTitle,
      amount: calculateFinalTotal(), // This amount will be the final total
      client_id: clientId,
      owner: ownerId,
      status: status,
      notes: notes, // Include notes from state
      services: proposalServices, // Include services
      // Payment and settings
      payment_type: paymentType,
      cash_discount_percentage: cashDiscountPercentage,
      installment_number: installmentNumber,
      installment_value: installmentValue,
      manual_installment_total: manualInstallmentTotal,
      // Validity settings
      is_validity_enabled: isValidityEnabled,
      validity_days: validityDays,
      // Theme settings
      proposal_logo_url: proposalLogoUrl,
      proposal_gradient_theme: proposalGradientTheme,
      show_interest_rate: showInterestRate,
    };
  };

  const generateShareableLink = async (ownerId: string): Promise<string | null> => {
    if (mode !== 'create') return null;

    if (selectedServices.length === 0 || !clientInfo.name || !clientInfo.email || !proposalTitle) {
      toast.error('Por favor, preencha todos os campos obrigatórios e selecione pelo menos um serviço.');
      return null;
    }

    setIsGeneratingLink(true);
    try {
      const proposalData = await buildProposalData(ownerId, 'Rascunho');
      if (!proposalData) return null;

      const { data, error } = await createDraftProposal(proposalData);

      if (error) {
        toast.error('Erro ao gerar link compartilhável.');
      } else if (data?.share_token) {
        const link = `${window.location.origin}/p/${data.share_token}`;
        setGeneratedShareLink(link);
        return link;
      }
      return null;
    } catch (err) {
      console.error('Error in generateShareableLink:', err);
      return null;
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const registerProposal = async (ownerId: string): Promise<boolean> => {
    if (mode !== 'create') return false;

    if (selectedServices.length === 0 || !clientInfo.name || !clientInfo.email || !proposalTitle) {
      toast.error('Por favor, preencha todos os campos obrigatórios e selecione pelo menos um serviço.');
      return false;
    }

    try {
      const proposalData = await buildProposalData(ownerId, 'Enviada');
      if (!proposalData) return false;

      const { data, error } = await createProposal(proposalData);

      if (error) {
        return false;
      } else {
        toast.success('Proposta registrada com sucesso!');
        clearQuote(); // Clear form after successful save
        setProposalTitle('');
        setProposalLogoUrl('/lovable-uploads/7ef1a887-0fe7-4cc3-bfc3-2d24e0251f8e.png');
        setProposalGradientTheme('conexhub');
        setClientInfo({ name: '', email: '', company: '', phone: '' });
        setSelectedClientId(null);
        setIsNewClient(false); // Reset to default (select existing)
        setStep(0); // Go back to the first step
        setGeneratedShareLink(null); // Clear generated link
        return true;
      }
    } catch (err) {
      console.error('Error in registerProposal:', err);
      return false;
    }
  };


  return (
    <QuoteWizardContext.Provider
      value={{
        mode,
        proposalMeta,
        isHydrating,
        loadError,
        isLocked,
        isDirty,
        isSaving,
        saveError,
        saveProposalChanges: isLocked ? undefined : saveProposalChanges,
        reloadProposal,
        currentStep,
        goToNextStep,
        goToPreviousStep,
        setStep,
        steps,

        selectedServices,
        clientInfo,
        paymentType,
        installmentNumber,
        installmentValue,
        manualInstallmentTotal,
        cashDiscountPercentage,
        notes,
        isValidityEnabled,
        validityDays,
        proposalTitle,
        proposalLogoUrl,
        proposalGradientTheme,
        showInterestRate, // Novo: controle para mostrar taxa de juros

        addService,
        removeService,
        updateServiceQuantity,
        updateServicePrice,
        updateServiceDiscount,
        updateServiceDiscountType,
        updateServiceFeatures,
        setClientInfo,
        setSelectedPayment,
        setPaymentType,
        setInstallmentNumber,
        setInstallmentValue,
        setManualInstallmentTotal,
        setCashDiscountPercentage,
        setNotes,
        setIsValidityEnabled,
        setValidityDays,
        setProposalTitle,
        setProposalLogoUrl,
        setProposalGradientTheme,
        setShowInterestRate, // Novo: setter para mostrar taxa de juros

        calculateSubtotal,
        calculateOriginalSubtotal,
        calculateTotal,
        calculateOneTimeTotal,
        calculateMonthlyTotal,
        calculateCashDiscount,
        calculateCashTotal,
        calculateFinalTotal,
        calculateInstallmentInterestRate,
        getTotalInstallmentValue,
        getSelectedPayment: getSelectedPayment as () => { name: string; fee: number; installments: number; type: 'cash' | 'installment'; installmentValue?: number; totalInstallmentValue?: number; }, // Corrigido o tipo aqui
        clearQuote,
        allAvailableServices,
        paymentOptions,

        customServices,
        fetchCustomServices,
        createCustomService,
        updateCustomService,
        deleteCustomService,

        existingClients,
        fetchExistingClients,
        selectedClientId,
        setSelectedClientId,
        isNewClient,
        setIsNewClient,
        createClient, // Pass createClient here
        
        generateShareableLink,
        registerProposal,
        generatedShareLink,
        isGeneratingLink,
      }}
    >
      {children}
    </QuoteWizardContext.Provider>
  );
};

export const useQuoteWizard = () => {
  const context = useContext(QuoteWizardContext);
  if (context === undefined) {
    throw new Error('useQuoteWizard must be used within a QuoteWizardProvider');
  }
  return context;
};
