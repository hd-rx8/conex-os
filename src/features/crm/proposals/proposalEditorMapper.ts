import type {
  ProposalEditorDraft,
  ProposalEditorSnapshot,
} from './proposalEditorTypes';

export const mapSnapshotToDraft = (
  snapshot: ProposalEditorSnapshot,
): ProposalEditorDraft => ({
  selectedServices: snapshot.services.map((service) => ({
    id: service.service_id,
    name: service.name,
    description: service.description ?? '',
    base_price: service.base_price,
    category: service.category ?? '',
    icon: service.icon ?? '',
    features: service.features ?? [],
    isCustom: service.is_custom ?? false,
    billing_type: service.billing_type,
    quantity: service.quantity,
    customPrice: service.custom_price ?? undefined,
    discount: service.discount ?? 0,
    discountPercentage: service.discount_percentage ?? 0,
    discountType: service.discount_type ?? 'percentage',
    customFeatures: service.features ?? [],
  })),
  clientInfo: {
    id: snapshot.client.id,
    name: snapshot.client.name ?? '',
    email: snapshot.client.email ?? '',
    company: snapshot.client.company ?? '',
    phone: snapshot.client.phone ?? '',
  },
  selectedClientId: snapshot.client.id,
  isNewClient: false,
  paymentType: snapshot.payment_type ?? 'cash',
  installmentNumber: snapshot.installment_number ?? 2,
  installmentValue: snapshot.installment_value ?? 0,
  manualInstallmentTotal: snapshot.manual_installment_total,
  cashDiscountPercentage: snapshot.cash_discount_percentage ?? 5,
  notes: snapshot.notes ?? '',
  isValidityEnabled: snapshot.is_validity_enabled ?? true,
  validityDays: snapshot.validity_days ?? 30,
  proposalTitle: snapshot.title,
  proposalLogoUrl: snapshot.proposal_logo_url ?? '',
  proposalGradientTheme: snapshot.proposal_gradient_theme ?? 'conexhub',
  showInterestRate: snapshot.show_interest_rate ?? true,
});

export const fingerprintProposalDraft = (
  draft: ProposalEditorDraft,
): string => JSON.stringify({
  ...draft,
  notes: draft.notes.trimEnd(),
  clientInfo: {
    ...draft.clientInfo,
    name: draft.clientInfo.name.trim(),
    email: draft.clientInfo.email.trim(),
  },
  selectedServices: draft.selectedServices.map((service) => ({
    ...service,
    customPrice: service.customPrice ?? null,
    discount: service.discount ?? 0,
    discountPercentage: service.discountPercentage ?? 0,
    discountType: service.discountType ?? 'percentage',
    customFeatures: service.customFeatures ?? service.features,
  })),
});
