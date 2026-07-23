import type { ClientInfo, SelectedService } from '@/hooks/useQuoteGenerator';

export interface ProposalEditorServiceSnapshot {
  id: string;
  service_id: string;
  name: string;
  description: string | null;
  base_price: number;
  quantity: number;
  custom_price: number | null;
  discount: number | null;
  discount_percentage: number | null;
  discount_type: 'percentage' | 'value' | null;
  features: string[] | null;
  category: string | null;
  icon: string | null;
  is_custom: boolean | null;
  billing_type: 'one_time' | 'monthly';
}

export interface ProposalEditorClientSnapshot {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  phone: string | null;
}

export interface ProposalEditorSnapshot {
  id: string;
  owner: string;
  title: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  share_token: string | null;
  notes: string | null;
  payment_type: 'cash' | 'installment' | null;
  cash_discount_percentage: number | null;
  installment_number: number | null;
  installment_value: number | null;
  manual_installment_total: number | null;
  is_validity_enabled: boolean | null;
  validity_days: number | null;
  proposal_logo_url: string | null;
  proposal_gradient_theme: 'conexhub' | 'alt1' | 'alt2' | null;
  show_interest_rate: boolean | null;
  client: ProposalEditorClientSnapshot | null;
  services: ProposalEditorServiceSnapshot[];
}

export interface ProposalEditorDraft {
  selectedServices: SelectedService[];
  clientInfo: ClientInfo;
  selectedClientId: string | null;
  isNewClient: boolean;
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
  showInterestRate: boolean;
}

export interface ProposalEditPayload {
  proposalId: string;
  expectedUpdatedAt: string;
  proposal: {
    title: string;
    client_id: string | null;
    notes: string | null;
    payment_type: 'cash' | 'installment';
    cash_discount_percentage: number;
    installment_number: number;
    installment_value: number;
    manual_installment_total: number | null;
    is_validity_enabled: boolean;
    validity_days: number;
    proposal_logo_url: string;
    proposal_gradient_theme: 'conexhub' | 'alt1' | 'alt2';
    show_interest_rate: boolean;
  };
  services: Array<{
    service_id: string;
    name: string;
    description: string | null;
    base_price: number;
    quantity: number;
    custom_price: number | null;
    discount: number;
    discount_percentage: number;
    discount_type: 'percentage' | 'value';
    features: string[];
    category: string | null;
    icon: string | null;
    is_custom: boolean;
    billing_type: 'one_time' | 'monthly';
  }>;
  newClient: {
    name: string;
    email: string | null;
    company: string | null;
    phone: string | null;
  } | null;
}

export type ProposalEditorErrorCode =
  | 'conflict'
  | 'forbidden'
  | 'locked'
  | 'not_found'
  | 'validation'
  | 'unknown';

export interface ProposalEditResult {
  success: boolean;
  errorCode?: ProposalEditorErrorCode;
}
