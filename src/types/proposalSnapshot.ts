/**
 * Types for proposal snapshot - single source of truth for print/PDF data
 */

export interface ProposalSnapshot {
  // Proposal basic data
  id: string;
  title: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  
  // Client data
  client: {
    id: string;
    name: string;
    email: string;
    company: string;
    phone: string;
  };
  
  // Services data
  services: Array<{
    id: string;
    service_id: string;
    name: string;
    description: string;
    base_price: number;
    quantity: number;
    custom_price?: number;
    discount: number;
    discount_percentage: number;
    discount_type: string;
    features: string[];
    category: string;
    icon: string;
    is_custom: boolean;
    billing_type: 'one_time' | 'monthly';
  }>;
  
  // Payment and settings
  payment: {
    type: 'cash' | 'installment';
    cash_discount_percentage: number;
    installment_number: number;
    installment_value: number;
    manual_installment_total: number;
  };
  
  // Validity settings
  validity: {
    enabled: boolean;
    days: number;
  };
  
  // Theme and branding
  theme: {
    logo_url: string;
    resolved_logo_url: string; // Absolute, loadable URL
    gradient_theme: 'conexhub' | 'alt1' | 'alt2';
  };
  
  // Computed totals (calculated once)
  totals: {
    oneTimeTotal: number;
    monthlyTotal: number;
    subtotal: number;
    totalCash: number;
    totalInstallment: number;
  };
}
