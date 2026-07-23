# Existing Proposal Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a route-isolated, explicit-save editor that atomically updates an existing editable proposal while preserving its identity and public link.

**Architecture:** Creation and editing reuse the four wizard steps but mount a fresh `QuoteWizardProvider` inside each generator route. Edit mode hydrates an owner-scoped snapshot, tracks a normalized dirty baseline, and saves through one short PostgreSQL RPC with row locking, status enforcement, optimistic concurrency, and transactional service replacement. Anonymous proposal viewing moves from direct table reads to a token-scoped public RPC.

**Tech Stack:** React 18, TypeScript 5.5, React Router 6.26, TanStack Query 5, Vitest, Testing Library, Supabase JS 2.57, PostgreSQL 17, Supabase RLS.

## Global Constraints

- Work only on `codex/proposal-editing`; do not modify `main`.
- Do not apply a remote migration until the rollback dry run, SQL contracts, advisors, and exact migration SQL have been reviewed and the user explicitly approves the production write.
- Preserve proposal `id`, `owner`, `status`, `share_token`, `created_at`, and `approved_at`.
- Allow content editing only for `Rascunho`, `Criada`, `Enviada`, and `Negociando`.
- Keep `Aprovada` and `Rejeitada` read-only; viewing and duplication remain available.
- Use explicit save only; do not add autosave.
- Keep `/generator` as creation and `/generator/:proposalId/edit` as editing.
- Redirect legacy `/generator?proposalId={proposalId}` links to the canonical edit route.
- Keep the same four wizard steps and current calculation formulas.
- Public links must work while signed out without adding broad anonymous table policies.
- Use `SECURITY INVOKER` for the edit RPC and narrowly scoped `SECURITY DEFINER` only for the token-based public read RPC.
- Do not expose a Supabase service-role or secret key in browser code.
- Use focused React Query invalidation; do not call unscoped `queryClient.invalidateQueries()`.
- Create migrations with `npx supabase migration new`; never invent a timestamped filename.
- Implement behavior test-first and commit after every task.

---

## File structure

### New frontend files

- `src/features/crm/proposals/proposalStatus.ts` — canonical status type and editable/locked predicates.
- `src/features/crm/proposals/proposalStatus.test.ts` — exhaustive status policy tests.
- `src/features/crm/proposals/proposalEditorTypes.ts` — editor snapshot, draft, RPC payload, result, and error contracts.
- `src/features/crm/proposals/proposalEditorMapper.ts` — pure database-to-wizard mapping and normalized fingerprints.
- `src/features/crm/proposals/proposalEditorMapper.test.ts` — zero-value and field-completeness regression tests.
- `src/features/crm/proposals/proposalEditorApi.ts` — owner snapshot, edit RPC, and public-token RPC calls.
- `src/features/crm/proposals/proposalEditorApi.test.ts` — RPC argument and error mapping tests.
- `src/features/crm/proposals/useUnsavedProposalGuard.ts` — SPA and browser unload protection.
- `src/features/crm/proposals/useUnsavedProposalGuard.test.tsx` — blocker behavior tests.
- `src/pages/crm/QuoteGeneratorRoute.tsx` — canonical create/edit entries and route-scoped provider.
- `src/pages/crm/QuoteGeneratorRoute.test.tsx` — route isolation and legacy redirect tests.
- `src/context/QuoteWizardContext.test.tsx` — create/edit hydration, isolation, dirty state, and save tests.

### Modified frontend files

- `src/App.tsx` — data-router shell, generator routes, and removal of the global quote provider.
- `src/hooks/useQuoteGenerator.ts` — draft hydration/export, persisted interest-rate state, and zero-safe math.
- `src/context/QuoteWizardContext.tsx` — explicit mode, edit metadata, hydration, dirty baseline, and save command.
- `src/pages/crm/QuoteGeneratorPage.tsx` — loading, error, locked, and editable page states.
- `src/pages/crm/QuoteGeneratorPage.test.tsx` — editor-state rendering tests.
- `src/components/quote-wizard/StepReview.tsx` — creation actions versus explicit edit actions.
- `src/components/Dashboard.tsx` and new `src/components/Dashboard.test.tsx` — canonical edit navigation and locked-status affordance.
- `src/pages/crm/Opportunities.tsx` and new `src/pages/crm/Opportunities.test.tsx` — edit actions in list/table/detail views and locked-status behavior.
- `src/hooks/useProposalSnapshot.ts` — include `show_interest_rate`.
- `src/types/proposalSnapshot.ts` — persisted interest-rate flag.
- `src/components/ProposalDocument.tsx` — conditionally show installment interest.
- `src/pages/crm/PublicProposalView.tsx` — token RPC instead of direct proposal-table query.
- `src/hooks/useProposals.ts` — remove full-editor dependence on the non-atomic update path and narrow cache invalidation.
- `src/utils/statusColors.ts` — import and re-export the canonical `ProposalStatus`.
- `src/integrations/supabase/types.ts` — regenerate after the approved migration is applied.

### New database files

- `supabase/tests/proposal_edit_preflight.sql` — read-only production assumptions.
- `supabase/tests/proposal_edit_contract.sql` — column, function, grant, policy, and index assertions.
- `supabase/tests/proposal_edit_rls.sql` — transaction-scoped two-user mutation and public-token tests.
- The CLI-created `supabase/migrations/*_secure_proposal_editing.sql` — additive field, indexes, RLS corrections, and two RPCs.

---

### Task 1: Canonical proposal status policy

**Files:**
- Create: `src/features/crm/proposals/proposalStatus.ts`
- Create: `src/features/crm/proposals/proposalStatus.test.ts`
- Modify: `src/utils/statusColors.ts`
- Modify: `src/hooks/useProposals.ts`

**Interfaces:**
- Produces: `ProposalStatus`, `EditableProposalStatus`, `PROPOSAL_STATUSES`, `EDITABLE_PROPOSAL_STATUSES`, `LOCKED_PROPOSAL_STATUSES`, `canEditProposal(status)`, and `isLockedProposal(status)`.
- Consumed by: routing, Dashboard, Opportunities, editor context, and tests in later tasks.

- [ ] **Step 1: Write the exhaustive failing status tests**

```ts
import { describe, expect, it } from 'vitest';
import {
  EDITABLE_PROPOSAL_STATUSES,
  LOCKED_PROPOSAL_STATUSES,
  PROPOSAL_STATUSES,
  canEditProposal,
  isLockedProposal,
} from './proposalStatus';

describe('proposal status editing policy', () => {
  it.each(['Rascunho', 'Criada', 'Enviada', 'Negociando'] as const)(
    'allows %s',
    (status) => {
      expect(canEditProposal(status)).toBe(true);
      expect(isLockedProposal(status)).toBe(false);
    },
  );

  it.each(['Aprovada', 'Rejeitada'] as const)('locks %s', (status) => {
    expect(canEditProposal(status)).toBe(false);
    expect(isLockedProposal(status)).toBe(true);
  });

  it('classifies every status exactly once', () => {
    expect([...EDITABLE_PROPOSAL_STATUSES, ...LOCKED_PROPOSAL_STATUSES].sort())
      .toEqual([...PROPOSAL_STATUSES].sort());
  });

  it('rejects unknown values', () => {
    expect(canEditProposal('Cancelada')).toBe(false);
    expect(isLockedProposal('Cancelada')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the focused test and confirm the missing-module failure**

Run:

```powershell
pnpm vitest run src/features/crm/proposals/proposalStatus.test.ts
```

Expected: FAIL because `proposalStatus.ts` does not exist.

- [ ] **Step 3: Add the canonical implementation**

```ts
export const PROPOSAL_STATUSES = [
  'Rascunho',
  'Criada',
  'Enviada',
  'Negociando',
  'Aprovada',
  'Rejeitada',
] as const;

export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const EDITABLE_PROPOSAL_STATUSES = [
  'Rascunho',
  'Criada',
  'Enviada',
  'Negociando',
] as const satisfies readonly ProposalStatus[];

export type EditableProposalStatus =
  (typeof EDITABLE_PROPOSAL_STATUSES)[number];

export const LOCKED_PROPOSAL_STATUSES = [
  'Aprovada',
  'Rejeitada',
] as const satisfies readonly ProposalStatus[];

const editable = new Set<string>(EDITABLE_PROPOSAL_STATUSES);
const locked = new Set<string>(LOCKED_PROPOSAL_STATUSES);

export const canEditProposal = (
  status: string,
): status is EditableProposalStatus => editable.has(status);

export const isLockedProposal = (status: string): boolean =>
  locked.has(status);
```

Update `src/utils/statusColors.ts` to import and re-export the type:

```ts
import type { ProposalStatus } from '@/features/crm/proposals/proposalStatus';
export type { ProposalStatus } from '@/features/crm/proposals/proposalStatus';
```

Delete the duplicate local `ProposalStatus` union.

In `useProposals.ts`, type `Proposal.status` and status mutation inputs with the canonical `ProposalStatus`. Add `show_interest_rate: boolean` to `Proposal`, add `show_interest_rate?: boolean` to creation data, and preserve it when duplicating a proposal.

- [ ] **Step 4: Run the focused test**

Run:

```powershell
pnpm vitest run src/features/crm/proposals/proposalStatus.test.ts
```

Expected: 4 groups PASS, including `Negociando`.

- [ ] **Step 5: Commit**

```powershell
git add src/features/crm/proposals/proposalStatus.ts src/features/crm/proposals/proposalStatus.test.ts src/utils/statusColors.ts src/hooks/useProposals.ts
git commit -m "feat: centralize proposal edit status policy"
```

---

### Task 2: Pure editor contracts and snapshot mapping

**Files:**
- Create: `src/features/crm/proposals/proposalEditorTypes.ts`
- Create: `src/features/crm/proposals/proposalEditorMapper.ts`
- Create: `src/features/crm/proposals/proposalEditorMapper.test.ts`
- Modify: `src/hooks/useQuoteGenerator.ts`

**Interfaces:**
- Produces: `ProposalEditorSnapshot`, `ProposalEditorDraft`, `ProposalEditPayload`, `ProposalEditResult`, `ProposalEditorErrorCode`, `mapSnapshotToDraft`, and `fingerprintProposalDraft`.
- Consumes: `SelectedService` and `ClientInfo` from `useQuoteGenerator`.

- [ ] **Step 1: Write failing mapper tests that preserve zero values**

Use this complete fixture:

```ts
const snapshot: ProposalEditorSnapshot = {
  id: 'proposal-1',
  owner: 'user-1',
  title: 'Proposta existente',
  amount: 0,
  status: 'Negociando',
  created_at: '2026-07-23T10:00:00.000Z',
  updated_at: '2026-07-23T11:00:00.000Z',
  share_token: 'share-1',
  notes: '',
  payment_type: 'installment',
  cash_discount_percentage: 0,
  installment_number: 2,
  installment_value: 0,
  manual_installment_total: null,
  is_validity_enabled: true,
  validity_days: 30,
  proposal_logo_url: '/logo.png',
  proposal_gradient_theme: 'conexhub',
  show_interest_rate: false,
  client: {
    id: 'client-1',
    name: 'Cliente',
    email: 'cliente@example.com',
    company: 'Empresa',
    phone: '11999999999',
  },
  services: [{
    id: 'proposal-service-1',
    service_id: 'service-1',
    name: 'Mensalidade',
    description: '',
    base_price: 0,
    quantity: 1,
    custom_price: 0,
    discount: 0,
    discount_percentage: 0,
    discount_type: 'percentage',
    features: [],
    category: 'Recorrente',
    icon: '✨',
    is_custom: false,
    billing_type: 'monthly',
  }],
};
```

Assert:

```ts
const draft = mapSnapshotToDraft(snapshot);

expect(draft.proposalTitle).toBe('Proposta existente');
expect(draft.selectedServices[0].customPrice).toBe(0);
expect(draft.selectedServices[0].discount).toBe(0);
expect(draft.cashDiscountPercentage).toBe(0);
expect(draft.manualInstallmentTotal).toBeNull();
expect(draft.showInterestRate).toBe(false);
expect(draft.selectedClientId).toBe(snapshot.client.id);
expect(draft.isNewClient).toBe(false);
```

Add a fingerprint test:

```ts
expect(fingerprintProposalDraft(draft))
  .toBe(fingerprintProposalDraft(structuredClone(draft)));

const changed = structuredClone(draft);
changed.notes = 'alterado';
expect(fingerprintProposalDraft(changed))
  .not.toBe(fingerprintProposalDraft(draft));
```

- [ ] **Step 2: Run and confirm the missing-module failure**

```powershell
pnpm vitest run src/features/crm/proposals/proposalEditorMapper.test.ts
```

Expected: FAIL because the editor contracts do not exist.

- [ ] **Step 3: Define the editor contracts**

`ProposalEditorSnapshot` must contain exact persisted fields, including `share_token`, `updated_at`, `client`, `services`, and `show_interest_rate`.

`ProposalEditorDraft` must contain:

```ts
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
```

`ProposalEditPayload` excludes immutable fields and uses:

```ts
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
```

- [ ] **Step 4: Implement mapping and normalized fingerprinting**

Use nullish coalescing for numeric values. Map persisted services directly into `SelectedService`; do not require the service to still exist in the current catalog.

The fingerprint must normalize optional values:

```ts
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
```

- [ ] **Step 5: Make quote calculations zero-safe and hydratable**

In `useQuoteGenerator.ts`:

- Replace every price fallback `service.customPrice || service.base_price` with `service.customPrice ?? service.base_price`.
- Move `showInterestRate` into this hook.
- Add `hydrateQuote(draft: ProposalEditorDraft)` that sets every quote field in one callback.
- Add `getQuoteDraft(): Omit<ProposalEditorDraft, "selectedClientId" | "isNewClient">`.
- Ensure `clearQuote()` restores `showInterestRate` to `true`.

- [ ] **Step 6: Run mapper and existing generator tests**

```powershell
pnpm vitest run src/features/crm/proposals/proposalEditorMapper.test.ts src/pages/crm/QuoteGeneratorPage.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/features/crm/proposals/proposalEditorTypes.ts src/features/crm/proposals/proposalEditorMapper.ts src/features/crm/proposals/proposalEditorMapper.test.ts src/hooks/useQuoteGenerator.ts
git commit -m "feat: add proposal editor draft contracts"
```

---

### Task 3: Database safety harness and migration artifact

**Files:**
- Create: `supabase/tests/proposal_edit_preflight.sql`
- Create via CLI: `supabase/migrations/*_secure_proposal_editing.sql`
- Create: `supabase/tests/proposal_edit_contract.sql`
- Create: `supabase/tests/proposal_edit_rls.sql`

**Interfaces:**
- Produces RPC `public.update_editable_proposal(uuid,timestamptz,jsonb,jsonb,jsonb)`.
- Produces RPC `public.get_public_proposal_by_token(uuid)`.
- Adds `public.proposals.show_interest_rate`.
- Produces indexes `proposal_services_proposal_id_idx` and `clients_created_by_idx`.

- [ ] **Step 1: Create the read-only preflight**

The file must raise unless all of these are true:

```sql
do $$
begin
  if (select count(*) from public.clients where created_by is null) <> 0 then
    raise exception 'clients without owner prevent policy tightening';
  end if;

  if (select count(*) from public.proposals where client_id is null) <> 0 then
    raise exception 'proposals without client require product review';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.proposals'::regclass
      and conname = 'proposals_status_check'
      and pg_get_constraintdef(oid) like '%Negociando%'
  ) then
    raise exception 'proposal status contract does not include Negociando';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'clients'
      and policyname = 'Public read access for clients (temporary debug)'
  ) then
    raise exception 'expected temporary client policy was not found';
  end if;
end
$$;
```

- [ ] **Step 2: Create the migration path with the CLI**

First discover the installed CLI:

```powershell
npx supabase --help
```

Expected: help output and a `migration` command.

Then:

```powershell
npx supabase migration new secure_proposal_editing
```

Expected: one new timestamped migration path. Use that exact file.

- [ ] **Step 3: Write the additive schema and RLS section**

The migration starts with:

```sql
alter table public.proposals
  add column if not exists show_interest_rate boolean not null default true;

create index if not exists proposal_services_proposal_id_idx
  on public.proposal_services(proposal_id);

create index if not exists clients_created_by_idx
  on public.clients(created_by);

drop policy if exists "Public read access for clients (temporary debug)"
  on public.clients;
drop policy if exists "Owners can view their clients" on public.clients;
create policy "Owners can view their clients"
on public.clients for select to authenticated
using ((select auth.uid()) = created_by);

drop policy if exists "Owners can update their clients" on public.clients;
create policy "Owners can update their clients"
on public.clients for update to authenticated
using ((select auth.uid()) = created_by)
with check ((select auth.uid()) = created_by);
```

Drop and recreate each `proposal_services` policy with:

```sql
drop policy if exists "Allow read access to proposal services for proposal owner"
  on public.proposal_services;
create policy "Allow read access to proposal services for proposal owner"
on public.proposal_services for select to authenticated
using (exists (
  select 1 from public.proposals p
  where p.id = proposal_services.proposal_id
    and p.owner = (select auth.uid())
));

drop policy if exists "Allow insert access to proposal services for proposal owner"
  on public.proposal_services;
create policy "Allow insert access to proposal services for proposal owner"
on public.proposal_services for insert to authenticated
with check (exists (
  select 1 from public.proposals p
  where p.id = proposal_services.proposal_id
    and p.owner = (select auth.uid())
));

drop policy if exists "Allow update access to proposal services for proposal owner"
  on public.proposal_services;
create policy "Allow update access to proposal services for proposal owner"
on public.proposal_services for update to authenticated
using (exists (
  select 1 from public.proposals p
  where p.id = proposal_services.proposal_id
    and p.owner = (select auth.uid())
))
with check (exists (
  select 1 from public.proposals p
  where p.id = proposal_services.proposal_id
    and p.owner = (select auth.uid())
));

drop policy if exists "Allow delete access to proposal services for proposal owner"
  on public.proposal_services;
create policy "Allow delete access to proposal services for proposal owner"
on public.proposal_services for delete to authenticated
using (exists (
  select 1 from public.proposals p
  where p.id = proposal_services.proposal_id
    and p.owner = (select auth.uid())
));
```

- [ ] **Step 4: Add the edit RPC**

Use this exact signature and security envelope:

```sql
create or replace function public.update_editable_proposal(
  p_proposal_id uuid,
  p_expected_updated_at timestamptz,
  p_proposal jsonb,
  p_services jsonb,
  p_new_client jsonb default null
)
returns table (
  proposal_id uuid,
  committed_updated_at timestamptz,
  committed_share_token uuid,
  committed_status text
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_proposal public.proposals%rowtype;
  v_client_id uuid;
  v_payment_type text := coalesce(p_proposal->>'payment_type', 'cash');
  v_cash_discount numeric := coalesce((p_proposal->>'cash_discount_percentage')::numeric, 0);
  v_installment_number integer := coalesce((p_proposal->>'installment_number')::integer, 2);
  v_installment_value numeric := coalesce((p_proposal->>'installment_value')::numeric, 0);
  v_manual_total numeric := nullif(p_proposal->>'manual_installment_total', '')::numeric;
  v_validity_enabled boolean := coalesce((p_proposal->>'is_validity_enabled')::boolean, false);
  v_validity_days integer := coalesce((p_proposal->>'validity_days')::integer, 0);
  v_subtotal numeric;
  v_amount numeric;
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  select *
  into v_proposal
  from public.proposals
  where id = p_proposal_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'proposal_not_found';
  end if;

  if v_proposal.status not in ('Rascunho', 'Criada', 'Enviada', 'Negociando') then
    raise exception using errcode = 'P0001', message = 'proposal_locked';
  end if;

  if v_proposal.updated_at is distinct from p_expected_updated_at then
    raise exception using errcode = '40001', message = 'proposal_conflict';
  end if;

  if nullif(btrim(p_proposal->>'title'), '') is null then
    raise exception using errcode = '22023', message = 'title_required';
  end if;

  if jsonb_typeof(p_services) is distinct from 'array'
     or jsonb_array_length(p_services) = 0 then
    raise exception using errcode = '22023', message = 'services_required';
  end if;

  if v_payment_type not in ('cash', 'installment')
     or v_cash_discount < 0 or v_cash_discount > 100
     or v_installment_value < 0
     or coalesce(v_manual_total, 0) < 0
     or coalesce(p_proposal->>'proposal_gradient_theme', 'conexhub')
        not in ('conexhub', 'alt1', 'alt2')
     or (v_payment_type = 'installment' and (
       v_installment_number not between 2 and 12
       or (v_installment_value <= 0 and coalesce(v_manual_total, 0) <= 0)
     ))
     or (v_validity_enabled and v_validity_days < 1) then
    raise exception using errcode = '22023', message = 'invalid_payment_or_validity';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_services) as s(
      service_id text,
      name text,
      base_price numeric,
      quantity integer,
      custom_price numeric,
      discount numeric,
      discount_percentage numeric,
      discount_type text,
      billing_type text
    )
    where nullif(btrim(s.service_id), '') is null
       or nullif(btrim(s.name), '') is null
       or s.base_price is null
       or s.base_price < 0
       or coalesce(s.custom_price, s.base_price) < 0
       or s.quantity is null
       or s.quantity < 1
       or coalesce(s.discount, 0) < 0
       or coalesce(s.discount, 0) > coalesce(s.custom_price, s.base_price) * s.quantity
       or coalesce(s.discount_percentage, 0) not between 0 and 100
       or coalesce(s.discount_type, 'percentage') not in ('percentage', 'value')
       or s.billing_type is null
       or s.billing_type not in ('one_time', 'monthly')
  ) then
    raise exception using errcode = '22023', message = 'invalid_service';
  end if;

  if p_new_client is not null then
    if nullif(btrim(p_new_client->>'name'), '') is null then
      raise exception using errcode = '22023', message = 'client_name_required';
    end if;

    insert into public.clients(name, email, company, phone, created_by)
    values (
      btrim(p_new_client->>'name'),
      nullif(btrim(p_new_client->>'email'), ''),
      nullif(btrim(p_new_client->>'company'), ''),
      nullif(btrim(p_new_client->>'phone'), ''),
      (select auth.uid())
    )
    returning id into v_client_id;
  else
    begin
      v_client_id := (p_proposal->>'client_id')::uuid;
    exception when invalid_text_representation then
      raise exception using errcode = '22023', message = 'invalid_client';
    end;

    perform 1 from public.clients
    where id = v_client_id and created_by = (select auth.uid());
    if not found then
      raise exception using errcode = 'P0002', message = 'client_not_found';
    end if;
  end if;

  select coalesce(sum(
    (coalesce(s.custom_price, s.base_price) * s.quantity)
    - coalesce(s.discount, 0)
  ), 0)
  into v_subtotal
  from jsonb_to_recordset(p_services) as s(
    base_price numeric,
    quantity integer,
    custom_price numeric,
    discount numeric
  );

  v_amount := round(v_subtotal * (1 - v_cash_discount / 100), 2);

  update public.proposals
  set title = btrim(p_proposal->>'title'),
      amount = v_amount,
      client_id = v_client_id,
      notes = nullif(p_proposal->>'notes', ''),
      payment_type = v_payment_type,
      cash_discount_percentage = v_cash_discount,
      installment_number = v_installment_number,
      installment_value = v_installment_value,
      manual_installment_total = v_manual_total,
      is_validity_enabled = v_validity_enabled,
      validity_days = v_validity_days,
      proposal_logo_url = nullif(p_proposal->>'proposal_logo_url', ''),
      proposal_gradient_theme = coalesce(nullif(p_proposal->>'proposal_gradient_theme', ''), 'conexhub'),
      show_interest_rate = coalesce((p_proposal->>'show_interest_rate')::boolean, true)
  where id = p_proposal_id;

  delete from public.proposal_services
  where proposal_id = p_proposal_id;

  insert into public.proposal_services(
    proposal_id, service_id, name, description, base_price, quantity,
    custom_price, discount, discount_percentage, discount_type, features,
    category, icon, is_custom, billing_type
  )
  select
    p_proposal_id, s.service_id, s.name, s.description, s.base_price,
    s.quantity, s.custom_price, coalesce(s.discount, 0),
    coalesce(s.discount_percentage, 0),
    coalesce(s.discount_type, 'percentage'), coalesce(s.features, array[]::text[]),
    s.category, s.icon, coalesce(s.is_custom, false),
    s.billing_type::public.billing_type
  from jsonb_to_recordset(p_services) as s(
    service_id text,
    name text,
    description text,
    base_price numeric,
    quantity integer,
    custom_price numeric,
    discount numeric,
    discount_percentage numeric,
    discount_type text,
    features text[],
    category text,
    icon text,
    is_custom boolean,
    billing_type text
  );

  return query
  select p.id, p.updated_at, p.share_token, p.status
  from public.proposals p
  where p.id = p_proposal_id;
end;
$$;

revoke all on function public.update_editable_proposal(
  uuid, timestamptz, jsonb, jsonb, jsonb
) from public, anon;
grant execute on function public.update_editable_proposal(
  uuid, timestamptz, jsonb, jsonb, jsonb
) to authenticated;
```

- [ ] **Step 5: Add the token-scoped public RPC**

Add this function after the edit RPC:

```sql
create or replace function public.get_public_proposal_by_token(
  p_share_token uuid
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p.id,
    'title', p.title,
    'amount', p.amount,
    'status', p.status,
    'created_at', p.created_at,
    'updated_at', p.updated_at,
    'notes', p.notes,
    'payment_type', p.payment_type,
    'cash_discount_percentage', p.cash_discount_percentage,
    'installment_number', p.installment_number,
    'installment_value', p.installment_value,
    'manual_installment_total', p.manual_installment_total,
    'is_validity_enabled', p.is_validity_enabled,
    'validity_days', p.validity_days,
    'proposal_logo_url', p.proposal_logo_url,
    'proposal_gradient_theme', p.proposal_gradient_theme,
    'show_interest_rate', p.show_interest_rate,
    'client', jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'email', c.email,
      'company', c.company,
      'phone', c.phone
    ),
    'proposal_services', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', ps.id,
          'service_id', ps.service_id,
          'name', ps.name,
          'description', ps.description,
          'base_price', ps.base_price,
          'quantity', ps.quantity,
          'custom_price', ps.custom_price,
          'discount', ps.discount,
          'discount_percentage', ps.discount_percentage,
          'discount_type', ps.discount_type,
          'features', ps.features,
          'category', ps.category,
          'icon', ps.icon,
          'is_custom', ps.is_custom,
          'billing_type', ps.billing_type,
          'created_at', ps.created_at
        )
        order by ps.created_at, ps.id
      )
      from public.proposal_services ps
      where ps.proposal_id = p.id
    ), '[]'::jsonb)
  )
  from public.proposals p
  left join public.clients c on c.id = p.client_id
  where p.share_token = p_share_token
  limit 1;
$$;

revoke all on function public.get_public_proposal_by_token(uuid)
  from public;
grant execute on function public.get_public_proposal_by_token(uuid)
  to anon, authenticated;
```

- [ ] **Step 6: Write schema contract assertions**

`proposal_edit_contract.sql` must assert:

- `show_interest_rate` exists, is non-null, and defaults to true.
- both supporting indexes exist.
- the temporary client policy is absent.
- client SELECT and UPDATE are owner-scoped; UPDATE has `WITH CHECK`.
- all four proposal-service policies target `authenticated`.
- edit RPC is invoker-security, unavailable to `anon`, and executable by `authenticated`.
- public RPC is definer-security, unavailable through default `PUBLIC`, and executable by `anon`.
- proposal status check still includes all six statuses.

- [ ] **Step 7: Write transactional RLS and rollback tests**

`proposal_edit_rls.sql` begins with `begin;` and ends with `rollback;`.

It seeds two deterministic app users, clients, proposals, and services. With:

```sql
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}';
```

assert:

- User A updates their `Negociando` proposal.
- ID, token, owner, status, and `created_at` are unchanged.
- header and services are updated.
- stale timestamp raises `40001` and changes nothing.
- `Aprovada` raises `proposal_locked`.
- User A cannot update User B.
- invalid services roll back a newly requested client.

Then set `role anon`, clear JWT claims, call the public-token function, and assert that a valid token returns one limited payload while a random token returns null.

- [ ] **Step 8: Static-check and commit the unapplied migration**

```powershell
git diff --check
git add supabase/migrations supabase/tests/proposal_edit_preflight.sql supabase/tests/proposal_edit_contract.sql supabase/tests/proposal_edit_rls.sql
git commit -m "feat: define secure proposal editing transaction"
```

Expected: commit succeeds. Do not call `apply_migration`.

---

### Task 4: Proposal editor data API

**Files:**
- Create: `src/features/crm/proposals/proposalEditorApi.ts`
- Create: `src/features/crm/proposals/proposalEditorApi.test.ts`
- Modify: `src/hooks/useProposals.ts`

**Interfaces:**
- Produces: `getProposalEditorSnapshot(id)`, `saveProposalEdit(input)`, `getPublicProposalByToken(token)`, and `mapProposalEditorError(error)`.
- Consumes: RPC signatures from Task 3 and types from Task 2.

- [ ] **Step 1: Write failing RPC argument and error mapping tests**

Mock the Supabase client and assert:

```ts
expect(rpc).toHaveBeenCalledWith('update_editable_proposal', {
  p_proposal_id: input.proposalId,
  p_expected_updated_at: input.expectedUpdatedAt,
  p_proposal: input.proposal,
  p_services: input.services,
  p_new_client: input.newClient,
});
```

Error mapping assertions:

```ts
expect(mapProposalEditorError({ code: '40001', message: 'proposal_conflict' }))
  .toBe('conflict');
expect(mapProposalEditorError({ code: 'P0001', message: 'proposal_locked' }))
  .toBe('locked');
expect(mapProposalEditorError({ code: 'P0002', message: 'proposal_not_found' }))
  .toBe('not_found');
expect(mapProposalEditorError({ code: '42501', message: 'denied' }))
  .toBe('forbidden');
```

- [ ] **Step 2: Run and confirm failure**

```powershell
pnpm vitest run src/features/crm/proposals/proposalEditorApi.test.ts
```

Expected: FAIL because the API module does not exist.

- [ ] **Step 3: Implement owner snapshot and RPC calls**

The owner snapshot query selects explicit fields and nested `clients(...)`, `proposal_services(...)`, filters by ID, and calls `.single()`. Normalize the Supabase response before returning:

```ts
return {
  ...proposal,
  client: proposal.clients,
  services: proposal.proposal_services ?? [],
};
```

`saveProposalEdit` calls the RPC once and requires one result row.

`getPublicProposalByToken` calls `get_public_proposal_by_token`; it never queries `proposals` directly.

Until generated types are refreshed in Task 10, isolate the temporary cast inside this file:

```ts
const rpc = supabase.rpc.bind(supabase) as unknown as (
  name: string,
  args: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: { code?: string; message: string } | null }>;
```

No other file may use an untyped RPC cast.

- [ ] **Step 4: Add focused query-key invalidation**

Export:

```ts
export const proposalQueryKeys = {
  ownerLists: (ownerId: string) => ['proposals', ownerId] as const,
  editor: (proposalId: string) => ['proposal-editor', proposalId] as const,
  snapshot: (proposalId: string) => ['proposal-snapshot', proposalId] as const,
  public: (token: string) => ['public-proposal', token] as const,
};
```

Replace unscoped invalidation in the full editor path with these keys. Do not change status-only behavior beyond replacing global invalidation where the owning user ID is available.

- [ ] **Step 5: Run tests and commit**

```powershell
pnpm vitest run src/features/crm/proposals/proposalEditorApi.test.ts
git add src/features/crm/proposals/proposalEditorApi.ts src/features/crm/proposals/proposalEditorApi.test.ts src/hooks/useProposals.ts
git commit -m "feat: add proposal editor data API"
```

Expected: tests PASS and commit succeeds.

---

### Task 5: Route-scoped wizard provider and edit session

**Files:**
- Modify: `src/context/QuoteWizardContext.tsx`
- Create: `src/context/QuoteWizardContext.test.tsx`
- Create: `src/pages/crm/QuoteGeneratorRoute.tsx`
- Create: `src/pages/crm/QuoteGeneratorRoute.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- `QuoteWizardProvider` props become `{ userId, mode, proposalId?, children }`.
- Context produces `mode`, `proposalMeta`, `isHydrating`, `loadError`, `isLocked`, `isDirty`, `isSaving`, `saveError`, `saveProposalChanges()`, and `reloadProposal()`.

- [ ] **Step 1: Write failing provider tests**

Cover:

- create provider starts at step zero with an empty draft.
- edit provider shows loading until snapshot resolves.
- edit provider hydrates all values once and starts at step zero.
- unmounting edit provider and mounting create provider yields no stale values.
- editing notes sets `isDirty`.
- successful save updates the baseline and clears `isDirty`.
- locked snapshot never exposes `saveProposalChanges`.

- [ ] **Step 2: Run and confirm failures**

```powershell
pnpm vitest run src/context/QuoteWizardContext.test.tsx
```

Expected: FAIL because mode/session APIs are missing.

- [ ] **Step 3: Refactor the provider**

Remove the debug `console.log`.

In create mode:

- retain current custom-service/client loading.
- retain current create actions.
- initialize one clean session per mount.

In edit mode:

- fetch through `getProposalEditorSnapshot`.
- map with `mapSnapshotToDraft`.
- call `hydrateQuote`.
- set client mode and generated link.
- capture `updated_at`, status, token, and title in `proposalMeta`.
- set the dirty baseline only after hydration.
- never call `createProposal` or `createDraftProposal`.

Build the edit payload from the current draft and call `saveProposalEdit`. On success, update `proposalMeta.updatedAt`, update the baseline, invalidate focused keys, and return `true`.

Extend `CreateProposalData`, creation payload construction, and duplication with `show_interest_rate`. This keeps the existing creation wizard's toggle persistent after the new column exists.

- [ ] **Step 4: Add route entry components**

`QuoteGeneratorRoute` has:

```ts
type QuoteGeneratorRouteProps = {
  userId: string;
  mode: 'create' | 'edit';
};
```

For create mode, if `proposalId` exists in the search params, return:

```tsx
<Navigate
  to={`/generator/${encodeURIComponent(legacyProposalId)}/edit`}
  replace
  state={location.state}
/>
```

For edit mode, require `useParams().proposalId`; missing IDs render the generic load error.

Otherwise mount:

```tsx
<QuoteWizardProvider
  userId={userId}
  mode={mode}
  proposalId={proposalId}
>
  <QuoteGeneratorPage userId={userId} />
</QuoteWizardProvider>
```

- [ ] **Step 5: Remove the global provider and register both routes**

In `App.tsx`, remove the `QuoteWizardProvider` around `<Routes>`.

Register:

```tsx
<Route path="/generator" element={/* protected create QuoteGeneratorRoute */} />
<Route path="/generator/:proposalId/edit" element={/* protected edit QuoteGeneratorRoute */} />
```

- [ ] **Step 6: Run route/provider tests**

```powershell
pnpm vitest run src/context/QuoteWizardContext.test.tsx src/pages/crm/QuoteGeneratorRoute.test.tsx src/pages/crm/QuoteGeneratorPage.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/context/QuoteWizardContext.tsx src/context/QuoteWizardContext.test.tsx src/pages/crm/QuoteGeneratorRoute.tsx src/pages/crm/QuoteGeneratorRoute.test.tsx src/App.tsx
git commit -m "feat: isolate proposal wizard routes"
```

---

### Task 6: Editor page states and explicit review actions

**Files:**
- Modify: `src/pages/crm/QuoteGeneratorPage.tsx`
- Modify: `src/pages/crm/QuoteGeneratorPage.test.tsx`
- Modify: `src/components/quote-wizard/StepReview.tsx`

**Interfaces:**
- Consumes edit session fields from Task 5.
- Produces the approved loading, error, locked, and explicit-save UX.

- [ ] **Step 1: Add failing page-state tests**

Assert:

- loading renders skeletons and no default form.
- error renders retry and back actions.
- locked status renders `Visualizar proposta`, `Duplicar proposta`, and no `Próximo`.
- edit header contains proposal title, status badge, and `Alterações não salvas` only when dirty.
- edit review contains `Salvar alterações`, not `Salvar Proposta` or `Gerar Link Compartilhável`.

- [ ] **Step 2: Run the page test**

```powershell
pnpm vitest run src/pages/crm/QuoteGeneratorPage.test.tsx
```

Expected: FAIL on the new state assertions.

- [ ] **Step 3: Implement page states**

Use `ContentCard` skeleton geometry for loading. Use one generic message for missing and forbidden proposals:

```text
Não foi possível abrir esta proposta. Ela pode não existir ou não estar disponível para sua conta.
```

Locked copy:

```text
Esta proposta está Aprovada/Rejeitada e não pode mais ser alterada. Você ainda pode visualizá-la ou criar uma cópia editável.
```

The editable header shows `Editando proposta`, the title, status badge, and dirty badge.

- [ ] **Step 4: Split StepReview actions by mode**

Create mode retains its current four actions.

Edit mode renders:

- `Cancelar`.
- `Visualizar proposta`.
- `Copiar link` when `generatedShareLink` is present.
- `Salvar alterações`.

`Salvar alterações` calls `saveProposalChanges` exactly once. On success:

```ts
toast.success('Alterações salvas com sucesso.');
navigate(safeReturnTo, { replace: true });
```

`safeReturnTo` accepts `/`, `/opportunities`, or `/clients` paths only and otherwise returns `/opportunities`.

- [ ] **Step 5: Run tests and commit**

```powershell
pnpm vitest run src/pages/crm/QuoteGeneratorPage.test.tsx src/context/QuoteWizardContext.test.tsx
git add src/pages/crm/QuoteGeneratorPage.tsx src/pages/crm/QuoteGeneratorPage.test.tsx src/components/quote-wizard/StepReview.tsx
git commit -m "feat: add explicit proposal edit experience"
```

Expected: PASS and commit succeeds.

---

### Task 7: Unsaved-change navigation guard

**Files:**
- Create: `src/features/crm/proposals/useUnsavedProposalGuard.ts`
- Create: `src/features/crm/proposals/useUnsavedProposalGuard.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/crm/QuoteGeneratorPage.tsx`

**Interfaces:**
- Produces `{ blocker, confirmDiscard, continueEditing }`.
- Requires a data-router context and React Router `useBlocker`/`useBeforeUnload`.

- [ ] **Step 1: Write failing blocker tests using `createMemoryRouter`**

Test:

- clean editor navigation proceeds.
- dirty editor navigation becomes `blocked`.
- `continueEditing()` resets the blocker.
- `confirmDiscard()` proceeds.
- `beforeunload` calls `preventDefault()` only when dirty and not saving.

- [ ] **Step 2: Run and confirm failure**

```powershell
pnpm vitest run src/features/crm/proposals/useUnsavedProposalGuard.test.tsx
```

Expected: FAIL because the hook does not exist.

- [ ] **Step 3: Put the application under a data router**

Replace `BrowserRouter` with a `RouterProvider` created from one catch-all root route whose element contains `AppModuleProvider`, `WorkContextProvider`, `ActiveProjectProvider`, and `AppContent`.

Keep the existing `<Routes>` declarations inside `AppContent`; this limits the router migration to the shell while enabling `useBlocker`.

- [ ] **Step 4: Implement the guard**

```ts
const blocker = useBlocker(
  ({ currentLocation, nextLocation }) =>
    enabled && currentLocation.pathname !== nextLocation.pathname,
);

useBeforeUnload(
  useCallback((event) => {
    if (!enabled) return;
    event.preventDefault();
    event.returnValue = '';
  }, [enabled]),
  { capture: true },
);
```

Return `blocker.proceed` through `confirmDiscard` and `blocker.reset` through `continueEditing`.

- [ ] **Step 5: Render the approved dialog**

When blocked, render an `AlertDialog` with:

- Title `Descartar alterações?`
- Description explaining changes were not saved.
- Cancel action `Continuar editando`.
- Destructive action `Descartar alterações`.

Disable the guard while a successful save redirect is proceeding.

- [ ] **Step 6: Run navigation and shell regression tests**

```powershell
pnpm vitest run src/features/crm/proposals/useUnsavedProposalGuard.test.tsx src/components/MainLayout.test.tsx src/pages/crm/QuoteGeneratorRoute.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/features/crm/proposals/useUnsavedProposalGuard.ts src/features/crm/proposals/useUnsavedProposalGuard.test.tsx src/App.tsx src/pages/crm/QuoteGeneratorPage.tsx
git commit -m "feat: guard unsaved proposal edits"
```

---

### Task 8: Entry-point actions and locked affordances

**Files:**
- Modify: `src/components/Dashboard.tsx`
- Modify: `src/pages/crm/Opportunities.tsx`
- Create: `src/components/Dashboard.test.tsx`
- Create: `src/pages/crm/Opportunities.test.tsx`

**Interfaces:**
- Consumes `canEditProposal`.
- Produces canonical navigation with `location.state.returnTo`.

- [ ] **Step 1: Write failing action tests**

For editable proposals, assert navigation to:

```ts
`/generator/${proposal.id}/edit`
```

with:

```ts
{ state: { returnTo: currentLocation.pathname } }
```

For locked proposals, assert:

- edit button is disabled or absent.
- accessible text explains `Proposta finalizada: duplique para editar`.
- view and duplicate actions remain.

- [ ] **Step 2: Run and confirm failures**

```powershell
pnpm vitest run src/components/Dashboard.test.tsx src/pages/crm/Opportunities.test.tsx
```

Expected: FAIL until canonical edit navigation and locked affordances are implemented.

- [ ] **Step 3: Implement canonical edit actions**

Dashboard removes the query-string navigation and debug toast.

Opportunities adds edit actions to table/list/detail contexts where proposal actions are already present. Inline `EditableField` controls are disabled for locked statuses as well as non-owners.

- [ ] **Step 4: Run tests and commit**

```powershell
pnpm vitest run src/components/Dashboard.test.tsx src/pages/crm/Opportunities.test.tsx
git add src/components/Dashboard.tsx src/pages/crm/Opportunities.tsx src/components/Dashboard.test.tsx src/pages/crm/Opportunities.test.tsx
git commit -m "feat: route proposal edit actions safely"
```

Expected: tests PASS.

---

### Task 9: Public link and persisted interest-rate display

**Files:**
- Modify: `src/types/proposalSnapshot.ts`
- Modify: `src/hooks/useProposalSnapshot.ts`
- Modify: `src/components/ProposalDocument.tsx`
- Modify: `src/pages/crm/PublicProposalView.tsx`
- Add: `src/pages/crm/PublicProposalView.test.tsx`
- Add or modify: `src/components/ProposalDocument.test.tsx`

**Interfaces:**
- Consumes `getPublicProposalByToken`.
- Adds `payment.show_interest_rate: boolean` to `ProposalSnapshot`.

- [ ] **Step 1: Write failing public-view tests**

Assert:

- public view calls `getPublicProposalByToken(token)`.
- it never calls `useProposals().getProposalByShareToken`.
- invalid token shows the existing safe error state.
- a false interest flag hides the interest-rate row.
- a true flag shows a line labeled `Taxa de juros`.

- [ ] **Step 2: Run and confirm failures**

```powershell
pnpm vitest run src/pages/crm/PublicProposalView.test.tsx src/components/ProposalDocument.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Extend snapshot mapping**

Add:

```ts
payment: {
  type: 'cash' | 'installment';
  cash_discount_percentage: number;
  installment_number: number;
  installment_value: number;
  manual_installment_total: number;
  show_interest_rate: boolean;
}
```

Both owner and public snapshot mappers use `proposal.show_interest_rate ?? true`.

- [ ] **Step 4: Replace direct public table access**

`PublicProposalView` fetches the token RPC through TanStack Query or the API helper and maps the returned document into `ProposalSnapshot`.

Remove `getProposalByShareToken` from this route. Do not add an anonymous SELECT policy.

- [ ] **Step 5: Render the interest rate conditionally**

Compute:

```ts
const interestRate = snapshot.totals.subtotal > 0
  ? ((snapshot.totals.totalInstallment - snapshot.totals.subtotal)
      / snapshot.totals.subtotal) * 100
  : 0;
```

Show it only when payment is installment, installment count is greater than one, and `show_interest_rate` is true.

- [ ] **Step 6: Run tests and commit**

```powershell
pnpm vitest run src/pages/crm/PublicProposalView.test.tsx src/components/ProposalDocument.test.tsx
git add src/types/proposalSnapshot.ts src/hooks/useProposalSnapshot.ts src/components/ProposalDocument.tsx src/pages/crm/PublicProposalView.tsx src/pages/crm/PublicProposalView.test.tsx src/components/ProposalDocument.test.tsx
git commit -m "feat: preserve secure public proposal links"
```

Expected: PASS.

---

### Task 10: Remote dry-run and production migration approval gate

**Files:**
- Read: exact CLI-created migration from Task 3.
- Read: three SQL test files from Task 3.
- No source edits before evidence review.

**Interfaces:**
- Uses Supabase project `arbjhqbcoiuzlidvehtd`.

- [ ] **Step 1: Run read-only preflight and advisors**

Use Supabase MCP `execute_sql` with the exact contents of `proposal_edit_preflight.sql`.

Use Supabase MCP advisors:

- security
- performance

Expected: preflight succeeds. Record every advisor that touches `proposals`, `proposal_services`, `clients`, or the new function design.

- [ ] **Step 2: Present rollback dry-run impact and request approval**

Explain:

- temporary locks: brief DDL locks on three small tables.
- persistent effects: none because the transaction ends in `ROLLBACK`.
- data volume from the audit: 5 proposals and 4 owned clients.
- exact SQL files to be evaluated.

Do not continue without explicit user approval.

- [ ] **Step 3: Execute one transaction-wrapped rollback dry run after approval**

Read the CLI-created migration and both post-migration SQL tests in full. Submit one `execute_sql` request containing, without elision and in this order: `begin;`, the complete migration file, the complete contract test, the body of the RLS test between its outer `begin;` and `rollback;`, and one final `rollback;`.

Expected: success and no persistent schema change.

- [ ] **Step 4: Re-run read-only schema checks**

Confirm `show_interest_rate` and both RPCs are still absent from production after rollback. If present, stop immediately and report the unexpected persistent state.

- [ ] **Step 5: Present evidence and request production migration approval**

Provide:

- migration filename.
- rollback dry-run result.
- pre/post schema confirmation.
- security/performance advisor findings.
- exact persistent changes.
- backup/restore readiness.

Stop until the user explicitly approves applying the production migration.

---

### Task 11: Apply the approved migration and regenerate types

**Files:**
- Modify: `src/integrations/supabase/types.ts`
- Modify: `src/features/crm/proposals/proposalEditorApi.ts`

**Interfaces:**
- Requires explicit approval from Task 10.

- [ ] **Step 1: Apply exactly the reviewed migration**

Use Supabase MCP migration tooling with:

- project ID `arbjhqbcoiuzlidvehtd`
- migration name `secure_proposal_editing`
- SQL equal byte-for-byte to the reviewed migration file

Expected: one migration-history entry and no partial state.

- [ ] **Step 2: Run post-migration SQL contracts immediately**

Execute `proposal_edit_contract.sql`, then `proposal_edit_rls.sql`.

Expected: both complete successfully; the RLS test rolls back its synthetic data.

- [ ] **Step 3: Run advisors**

Run Supabase security and performance advisors again. Resolve any new issue caused by this migration through a new forward migration; never edit an already-applied migration.

- [ ] **Step 4: Regenerate TypeScript types**

Call Supabase `generate_typescript_types` for `arbjhqbcoiuzlidvehtd`. Replace `src/integrations/supabase/types.ts` with the generated output exactly.

Verify generated types contain:

```text
proposals.Row.show_interest_rate
Functions.update_editable_proposal
Functions.get_public_proposal_by_token
```

- [ ] **Step 5: Remove the temporary RPC cast**

Use the generated `supabase.rpc` types directly in `proposalEditorApi.ts`.

- [ ] **Step 6: Run type-oriented tests and commit**

```powershell
pnpm vitest run src/features/crm/proposals/proposalEditorApi.test.ts src/features/crm/proposals/proposalEditorMapper.test.ts
pnpm build
git add src/integrations/supabase/types.ts src/features/crm/proposals/proposalEditorApi.ts
git commit -m "chore: sync proposal editing database types"
```

Expected: tests and production build PASS.

---

### Task 12: Full regression and local browser verification

**Files:**
- Modify only files required by failures proven during this task.

**Interfaces:**
- Consumes the completed feature and migrated database.

- [ ] **Step 1: Run focused proposal suites**

```powershell
pnpm vitest run src/features/crm/proposals src/context/QuoteWizardContext.test.tsx src/pages/crm/QuoteGeneratorPage.test.tsx src/pages/crm/QuoteGeneratorRoute.test.tsx src/pages/crm/PublicProposalView.test.tsx src/components/ProposalDocument.test.tsx
```

Expected: all PASS.

- [ ] **Step 2: Run the full test suite**

```powershell
pnpm test
```

Expected: all existing and new tests PASS.

- [ ] **Step 3: Run static and production checks**

```powershell
pnpm lint
pnpm build
git diff --check
```

Expected: no new lint errors in touched files, successful production build, and no whitespace errors.

- [ ] **Step 4: Start the local app**

```powershell
pnpm dev --host 127.0.0.1 --port 8080
```

Expected: Vite reports `http://127.0.0.1:8080/` or the next available port.

- [ ] **Step 5: Verify editable flow in a real browser**

With an owned `Negociando` proposal:

- open edit from Dashboard.
- confirm real services/client/settings load at step one.
- change every field category.
- navigate away and test both guard choices.
- save once.
- confirm the same ID and token.
- confirm no duplicate row.
- confirm Dashboard and Opportunities refresh.

- [ ] **Step 6: Verify concurrency**

Open the same proposal in two tabs. Save tab A, then save stale tab B.

Expected: tab B shows the conflict state and no values from tab A are overwritten.

- [ ] **Step 7: Verify locked and public flows**

- Directly open an approved edit URL and confirm read-only behavior.
- Confirm view and duplicate remain available.
- Open the preserved `/p/{shareToken}` URL in a signed-out/private window.
- Confirm only committed values appear.
- Confirm interest-rate visibility follows the saved setting.

- [ ] **Step 8: Review database logs**

Use Supabase API and Postgres logs for the verification period. Confirm no permission loops, repeated failing RPCs, or unexpected anonymous table queries.

- [ ] **Step 9: Resolve any proven verification failure at its owning task**

If a check fails, return to the task that owns the failing file, add a failing regression test there, implement the smallest fix, rerun that task's exact test command, and use that task's explicit file list for a focused `fix:` commit. If no check fails, create no commit.

- [ ] **Step 10: Request code review**

Invoke `superpowers:requesting-code-review`, address findings through `superpowers:receiving-code-review`, rerun the affected checks, and then invoke `superpowers:finishing-a-development-branch`.

---

## Completion evidence

The branch is ready for integration only when all of the following are recorded:

- Status policy tests pass for all six statuses.
- Create/edit provider isolation tests pass.
- Database contract and RLS rollback tests pass.
- Remote migration has one reviewed history entry.
- Generated Supabase types match the applied schema.
- Full Vitest suite passes.
- Production build passes.
- Signed-out public URL works with the same token.
- Stale-tab save is rejected without mutation.
- Approved and rejected proposals are blocked in UI and RPC.
- No duplicate proposal is created by edit mode.
- Local browser verification is complete.
