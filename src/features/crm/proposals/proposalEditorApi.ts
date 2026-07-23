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

export function mapProposalEditorError(
  error: Pick<ProposalEditorRpcError, 'code' | 'message'> | null | undefined,
): ProposalEditorErrorCode {
  if (!error) return 'unknown';

  if (error.code === '40001' || error.message === 'proposal_conflict') {
    return 'conflict';
  }
  if (error.code === 'P0001' || error.message === 'proposal_locked') {
    return 'locked';
  }
  if (error.code === 'P0002' || error.message.endsWith('_not_found')) {
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

export async function getProposalEditorSnapshot(
  proposalId: string,
): Promise<ProposalEditorSnapshot> {
  const { data: proposal, error } = await supabase
    .from('proposals')
    .select(OWNER_SNAPSHOT_FIELDS)
    .eq('id', proposalId)
    .single()
    .overrideTypes<OwnerProposalSnapshotRow, { merge: false }>();

  if (error) throw error;
  if (!proposal) throw new Error('proposal_not_found');

  return {
    ...proposal,
    client: proposal.clients,
    services: proposal.proposal_services ?? [],
  };
}

export async function saveProposalEdit(
  input: ProposalEditPayload,
): Promise<ProposalEditResult> {
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
}

export async function getPublicProposalByToken(token: string): Promise<unknown> {
  const { data, error } = await rpc('get_public_proposal_by_token', {
    p_share_token: token,
  });

  if (error) throw error;
  if (!data) throw new Error('proposal_not_found');

  return data;
}
