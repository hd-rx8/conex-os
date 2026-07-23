import { supabase } from '@/integrations/supabase/client';
import type {
  ProposalEditPayload,
  ProposalEditResult,
  ProposalEditorErrorCode,
  ProposalEditorSnapshot,
} from './proposalEditorTypes';

const OWNER_SNAPSHOT_FIELDS = `
  id,
  owner,
  title,
  amount,
  status,
  created_at,
  updated_at,
  share_token,
  notes,
  payment_type,
  cash_discount_percentage,
  installment_number,
  installment_value,
  manual_installment_total,
  is_validity_enabled,
  validity_days,
  proposal_logo_url,
  proposal_gradient_theme,
  show_interest_rate,
  clients(id, name, email, company, phone),
  proposal_services(
    id,
    service_id,
    name,
    description,
    base_price,
    quantity,
    custom_price,
    discount,
    discount_percentage,
    discount_type,
    features,
    category,
    icon,
    is_custom,
    billing_type
  )
`;

type ProposalEditorRpcError = {
  code?: string;
  message: string;
};

export class ProposalEditorDomainError extends Error {
  readonly code: ProposalEditorErrorCode;

  constructor(code: ProposalEditorErrorCode) {
    super(code);
    this.name = 'ProposalEditorDomainError';
    this.code = code;
  }
}

type OwnerProposalSnapshotRow = Omit<
  ProposalEditorSnapshot,
  'client' | 'services'
> & {
  clients: ProposalEditorSnapshot['client'];
  proposal_services: ProposalEditorSnapshot['services'] | null;
};

// Temporary boundary until Task 11 refreshes generated Database RPC types.
const rpc = supabase.rpc.bind(supabase) as unknown as (
  name: string,
  args: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: ProposalEditorRpcError | null }>;

export const proposalQueryKeys = {
  ownerLists: (ownerId: string) => ['proposals', ownerId] as const,
  editor: (proposalId: string) => ['proposal-editor', proposalId] as const,
  snapshot: (proposalId: string) => ['proposal-snapshot', proposalId] as const,
  public: (token: string) => ['public-proposal', token] as const,
};

function isProposalEditorRpcError(error: unknown): error is ProposalEditorRpcError {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && typeof error.code === 'string'
    && 'message' in error
    && typeof error.message === 'string';
}

export function mapProposalEditorError(error: unknown): ProposalEditorErrorCode {
  if (!isProposalEditorRpcError(error)) return 'unknown';

  if (error.code === '40001') {
    return 'conflict';
  }
  if (error.code === 'P0001') {
    return 'locked';
  }
  if (error.code === 'P0002'
    || error.code === 'PGRST116') {
    return 'not_found';
  }
  if (error.code === '42501') {
    return 'forbidden';
  }
  if (error.code === '22023') {
    return 'validation';
  }

  return 'unknown';
}

function toProposalEditorDomainError(error: unknown): ProposalEditorDomainError {
  if (error instanceof ProposalEditorDomainError) return error;

  return new ProposalEditorDomainError(mapProposalEditorError(error));
}

export async function getProposalEditorSnapshot(
  proposalId: string,
): Promise<ProposalEditorSnapshot> {
  try {
    const { data: proposal, error } = await supabase
      .from('proposals')
      .select(OWNER_SNAPSHOT_FIELDS)
      .eq('id', proposalId)
      .single()
      .overrideTypes<OwnerProposalSnapshotRow, { merge: false }>();

    if (error) throw error;
    if (!proposal) throw new ProposalEditorDomainError('not_found');

    return {
      ...proposal,
      client: proposal.clients,
      services: proposal.proposal_services ?? [],
    };
  } catch (error) {
    throw toProposalEditorDomainError(error);
  }
}

export async function saveProposalEdit(
  input: ProposalEditPayload,
): Promise<ProposalEditResult> {
  try {
    const { data, error } = await rpc('update_editable_proposal', {
      p_proposal_id: input.proposalId,
      p_expected_updated_at: input.expectedUpdatedAt,
      p_proposal: input.proposal,
      p_services: input.services,
      p_new_client: input.newClient,
    });

    if (error) {
      return {
        success: false,
        errorCode: mapProposalEditorError(error),
      };
    }

    if (!Array.isArray(data) || data.length !== 1 || !data[0]) {
      return { success: false, errorCode: 'unknown' };
    }

    return { success: true };
  } catch {
    return { success: false, errorCode: 'unknown' };
  }
}

export async function getPublicProposalByToken(token: string): Promise<unknown> {
  try {
    const { data, error } = await rpc('get_public_proposal_by_token', {
      p_share_token: token,
    });

    if (error) throw error;
    if (!data) throw new ProposalEditorDomainError('not_found');

    return data;
  } catch (error) {
    throw toProposalEditorDomainError(error);
  }
}
