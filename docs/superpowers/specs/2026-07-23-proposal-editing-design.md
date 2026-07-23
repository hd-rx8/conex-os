# CONEX.HUB Existing Proposal Editing Design

## Status

Product behavior, architecture, UX, and security approach approved for implementation planning on the isolated branch `codex/proposal-editing`.

No remote database mutation is authorized by this document alone. Database changes must first be implemented as a reviewed migration, validated against an isolated or local environment, and presented for approval before they are applied to the production Supabase project.

## Objective

Turn the current proposal-edit action into a reliable editor for an existing proposal.

The editor must:

- Load the complete persisted proposal instead of reusing stale creation state.
- Reuse the familiar four-step wizard.
- Update the same proposal only after an explicit save.
- Preserve the proposal ID, public share token, status, creation date, and history.
- Allow editing only while the proposal is `Rascunho`, `Criada`, `Enviada`, or `Negociando`.
- Prevent `Aprovada` and `Rejeitada` proposals from being edited.
- Protect against partial writes, cross-user access, and silent concurrent overwrites.
- Keep the public link stable and make it reflect changes only after a successful save.

## Current problem and root cause

The Dashboard currently navigates to `/generator?proposalId=<id>`, but `QuoteGeneratorPage` does not read the query parameter and never loads that proposal.

`QuoteWizardProvider` wraps the complete route tree in `App.tsx`. Its step and form state therefore survives route transitions. Clicking edit opens the creation wizard with whichever step and values happen to remain in the global provider.

The current persistence API is creation-oriented:

- `registerProposal` always creates a proposal.
- `generateShareableLink` always creates a draft.
- `updateProposal` updates the proposal header, deletes its services, and inserts replacements through separate client requests.

The current update sequence is not atomic. If service insertion fails after deletion, the proposal may remain without services.

## Confirmed product decisions

### Editable statuses

- `Rascunho`
- `Criada`
- `Enviada`
- `Negociando`

### Locked statuses

- `Aprovada`
- `Rejeitada`

Locked proposals remain available for viewing and duplication. The edit action is disabled or replaced with a clear explanation.

### Save behavior

- Saving is explicit.
- There is no autosave.
- The editor changes the existing proposal rather than creating a revision or duplicate.
- The public page changes only after the transaction commits.
- Leaving with unsaved changes requires confirmation.

## Chosen approach

### Route-scoped editor using the existing wizard

Creation and editing use the same step components but receive independent, route-scoped wizard sessions.

- `/generator` creates a new proposal.
- `/generator/:proposalId/edit` edits one existing proposal.
- The legacy `/generator?proposalId=<id>` URL redirects to the canonical edit route for backward compatibility.

The editor provider mounts inside the generator route instead of wrapping the entire application. Unmounting the route destroys the session, preventing proposal data and wizard steps from leaking into another navigation.

### Alternatives considered

1. **Patch the global provider:** smaller initial change, but keeps the stale-state architecture and mixes create/edit lifecycles.
2. **Route-scoped editor using the current wizard — selected:** keeps the familiar experience while isolating state and persistence.
3. **Quick-edit modal:** useful for a small set of fields, but unsuitable for services, pricing, client, validity, and branding.

## Routing and page composition

`App.tsx` owns protected create and edit routes. The route element mounts a dedicated proposal wizard provider with an explicit mode:

- `mode: "create"` for `/generator`.
- `mode: "edit"` plus `proposalId` for `/generator/:proposalId/edit`.

`QuoteGeneratorPage` receives the mode through the route-scoped context and renders one of four page states:

1. Loading.
2. Load/access error.
3. Locked read-only state.
4. Editable wizard.

The edit route always starts at the Services step after hydration. It must never render default creation values before the persisted proposal is available.

## Editor session model

The proposal wizard session contains:

- Mode: `create` or `edit`.
- Proposal ID in edit mode.
- Original `updated_at` value for concurrency control.
- Original status and share token.
- Hydrated form values.
- Current form values.
- Current wizard step.
- Dirty state.
- Loading and saving state.
- Save error or concurrency-conflict state.

The session exposes separate commands:

- `createProposal`.
- `saveProposalChanges`.
- `copyExistingShareLink`.
- `resetSession`.

Creation methods must not be callable from edit mode. Edit methods must not be callable from create mode.

## Hydration contract

The existing proposal snapshot query is extended or adapted into an editor-specific query that returns:

- `id`
- `title`
- `status`
- `amount`
- `owner`
- `created_at`
- `updated_at`
- `share_token`
- `client_id` and client display data
- `notes`
- payment settings
- validity settings
- branding settings
- all proposal services

Persisted service rows are mapped into the existing `SelectedService` shape, including:

- Service reference and display fields.
- Quantity.
- Base and custom prices.
- Discount value, percentage, and type.
- Features.
- Category and icon.
- Custom-service flag.
- Billing type.

Numeric database values are normalized once during hydration. The editor must not apply truthy fallbacks that turn valid zero values into defaults.

The selected client is hydrated as an existing client. Selecting another existing client changes only `client_id`. Creating a client is an explicit option. Editing an existing CRM client inline is outside this flow so one proposal edit cannot unexpectedly change other proposals.

## Persisting the interest-rate display option

The current `showInterestRate` setting exists only in React state. Reopening a proposal therefore cannot reconstruct the choice reliably.

The migration adds a non-null `show_interest_rate` field to `proposals` with a default of `true`, which also preserves the current behavior for existing rows. The field becomes part of the editor snapshot, save payload, public proposal snapshot, print snapshot, and generated Supabase types.

This is an additive compatibility change. It does not alter existing proposal totals.

## User experience

### Header

Edit mode displays:

- Eyebrow `CRM`.
- Title `Editando proposta`.
- Proposal title.
- Current status badge.
- Dirty indicator when local values differ from the hydrated snapshot.

### Wizard

The four existing steps remain:

1. Serviços
2. Configurações
3. Cliente
4. Revisar

The stepper and validation rules remain familiar. Edit mode uses the persisted proposal as its initial state and never generates a new draft.

### Final actions

The review step provides:

- `Cancelar`.
- `Visualizar proposta`.
- `Copiar link` when a share token exists.
- `Salvar alterações` as the primary edit action.

The creation-only actions for creating a draft or registering a new proposal are not shown in edit mode.

While saving:

- The save action is disabled.
- Duplicate submissions are blocked.
- A progress label is visible.
- Navigation remains guarded.

After success:

- The editor replaces its baseline with the committed snapshot.
- Dirty state becomes false.
- Relevant React Query caches are invalidated.
- A success message is shown.
- The app returns to `location.state.returnTo` only when it is an internal allowlisted CRM route, otherwise `/opportunities`. External URLs and authentication routes are never accepted as return targets.

### Unsaved-change guard

The guard covers:

- Internal React Router navigation.
- Sidebar navigation.
- Browser back/forward navigation where supported by the router.
- Page refresh or tab close through the browser's native confirmation.

The in-app dialog offers:

- `Continuar editando`.
- `Descartar alterações`.

Saving successfully removes the guard before redirecting.

### Locked proposals

An `Aprovada` or `Rejeitada` proposal cannot enter an editable form.

The route renders a read-only explanation with:

- `Visualizar proposta`.
- `Duplicar proposta`.
- `Voltar`.

Dashboard and Opportunities actions use the same policy to avoid presenting an edit affordance that the database will reject.

### Loading and errors

- Loading uses skeletons shaped like the editor header, stepper, and content.
- A missing proposal does not fall back to an empty creation form.
- An inaccessible proposal uses the same generic not-found/access-denied message to avoid leaking existence across users.
- Retry is available for transient load errors.
- Validation errors remain next to the relevant fields.
- A concurrency conflict explains that a newer version exists and offers `Recarregar versão mais recente`.

## Database save contract

### Atomic update RPC

A single PostgreSQL function performs an edit as one transaction.

Conceptual inputs:

- Proposal ID.
- Expected `updated_at`.
- Editable proposal fields.
- Existing client ID or an explicit new-client payload.
- Complete service collection.

Conceptual result:

- Committed proposal ID.
- New `updated_at`.
- Preserved share token.
- Persisted status.

The function:

1. Requires an authenticated user.
2. Selects the proposal by ID under RLS and locks it with `FOR UPDATE`.
3. Verifies ownership.
4. Verifies the current status is editable.
5. Compares the current and expected `updated_at`.
6. Validates required fields and numeric ranges.
7. Resolves an owned existing client or creates a new owned client inside the transaction.
8. Updates only editable proposal columns.
9. Replaces proposal services inside the same transaction.
10. Returns the committed identifiers and timestamp.

An exception at any point rolls back the proposal, new client, and service changes.

### Server-side validation

The RPC revalidates the business-critical constraints instead of trusting browser validation:

- Trimmed proposal title is not empty.
- At least one service is present.
- Client selection or new-client name is present.
- Service quantity is an integer greater than or equal to one.
- Base and custom prices are finite and non-negative.
- Percentage discounts remain between zero and 100.
- Fixed discounts are non-negative and cannot exceed the line total.
- Payment type is `cash` or `installment`.
- Cash discount remains between zero and 100.
- Installment count remains between 2 and 12 when installment payment is selected.
- Installment and manual total values are non-negative, with at least one positive installment value.
- Validity days is an integer greater than or equal to one when validity is enabled.
- Billing type is `one_time` or `monthly`.
- Gradient theme is one of the currently supported themes.

The server computes or verifies the persisted proposal amount from the normalized service and payment inputs. A browser-provided amount is not treated as authoritative.

### Immutable fields

The edit RPC never accepts replacements for:

- `id`
- `owner`
- `status`
- `share_token`
- `created_at`
- `approved_at`

`updated_at` remains trigger-controlled.

Status changes continue through their existing explicit workflow. A concurrent transition to `Aprovada` or `Rejeitada` causes the edit transaction to fail.

### Function security

The edit function uses `SECURITY INVOKER` and the caller's RLS permissions.

- Revoke execution from `PUBLIC` and `anon`.
- Grant execution only to `authenticated`.
- Use a fixed empty `search_path` and schema-qualified objects.
- Keep the transaction short and free of network calls.
- Do not expose a service-role key to the browser.

## RLS and related hardening

The production read-only audit on 2026-07-23 confirmed:

- `proposals` has owner-scoped select, insert, update, and delete policies.
- `proposal_services` has owner-derived select, insert, update, and delete policies.
- `clients` still has a temporary authenticated read policy with `qual = true`.
- All four current clients have a non-null owner.

The migration replaces the temporary client-read policy with an owner-scoped policy and makes update ownership checks explicit with both `USING` and `WITH CHECK`.

Proposal-service policies are normalized to use `(select auth.uid())` in ownership checks. This preserves behavior while avoiding repeated function evaluation.

The migration adds supporting indexes if absent:

- `proposal_services(proposal_id)`
- `clients(created_by)`

The existing indexes on `proposals(owner)` and unique `proposals(share_token)` are preserved.

## Secure public proposal access

The public route currently reads `proposals` directly by `share_token`, but owner-only proposal RLS correctly blocks anonymous table access.

The public view is changed to call a dedicated read-only token function instead of reopening table-wide anonymous access.

The token function:

- Accepts one UUID share token.
- Returns at most one proposal document payload.
- Exposes only fields required by the public proposal page.
- Does not return the owner ID or internal-only fields.
- Uses an empty `search_path` and schema-qualified relations.
- Is executable only by `anon` and `authenticated`.
- Uses the unguessable, unique share token as the capability.

Because this function must read through owner RLS for an anonymous visitor, it may use `SECURITY DEFINER`. Its scope is limited to the exact token lookup, its output contract is explicit, and default `PUBLIC` execution is revoked.

The edit flow never changes the token. A signed-out browser must continue to resolve the same URL after a successful edit.

## Status type consistency

The database check constraint already includes `Negociando`, and application status unions also include it. The generated Supabase enum constants do not.

After the migration:

- Regenerate `src/integrations/supabase/types.ts` from the linked schema.
- Keep one application-level `ProposalStatus` source of truth.
- Derive editable and locked status sets from that shared type.
- Add a regression test covering `Negociando`.

The proposal `status` column remains text with its check constraint; the unrelated generated enum must not be treated as the proposal column type.

## Client integration

The browser calls the edit RPC through `supabase.rpc`.

The client mutation:

- Sends only validated editable fields.
- Uses the `updated_at` captured during hydration.
- Maps database error codes into stable UI error categories.
- Invalidates focused query keys instead of every query in the application.

At minimum, invalidate:

- Proposal snapshot for the edited ID.
- Owner proposal lists.
- Dashboard proposal data.
- Opportunities data.
- Public proposal data for the preserved token when cached.

The old non-atomic `updateProposal` path must not be used for full proposal editing. Small status-only updates may remain separate, but they retain their explicit status semantics.

## Concurrency behavior

The database row lock serializes overlapping saves. The expected timestamp prevents the second editor from silently overwriting the first.

If the timestamp no longer matches:

- No header or service data is changed.
- The RPC returns a recognizable conflict error.
- The client keeps the user's local values.
- The UI offers to reload the latest persisted proposal.

Automatic merging is outside this scope.

## Migration and rollout safety

### Read-only preflight already completed

The 2026-07-23 Supabase audit found:

- 5 proposals.
- 4 clients.
- 0 clients without `created_by`.
- 0 proposals without a client.
- No index on `proposal_services(proposal_id)`.
- No index on `clients(created_by)`.

No database records or schema objects were changed during the audit.

### Implementation sequence

1. Create tests that reproduce stale wizard state and non-atomic update expectations.
2. Refactor the wizard provider to route scope without changing creation behavior.
3. Add edit hydration and locked-state UI.
4. Create the migration containing the additive field, RPCs, indexes, and policy corrections with `supabase migration new`; do not invent the migration filename.
5. Validate the migration against an isolated Supabase branch or local database.
6. Run database contract tests, RLS tests, and rollback tests.
7. Regenerate Supabase types.
8. Integrate explicit save, conflict handling, query invalidation, and navigation guard.
9. Verify create, edit, print, and public-link flows locally.
10. Run Supabase security and performance advisors.
11. Present migration evidence and request approval before applying it to the remote production project.

### Rollback

Before remote application, preserve the existing backup/restore point.

Application rollback can disable the edit route without deleting proposal data. Database rollback must avoid dropping data written to `show_interest_rate`; if reversal is required, the column is retained until a separate reviewed cleanup.

RPCs and grants can be revoked independently. Policy rollback must never restore broad authenticated client visibility without explicit approval.

## Testing strategy

### Unit tests

- Snapshot-to-form mapping preserves zeros, discounts, billing types, validity, branding, client, and services.
- Edit mode starts at the first step after hydration.
- Create and edit sessions do not share state.
- Dirty state changes only after user edits.
- Successful save resets the baseline.
- Editable and locked status helpers cover every status, including `Negociando`.
- Edit mode never calls creation mutations.

### Component and routing tests

- `/generator` opens a clean create session.
- `/generator/:id/edit` loads the requested proposal.
- The legacy query URL redirects correctly.
- Loading does not flash default data.
- Missing/inaccessible proposals show an error state.
- Locked statuses show view and duplicate actions but no editable fields.
- Navigation with dirty state shows the explicit discard dialog.
- Review shows `Salvar alterações` and the existing share link.
- A successful save returns to the recorded origin.

### Database contract tests

- The owner can update every editable status.
- `Aprovada` and `Rejeitada` are rejected.
- A non-owner cannot load or update the proposal.
- Header and services commit together.
- Invalid service input rolls back the complete transaction.
- A stale `updated_at` produces a conflict without mutation.
- Proposal ID, owner, status, share token, and creation timestamp are preserved.
- New-client creation rolls back when proposal saving fails.
- Client and service RLS policies isolate users.
- Public token lookup returns one limited document.
- Invalid public tokens return no data.

### Browser verification

Verify locally with two proposals:

1. Editable `Negociando` proposal.
2. Locked `Aprovada` proposal.

For the editable proposal:

- Open from Dashboard and Opportunities.
- Change services, pricing, client, payment, validity, theme, notes, and interest-rate visibility.
- Navigate between all steps.
- Attempt to leave without saving.
- Save once.
- Confirm no duplicate proposal was created.
- Confirm the same public URL shows the committed values in a signed-out browser.
- Confirm another editor with stale data receives a conflict.

For the locked proposal:

- Confirm edit is unavailable from list actions.
- Open the edit URL directly.
- Confirm the server and UI both block mutation.
- Confirm viewing and duplication remain available.

### Required checks

- Focused Vitest suite.
- Full `pnpm test` suite.
- TypeScript checks used by the project.
- ESLint with no new errors in touched files.
- Production `pnpm build`.
- Supabase database tests.
- Supabase security advisor.
- Supabase performance advisor.

## Non-goals

- Autosave.
- Proposal version history or revisions.
- Collaborative live editing.
- Automatic conflict merging.
- Editing approved or rejected proposals.
- Editing the selected CRM client's master data inside the proposal wizard.
- Changing proposal status as part of content saving.
- Redesigning the public proposal document.
- Changing the proposal calculation formulas.

## Acceptance criteria

- Clicking edit opens the requested proposal with its real persisted values.
- The wizard never displays state left by another proposal or route.
- Editing updates the existing record only.
- The proposal ID and public link remain unchanged.
- Public data changes only after explicit save succeeds.
- Approved and rejected proposals cannot be edited through either UI or database calls.
- A failure cannot leave services partially deleted.
- Concurrent edits cannot silently overwrite one another.
- Cross-user proposal, service, and client access is blocked by RLS.
- The signed-out public link remains functional without broad anonymous table access.
- Creation behavior remains functional and independent.
- All required automated and browser checks pass before remote migration approval.
