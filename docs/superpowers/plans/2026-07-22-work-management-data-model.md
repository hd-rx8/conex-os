# Work Management Data Model Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken legacy Work contract with a data-preserving, tenant-secure hierarchy and make `/work` load it with bounded, cached queries.

**Architecture:** A single forward migration renames the two legacy Work tables, creates the canonical workspace hierarchy, migrates existing IDs and rows, and installs indexed RLS policies backed by protected membership helpers. The frontend then regenerates its Supabase types, uses one TanStack Query data layer, loads the navigation tree in one request, fetches tasks lazily by list, and redirects legacy project routes to `/work`.

**Tech Stack:** PostgreSQL 17/Supabase, RLS, Supabase MCP, React 18, TypeScript 5, TanStack Query 5, React Router 6, Vitest 2, Testing Library, Vite 5.

## Global Constraints

- Remote project: `conex-os` (`arbjhqbcoiuzlidvehtd`).
- Preserve every row and UUID from `projects` and `tasks`; never drop the renamed legacy tables in this delivery.
- Never expose `service_role`, secret keys, access tokens, or private row contents.
- Run a read-only preflight and a transaction-wrapped `ROLLBACK` dry run before `apply_migration`.
- Stop immediately if remote counts, owners, foreign keys, or recognized status/priority values differ from the preflight assumptions.
- Apply one final remote migration only after its exact SQL passes the rollback dry run.
- Keep RLS enabled on every exposed Work table; `anon` receives no Work privileges.
- Use `SECURITY DEFINER` only for boolean membership helpers in the non-exposed `private` schema, with an empty `search_path`, fully-qualified objects, revoked `PUBLIC` execution, and explicit `authenticated` grants.
- Do not edit already-applied migration history. Corrections are new forward migrations.
- Keep the local Vite server available at `http://127.0.0.1:8080` during frontend work.

---

## File Structure

- `supabase/tests/work_preflight.sql` — aborts unless the remote legacy schema and values match the migration assumptions.
- `supabase/tests/work_schema_contract.sql` — asserts canonical tables, relationships, indexes, RLS, migrated counts, and preserved IDs.
- `supabase/tests/work_rls.sql` — transaction-scoped two-user isolation checks that always roll back.
- The path printed by `npx supabase migration new stabilize_work_hierarchy` under `supabase/migrations/` — the only forward DDL/data migration; the CLI allocates the timestamp so no timestamp is invented in this plan.
- `src/integrations/supabase/types.ts` — regenerated from the migrated remote project.
- `src/features/work/api/workApi.ts` — typed Supabase operations and error normalization.
- `src/features/work/api/workMappers.ts` — pure transformation of nested PostgREST rows into `WorkspaceTree`.
- `src/features/work/api/workQueryKeys.ts` — stable query-key factory.
- `src/features/work/hooks/useWorkData.ts` — TanStack Query hooks and narrowly-scoped invalidation.
- `src/features/work/api/workMappers.test.ts` — mapper and error contract tests.
- `src/features/work/hooks/useWorkData.test.tsx` — query loading, error, retry, and cache tests.
- `src/test/setup.ts` — DOM test matchers and cleanup.
- `vitest.config.ts` — isolated test configuration and `@` alias.
- `tsconfig.work.json` — scoped type check for the canonical Work delivery.
- `src/types/hierarchy.ts` — canonical domain types aligned with generated database types.
- `src/pages/work/WorkManagement.tsx` — canonical module home and state rendering.
- `src/hooks/useWorkspaces.ts`, `src/hooks/useSpaces.ts`, `src/hooks/useHierarchyTasks.ts` — compatibility facades over the new query layer while callers migrate.
- `src/context/AppModuleContext.tsx`, `src/components/AppSwitcher.tsx`, `src/components/NavigationSidebar.tsx`, `src/App.tsx` — canonical `/work` navigation and legacy redirects.
- `src/hooks/useFABContext.tsx`, `src/hooks/useFABActions.tsx`, `src/components/GlobalFAB.tsx` — remove unconditional legacy `useProjects` queries from the global layout.

---

### Task 1: Add the Test Harness and Prove the Remote Contract Is Broken

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `tsconfig.work.json`
- Create: `supabase/tests/work_preflight.sql`

**Interfaces:**
- Produces: `npm test`, `npm run test:watch`, and `npm run typecheck:work`.
- Produces: a preflight query whose expected current result is a deliberate failure: `canonical Work schema is missing`.

- [ ] **Step 1: Install pinned test-only dependencies**

Run:

```powershell
npm install --save-dev vitest@2.1.9 jsdom@25.0.1 @testing-library/react@16.1.0 @testing-library/jest-dom@6.6.3
```

Expected: `package.json` and `package-lock.json` change; runtime dependencies remain unchanged.

- [ ] **Step 2: Add exact scripts and test configuration**

Add these scripts to `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest",
"typecheck:work": "tsc -p tsconfig.work.json --noEmit"
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    clearMocks: true,
  },
});
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());
```

Create `tsconfig.work.json`:

```json
{
  "extends": "./tsconfig.app.json",
  "compilerOptions": { "types": ["vitest/globals"] },
  "include": [
    "src/features/work/**/*.ts",
    "src/features/work/**/*.tsx",
    "src/pages/work/**/*.tsx",
    "src/hooks/useWorkspaces.ts",
    "src/hooks/useSpaces.ts",
    "src/hooks/useHierarchyTasks.ts",
    "src/types/hierarchy.ts",
    "src/integrations/supabase/**/*.ts",
    "src/test/**/*.ts"
  ]
}
```

- [ ] **Step 3: Write the failing remote preflight assertion**

Create `supabase/tests/work_preflight.sql`:

```sql
do $$
declare
  unexpected_priority text;
  unexpected_status text;
begin
  if to_regclass('public.projects') is null or to_regclass('public.tasks') is null then
    raise exception 'legacy projects/tasks schema is not available';
  end if;

  if to_regclass('public.workspaces') is not null
     or to_regclass('public.spaces') is not null
     or to_regclass('public.lists') is not null then
    raise exception 'canonical schema already exists; stop and re-audit before migrating';
  end if;

  select priority into unexpected_priority
  from public.tasks
  where priority not in ('Baixa', 'Media', 'Média', 'Alta', 'Urgente')
  limit 1;

  if unexpected_priority is not null then
    raise exception 'unsupported legacy priority: %', unexpected_priority;
  end if;

  select status into unexpected_status
  from public.tasks
  where status not in ('Pendente', 'Em Progresso', 'Concluída')
  limit 1;

  if unexpected_status is not null then
    raise exception 'unsupported legacy task status: %', unexpected_status;
  end if;

  raise exception 'RED: canonical Work schema is missing as expected';
end
$$;
```

- [ ] **Step 4: Run the preflight through Supabase MCP and verify RED**

Use `execute_sql` on project `arbjhqbcoiuzlidvehtd` with the exact file contents.

Expected: failure ending in `RED: canonical Work schema is missing as expected`. Any earlier exception is a blocker and requires a new audit; do not continue.

- [ ] **Step 5: Commit the safety harness**

```powershell
git add package.json package-lock.json vitest.config.ts tsconfig.work.json src/test/setup.ts supabase/tests/work_preflight.sql
git commit -m "test: add work migration safety harness"
```

---

### Task 2: Create, Dry-Run, Apply, and Verify the Canonical Work Migration

**Files:**
- Create via CLI: the exact `supabase/migrations/` path printed by `npx supabase migration new stabilize_work_hierarchy`
- Create: `supabase/tests/work_schema_contract.sql`
- Create: `supabase/tests/work_rls.sql`

**Interfaces:**
- Produces: `public.workspaces`, `workspace_members`, `spaces`, `folders`, `lists`, `tasks`, and `subtasks`.
- Preserves: source tables as `legacy_projects` and `legacy_tasks`, plus every source UUID.
- Produces private helpers: `private.is_workspace_member(uuid)`, `private.can_edit_workspace(uuid)`, `private.is_workspace_admin(uuid)`, `private.can_access_space(uuid)`, `private.can_edit_space(uuid)`, `private.can_access_list(uuid)`, `private.can_edit_list(uuid)`, `private.can_access_task(uuid)`, and `private.can_edit_task(uuid)`.

- [ ] **Step 1: Snapshot immutable pre-migration evidence**

Use MCP `execute_sql` and save the returned counts/IDs in the implementation commentary:

```sql
select 'projects' as entity, count(*) as rows, array_agg(id order by id) as ids
from public.projects
union all
select 'tasks', count(*), array_agg(id order by id)
from public.tasks;

select p.owner, count(*) as projects
from public.projects p
group by p.owner
order by p.owner;

select t.priority, t.status, count(*)
from public.tasks t
group by t.priority, t.status
order by t.priority, t.status;
```

Expected from the current audit: one project and one task. If values changed, update only the expected evidence after explaining the delta; never weaken the migration assertions.

- [ ] **Step 2: Create the migration path with the CLI**

Discover the installed command first:

```powershell
npx supabase --version
npx supabase migration new stabilize_work_hierarchy
```

Expected: the CLI prints the exact new file path. Use that path for every remaining step; do not hand-author a timestamp.

- [ ] **Step 3: Write the migration with these exact ordered sections**

The migration must contain, in order:

```sql
create schema if not exists private;
revoke all on schema private from public, anon;

alter table public.tasks rename to legacy_tasks;
alter table public.projects rename to legacy_projects;

revoke all on public.legacy_tasks from anon, authenticated;
revoke all on public.legacy_projects from anon, authenticated;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 120),
  description text,
  icon text,
  color text,
  owner uuid not null references public.app_users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 160),
  description text,
  status text not null default 'Ativo' check (status in ('Ativo', 'Concluído', 'Arquivado')),
  icon text,
  color text,
  custom_statuses jsonb not null default '[]'::jsonb,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.folders (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 160),
  description text,
  icon text,
  color text,
  custom_statuses jsonb,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, space_id)
);

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  folder_id uuid,
  name text not null check (length(btrim(name)) between 1 and 160),
  description text,
  icon text,
  color text,
  custom_statuses jsonb,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lists_folder_space_fkey
    foreign key (folder_id, space_id)
    references public.folders(id, space_id)
    on delete cascade
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 240),
  description text,
  status text not null default 'Pendente',
  priority text not null default 'Média' check (priority in ('Baixa', 'Média', 'Alta', 'Urgente')),
  due_date date,
  assignee_id uuid references public.app_users(id) on delete set null,
  creator_id uuid not null references public.app_users(id) on delete restrict,
  tags text[],
  estimated_hours numeric(10,2) check (estimated_hours is null or estimated_hours >= 0),
  actual_hours numeric(10,2) check (actual_hours is null or actual_hours >= 0),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  parent_subtask_id uuid,
  title text not null check (length(btrim(title)) between 1 and 240),
  description text,
  status text not null default 'Pendente',
  priority text not null default 'Média' check (priority in ('Baixa', 'Média', 'Alta', 'Urgente')),
  assignee_id uuid references public.app_users(id) on delete set null,
  creator_id uuid not null references public.app_users(id) on delete restrict,
  due_date date,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (id, task_id),
  constraint subtasks_parent_task_fkey
    foreign key (parent_subtask_id, task_id)
    references public.subtasks(id, task_id)
    on delete cascade,
  check (parent_subtask_id is null or parent_subtask_id <> id)
);
```

Immediately after the table DDL, append Appendix A exactly. It contains the indexes, data copy, assertions, triggers, private helpers, grants, RLS enablement, and separate command policies. Policy writes distinguish editors (`owner`, `admin`, `member`) from read-only viewers and use both `USING` and `WITH CHECK` on updates.

The migration's final statement must be:

```sql
notify pgrst, 'reload schema';
```

- [ ] **Step 4: Write contract and RLS tests before applying the migration**

`supabase/tests/work_schema_contract.sql` must assert:

```sql
do $$
begin
  if to_regclass('public.workspaces') is null
     or to_regclass('public.workspace_members') is null
     or to_regclass('public.spaces') is null
     or to_regclass('public.folders') is null
     or to_regclass('public.lists') is null
     or to_regclass('public.tasks') is null
     or to_regclass('public.subtasks') is null then
    raise exception 'canonical Work table missing';
  end if;

  if to_regclass('public.legacy_projects') is null
     or to_regclass('public.legacy_tasks') is null then
    raise exception 'legacy recovery table missing';
  end if;

  if exists (
    select 1 from public.legacy_projects lp
    where not exists (select 1 from public.spaces s where s.id = lp.id)
  ) then
    raise exception 'legacy project id not preserved';
  end if;

  if exists (
    select 1 from public.legacy_tasks lt
    where not exists (select 1 from public.tasks t where t.id = lt.id)
  ) then
    raise exception 'legacy task id not preserved';
  end if;
end
$$;
```

`supabase/tests/work_rls.sql` must run inside `begin; ... rollback;`, seed two synthetic users and workspaces as the privileged test connection, switch to `authenticated` with `set local request.jwt.claims`, and assert user A receives zero rows and cannot update user B's space. The script must raise on any cross-tenant visibility and end with `rollback` even on success.

- [ ] **Step 5: Execute a full rollback dry run**

Use MCP `execute_sql` with:

```sql
begin;
-- exact migration body
-- exact schema contract body
rollback;
```

Expected: success, followed by a read-only check confirming `public.projects` and `public.tasks` still exist and `public.workspaces` does not. If the dry run fails, modify only the local unapplied migration and repeat; maximum two corrective attempts before stopping for architectural review.

- [ ] **Step 6: Run advisors before the final write**

Call `get_advisors` for both `security` and `performance`. Record the pre-existing findings. New Work-specific always-true policies, public function execution, mutable search paths, or missing foreign-key indexes are blockers.

- [ ] **Step 7: Apply exactly one recorded migration**

Call Supabase MCP `apply_migration` with:

```text
project_id: arbjhqbcoiuzlidvehtd
name: stabilize_work_hierarchy
query: exact contents of the CLI-created migration file
```

Expected: one new migration-history entry and no partial schema state.

- [ ] **Step 8: Verify GREEN immediately**

Run the exact schema contract and RLS files with `execute_sql`, then list tables and migrations. Compare post-migration legacy/canonical counts and IDs with Step 1.

Expected: all assertions pass; one legacy project maps to one space; one legacy task maps to one canonical task; legacy recovery tables remain.

- [ ] **Step 9: Commit migration and SQL tests**

```powershell
git add supabase/migrations supabase/tests/work_schema_contract.sql supabase/tests/work_rls.sql
git commit -m "feat: migrate work data to secure hierarchy"
```

---

### Task 3: Regenerate the Database Contract and Align Domain Types

**Files:**
- Modify: `src/integrations/supabase/types.ts`
- Modify: `src/types/hierarchy.ts`

**Interfaces:**
- Produces generated `Tables<'workspaces'>`, `Tables<'spaces'>`, `Tables<'lists'>`, `Tables<'tasks'>`, and related relationship metadata.
- Produces `WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer'` and canonical `SpaceStatus`, `TaskPriority`, and task/subtask shapes.

- [ ] **Step 1: Verify the existing type contract fails**

Run:

```powershell
npm run typecheck:work
```

Expected: failures showing missing `spaces`, `lists`, `subtasks`, `list_id`, `creator_id`, or Supabase relationships.

- [ ] **Step 2: Regenerate types from the migrated remote project**

Call MCP `generate_typescript_types` for `arbjhqbcoiuzlidvehtd` and replace only `src/integrations/supabase/types.ts` with its returned `types` string.

- [ ] **Step 3: Align the hand-written domain types**

Update `src/types/hierarchy.ts` so:

```ts
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';
export type SpaceStatus = 'Ativo' | 'Concluído' | 'Arquivado';
export type TaskPriority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';

export interface Space {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  status: SpaceStatus;
  icon: string | null;
  color: string | null;
  custom_statuses: CustomStatus[];
  position: number;
  created_at: string;
  updated_at: string;
}
```

Add `priority: TaskPriority` to `Subtask` and its create/update inputs. Rename the stale relation property `hierarchy_tasks?` to `tasks?`.

- [ ] **Step 4: Verify scoped type progress**

Run `npm run typecheck:work`.

Expected: database relation errors disappear. Remaining errors must be limited to legacy Work callers scheduled in Tasks 4–6.

- [ ] **Step 5: Commit the database contract**

```powershell
git add src/integrations/supabase/types.ts src/types/hierarchy.ts
git commit -m "chore: regenerate work database types"
```

---

### Task 4: Build the Canonical Cached Query Layer with TDD

**Files:**
- Create: `src/features/work/api/workQueryKeys.ts`
- Create: `src/features/work/api/workMappers.ts`
- Create: `src/features/work/api/workApi.ts`
- Create: `src/features/work/api/workMappers.test.ts`
- Create: `src/features/work/hooks/useWorkData.ts`
- Create: `src/features/work/hooks/useWorkData.test.tsx`
- Modify: `src/hooks/useWorkspaces.ts`
- Modify: `src/hooks/useSpaces.ts`
- Modify: `src/hooks/useHierarchyTasks.ts`

**Interfaces:**
- Produces: `workQueryKeys.workspaces`, `workQueryKeys.tree(workspaceId)`, `workQueryKeys.tasks(listId, filters)`, `fetchWorkspaces`, `fetchWorkspaceTree`, `fetchTasksByList`, `normalizeWorkError`, `useWorkspacesQuery`, `useWorkspaceTreeQuery`, and `useListTasksQuery`.
- Consumes: generated `Database` types and the existing Supabase client.

- [ ] **Step 1: Write failing mapper and error tests**

Test that a nested row with one folder list and one direct list maps into separate `folder.lists` and `space.lists` arrays; test that a PostgREST error preserves `code`, `message`, `details`, and `hint` while producing safe Portuguese UI copy.

Run:

```powershell
npm test -- src/features/work/api/workMappers.test.ts
```

Expected: FAIL because the mapper and normalizer do not exist.

- [ ] **Step 2: Implement minimal pure mapper and error normalization**

`workMappers.ts` exports:

```ts
export function mapWorkspaceTreeRow(row: WorkspaceTreeRow): WorkspaceTree;
```

`workApi.ts` exports:

```ts
export interface WorkDataError {
  code: string;
  message: string;
  details: string | null;
  hint: string | null;
  userMessage: string;
}

export function normalizeWorkError(error: unknown): WorkDataError;
```

Use no `any`; unknown errors receive code `WORK_UNKNOWN` and user copy `Não foi possível carregar os dados do Work Management.`

- [ ] **Step 3: Verify mapper GREEN**

Run the mapper test again. Expected: PASS.

- [ ] **Step 4: Write failing query-hook tests**

With a fresh `QueryClient` per test, verify:

- No list ID means no task request.
- Two consumers of the same workspace tree share one request.
- Retry calls the query function again once.
- A workspace mutation invalidates only `workspaces` and its tree.

Expected: FAIL because the hooks and key factory do not exist.

- [ ] **Step 5: Implement the minimal query layer**

The tree query selects only:

```text
id,name,description,icon,color,owner,created_at,updated_at,
spaces(id,workspace_id,name,description,status,icon,color,custom_statuses,position,created_at,updated_at,
  folders(id,space_id,name,description,icon,color,custom_statuses,position,created_at,updated_at),
  lists(id,space_id,folder_id,name,description,icon,color,custom_statuses,position,created_at,updated_at)
)
```

Tasks use `enabled: Boolean(listId)`, `staleTime: 30_000`, `retry: 1`, and select only task fields plus assignee/creator display fields. Never fetch all tasks by default and never use a preliminary list-ID query for a selected list.

- [ ] **Step 6: Convert existing hooks into compatibility facades**

Keep their public return names temporarily, but delegate reads to the canonical hooks. Remove the five sequential requests from `getWorkspaceTree`; it calls the one nested API function. Preserve errors instead of returning `null` silently.

- [ ] **Step 7: Verify query layer GREEN**

Run:

```powershell
npm test -- src/features/work
npm run typecheck:work
```

Expected: all new tests pass and no canonical data-layer type errors remain.

- [ ] **Step 8: Commit the query layer**

```powershell
git add src/features/work src/hooks/useWorkspaces.ts src/hooks/useSpaces.ts src/hooks/useHierarchyTasks.ts
git commit -m "refactor: centralize cached work queries"
```

---

### Task 5: Switch the Reachable Work UI and Global Actions to the Canonical Contract

**Files:**
- Modify: `src/pages/work/WorkManagement.tsx`
- Modify: `src/context/AppModuleContext.tsx`
- Modify: `src/components/AppSwitcher.tsx`
- Modify: `src/components/NavigationSidebar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/hooks/useFABContext.tsx`
- Modify: `src/hooks/useFABActions.tsx`
- Modify: `src/components/GlobalFAB.tsx`
- Create: `src/features/work/navigation/workRoutes.ts`
- Create: `src/features/work/navigation/workRoutes.test.ts`
- Create: `src/pages/work/WorkManagement.test.tsx`

**Interfaces:**
- Produces: `WORK_HOME = '/work'` and `legacyWorkRedirect(pathname): string`.
- Removes: reachable imports and runtime calls to `useProjects` and `project_id`.

- [ ] **Step 1: Write failing navigation tests**

Assert:

```ts
expect(WORK_HOME).toBe('/work');
expect(legacyWorkRedirect('/projects')).toBe('/work');
expect(legacyWorkRedirect('/projects/tasks')).toBe('/work');
expect(legacyWorkRedirect('/projects/abc')).toBe('/work/project/abc');
```

Run the file. Expected: FAIL because the helper does not exist.

- [ ] **Step 2: Implement route constants and redirects**

Use `WORK_HOME` in `AppModuleContext`, `AppSwitcher`, and `NavigationSidebar`. In `App.tsx`, replace rendered legacy project pages with explicit `<Navigate>` routes. Keep canonical `/work`, `/work/project/:projectId`, `/work/list/:listId`, and `/work/workspaces` routes.

- [ ] **Step 3: Write failing Work page state tests**

Mock only the canonical hook boundary and verify loading, empty workspace, failure with retry button, and successful tree rendering. Re-render the failure case and assert `toast.error` was called once, not twice.

Expected: FAIL because current error rendering and effect semantics do not satisfy the contract.

- [ ] **Step 4: Implement the Work page state machine**

Use canonical queries; render `Carregando workspaces…`, `Nenhum workspace encontrado`, and `Não foi possível carregar seus projetos` as distinct states. The retry button calls `refetch`. Trigger a toast from a `useEffect` keyed by `error.code`, never directly during render.

- [ ] **Step 5: Remove the global legacy query**

Refactor `useFABActions` and `GlobalFAB` so they do not import or call `useProjects`. Project creation uses canonical `createSpace` with the active workspace. Task creation is available only when a canonical list ID is present; otherwise the task action is disabled with explanatory copy. Update `useFABContext` to recognize `/work`, `/work/project/:projectId`, and `/work/list/:listId`.

- [ ] **Step 6: Verify reachable source has no legacy contract**

Run:

```powershell
rg -n "useProjects|project_id|path: '/projects'|work: '/projects'" src/App.tsx src/components/MainLayout.tsx src/components/GlobalFAB.tsx src/components/AppSwitcher.tsx src/components/NavigationSidebar.tsx src/context src/hooks/useFABContext.tsx src/hooks/useFABActions.tsx src/pages/work
```

Expected: no matches except intentional `<Navigate>` source paths in `App.tsx`.

- [ ] **Step 7: Verify tests and scoped types**

```powershell
npm test -- src/features/work src/pages/work/WorkManagement.test.tsx
npm run typecheck:work
```

Expected: PASS.

- [ ] **Step 8: Commit UI cutover**

```powershell
git add src/App.tsx src/context/AppModuleContext.tsx src/components/AppSwitcher.tsx src/components/NavigationSidebar.tsx src/components/GlobalFAB.tsx src/hooks/useFABContext.tsx src/hooks/useFABActions.tsx src/pages/work src/features/work/navigation
git commit -m "fix: route work module through canonical hierarchy"
```

---

### Task 6: Verify Database, Performance, Security, and the Local Browser Flow

**Files:**
- Modify only if a verification exposes a scoped defect.

**Interfaces:**
- Consumes: migrated schema, generated types, canonical queries, and `/work` UI.
- Produces: verification evidence with no unresolved Work-specific security warning or API error.

- [ ] **Step 1: Run local automated verification**

```powershell
npm test
npm run typecheck:work
npm run lint
npm run build
```

Expected: tests and scoped type check pass. Existing out-of-scope lint findings must be separated from new findings; touched files have none. Build succeeds without new warnings.

- [ ] **Step 2: Re-run remote contract and RLS tests**

Use MCP `execute_sql` for `work_schema_contract.sql` and `work_rls.sql`.

Expected: PASS with rollback preserving production rows.

- [ ] **Step 3: Run Supabase advisors after DDL**

Call `get_advisors` for `security` and `performance`.

Expected: no Work table has always-true write policies, missing RLS, public `SECURITY DEFINER` execution, mutable helper search paths, or missing foreign-key indexes. Include remediation links for any remaining advisor finding in the handoff.

- [ ] **Step 4: Verify API logs while exercising the local app**

Open `http://127.0.0.1:8080`, sign in with the existing session, switch to Work Management, select the migrated project and default `Tarefas` list, refresh, and retry one query only if intentionally simulated.

Then call MCP `get_logs(service: 'api')`.

Expected: `200` responses for `workspaces`, the nested tree, and list-scoped tasks; no new `404` for hierarchy tables and no relationship `400`.

- [ ] **Step 5: Verify query bounds**

Confirm in browser network evidence:

- Initial Work load performs one workspace-tree request.
- No tasks request occurs before a list is selected.
- Selecting a list performs one task request filtered by `list_id`.
- Re-rendering the same selected list does not duplicate the request while the cache is fresh.

- [ ] **Step 6: Check repository state and final diff**

```powershell
git status --short
git diff --check
git log --oneline -8
```

Expected: only intentional files are present; no `.tsbuildinfo`, credentials, logs, screenshots, or generated temporary artifacts are untracked.

- [ ] **Step 7: Final completion commit if verification required scoped fixes**

Review `git diff --name-only`, stage each verification-fix file by its explicit path, then run `git commit -m "fix: close work verification gaps"`.

Skip this commit when verification required no changes.

---

## Plan Self-Review Results

- Every specification success criterion maps to Tasks 2–6.
- The remote write is gated by read-only evidence, a rollback dry run, pre-write advisors, one final migration, immediate count/ID checks, and RLS tests.
- Legacy tables are renamed, privilege-revoked, preserved, and never dropped.
- The plan does not require a paid Supabase branch and does not assume production data can be copied to one.
- Work-specific type checking is isolated from unrelated pre-existing CRM errors while still checking imported Work dependencies.
- Viewer authorization is consistent across database roles and the existing frontend permission model.

## Appendix A: Exact Migration Continuation After Table Creation

```sql
create index work_workspaces_owner_idx
  on public.workspaces(owner);
create index work_workspace_members_user_workspace_idx
  on public.workspace_members(user_id, workspace_id);
create index work_spaces_workspace_position_idx
  on public.spaces(workspace_id, position);
create index work_folders_space_position_idx
  on public.folders(space_id, position);
create index work_lists_space_folder_position_idx
  on public.lists(space_id, folder_id, position);
create index work_lists_folder_idx
  on public.lists(folder_id) where folder_id is not null;
create index work_tasks_list_position_idx
  on public.tasks(list_id, position);
create index work_tasks_list_status_idx
  on public.tasks(list_id, status);
create index work_tasks_assignee_due_date_idx
  on public.tasks(assignee_id, due_date) where assignee_id is not null;
create index work_tasks_creator_idx
  on public.tasks(creator_id);
create index work_subtasks_task_parent_position_idx
  on public.subtasks(task_id, parent_subtask_id, position);
create index work_subtasks_parent_idx
  on public.subtasks(parent_subtask_id) where parent_subtask_id is not null;
create index work_subtasks_assignee_idx
  on public.subtasks(assignee_id) where assignee_id is not null;
create index work_subtasks_creator_idx
  on public.subtasks(creator_id);

create temporary table legacy_workspace_map (
  owner uuid primary key,
  workspace_id uuid not null unique
) on commit drop;

insert into legacy_workspace_map(owner, workspace_id)
select owner, gen_random_uuid()
from public.legacy_projects
group by owner;

insert into public.workspaces(
  id, name, description, icon, color, owner, created_at, updated_at
)
select
  m.workspace_id,
  'Workspace principal',
  'Workspace criado durante a migração segura do módulo Work',
  '🏢',
  '#4F46E5',
  m.owner,
  min(p.created_at),
  max(p.updated_at)
from legacy_workspace_map m
join public.legacy_projects p on p.owner = m.owner
group by m.workspace_id, m.owner;

insert into public.workspace_members(workspace_id, user_id, role, created_at)
select workspace_id, owner, 'owner', now()
from legacy_workspace_map;

insert into public.spaces(
  id, workspace_id, name, description, status, icon, color,
  custom_statuses, position, created_at, updated_at
)
select
  p.id,
  m.workspace_id,
  p.title,
  p.description,
  p.status,
  '📁',
  '#3B82F6',
  '[]'::jsonb,
  row_number() over (partition by p.owner order by p.created_at, p.id)::integer - 1,
  p.created_at,
  p.updated_at
from public.legacy_projects p
join legacy_workspace_map m on m.owner = p.owner;

create temporary table legacy_list_map (
  project_id uuid primary key,
  list_id uuid not null unique
) on commit drop;

insert into legacy_list_map(project_id, list_id)
select id, gen_random_uuid()
from public.legacy_projects;

insert into public.lists(
  id, space_id, folder_id, name, description, icon, color,
  custom_statuses, position, created_at, updated_at
)
select
  m.list_id,
  p.id,
  null,
  'Tarefas',
  'Lista padrão criada durante a migração',
  '📋',
  '#3B82F6',
  null,
  0,
  p.created_at,
  p.updated_at
from public.legacy_projects p
join legacy_list_map m on m.project_id = p.id;

insert into public.tasks(
  id, list_id, title, description, status, priority, due_date,
  assignee_id, creator_id, tags, estimated_hours, actual_hours,
  position, created_at, updated_at, completed_at
)
select
  t.id,
  m.list_id,
  t.title,
  t.description,
  t.status,
  case t.priority when 'Media' then 'Média' else t.priority end,
  t.due_date,
  t.owner,
  t.owner,
  null,
  null,
  null,
  row_number() over (partition by t.project_id order by t.created_at, t.id)::integer - 1,
  t.created_at,
  t.updated_at,
  case when t.status = 'Concluída' then t.updated_at else null end
from public.legacy_tasks t
join legacy_list_map m on m.project_id = t.project_id;

do $$
begin
  if (select count(*) from public.legacy_projects)
     <> (select count(*) from public.spaces) then
    raise exception 'project migration count mismatch';
  end if;

  if (select count(*) from public.legacy_tasks)
     <> (select count(*) from public.tasks) then
    raise exception 'task migration count mismatch';
  end if;

  if exists (
    select 1 from public.legacy_projects p
    where not exists (select 1 from public.spaces s where s.id = p.id)
  ) then
    raise exception 'project UUID preservation failed';
  end if;

  if exists (
    select 1 from public.legacy_tasks lt
    where not exists (select 1 from public.tasks t where t.id = lt.id)
  ) then
    raise exception 'task UUID preservation failed';
  end if;
end
$$;

create function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

create function private.set_completed_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'Concluída' and old.status is distinct from new.status then
    new.completed_at := now();
  elsif new.status <> 'Concluída' then
    new.completed_at := null;
  end if;
  return new;
end
$$;

create function private.prevent_workspace_owner_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.owner is distinct from old.owner then
    raise exception 'workspace owner cannot be reassigned';
  end if;
  return new;
end
$$;

create function private.protect_owner_membership()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.role = 'owner' and (
    new.role is distinct from old.role
    or new.user_id is distinct from old.user_id
    or new.workspace_id is distinct from old.workspace_id
  ) then
    raise exception 'workspace owner membership cannot be reassigned or demoted';
  end if;
  return new;
end
$$;

create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function private.set_updated_at();
create trigger workspaces_prevent_owner_change
before update on public.workspaces
for each row execute function private.prevent_workspace_owner_change();
create trigger workspace_members_protect_owner
before update on public.workspace_members
for each row execute function private.protect_owner_membership();
create trigger spaces_set_updated_at
before update on public.spaces
for each row execute function private.set_updated_at();
create trigger folders_set_updated_at
before update on public.folders
for each row execute function private.set_updated_at();
create trigger lists_set_updated_at
before update on public.lists
for each row execute function private.set_updated_at();
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function private.set_updated_at();
create trigger tasks_set_completed_at
before update on public.tasks
for each row execute function private.set_completed_at();
create trigger subtasks_set_updated_at
before update on public.subtasks
for each row execute function private.set_updated_at();
create trigger subtasks_set_completed_at
before update on public.subtasks
for each row execute function private.set_completed_at();

create function private.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = (select auth.uid())
  );
$$;

create function private.is_workspace_owner(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.workspaces w
    where w.id = p_workspace_id
      and w.owner = (select auth.uid())
  );
$$;

create function private.can_edit_workspace(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'admin', 'member')
  );
$$;

create function private.is_workspace_admin(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'admin')
  );
$$;

create function private.can_access_space(p_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.spaces s
    join public.workspace_members wm on wm.workspace_id = s.workspace_id
    where s.id = p_space_id and wm.user_id = (select auth.uid())
  );
$$;

create function private.can_edit_space(p_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.spaces s
    join public.workspace_members wm on wm.workspace_id = s.workspace_id
    where s.id = p_space_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'admin', 'member')
  );
$$;

create function private.can_access_list(p_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.lists l
    join public.spaces s on s.id = l.space_id
    join public.workspace_members wm on wm.workspace_id = s.workspace_id
    where l.id = p_list_id and wm.user_id = (select auth.uid())
  );
$$;

create function private.can_edit_list(p_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.lists l
    join public.spaces s on s.id = l.space_id
    join public.workspace_members wm on wm.workspace_id = s.workspace_id
    where l.id = p_list_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'admin', 'member')
  );
$$;

create function private.can_access_task(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tasks t
    join public.lists l on l.id = t.list_id
    join public.spaces s on s.id = l.space_id
    join public.workspace_members wm on wm.workspace_id = s.workspace_id
    where t.id = p_task_id and wm.user_id = (select auth.uid())
  );
$$;

create function private.can_edit_task(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tasks t
    join public.lists l on l.id = t.list_id
    join public.spaces s on s.id = l.space_id
    join public.workspace_members wm on wm.workspace_id = s.workspace_id
    where t.id = p_task_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'admin', 'member')
  );
$$;

revoke all on all functions in schema private from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_workspace_member(uuid) to authenticated;
grant execute on function private.is_workspace_owner(uuid) to authenticated;
grant execute on function private.can_edit_workspace(uuid) to authenticated;
grant execute on function private.is_workspace_admin(uuid) to authenticated;
grant execute on function private.can_access_space(uuid) to authenticated;
grant execute on function private.can_edit_space(uuid) to authenticated;
grant execute on function private.can_access_list(uuid) to authenticated;
grant execute on function private.can_edit_list(uuid) to authenticated;
grant execute on function private.can_access_task(uuid) to authenticated;
grant execute on function private.can_edit_task(uuid) to authenticated;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.spaces enable row level security;
alter table public.folders enable row level security;
alter table public.lists enable row level security;
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;

revoke all on public.workspaces, public.workspace_members, public.spaces,
  public.folders, public.lists, public.tasks, public.subtasks from anon;
grant select, insert, update, delete on public.workspaces, public.workspace_members,
  public.spaces, public.folders, public.lists, public.tasks, public.subtasks
  to authenticated;

create policy workspaces_select on public.workspaces
for select to authenticated
using (owner = (select auth.uid()) or private.is_workspace_member(id));
create policy workspaces_insert on public.workspaces
for insert to authenticated
with check (owner = (select auth.uid()));
create policy workspaces_update on public.workspaces
for update to authenticated
using (private.is_workspace_admin(id))
with check (private.is_workspace_admin(id));
create policy workspaces_delete on public.workspaces
for delete to authenticated
using (owner = (select auth.uid()));

create policy workspace_members_select on public.workspace_members
for select to authenticated
using (private.is_workspace_member(workspace_id));
create policy workspace_members_insert on public.workspace_members
for insert to authenticated
with check (
  (role = 'owner' and user_id = (select auth.uid())
    and private.is_workspace_owner(workspace_id))
  or (role <> 'owner' and private.is_workspace_admin(workspace_id))
);
create policy workspace_members_update on public.workspace_members
for update to authenticated
using (
  private.is_workspace_admin(workspace_id)
  and (role <> 'owner' or private.is_workspace_owner(workspace_id))
)
with check (
  private.is_workspace_admin(workspace_id)
  and (role <> 'owner' or (user_id = (select auth.uid())
    and private.is_workspace_owner(workspace_id)))
);
create policy workspace_members_delete on public.workspace_members
for delete to authenticated
using (
  role <> 'owner' and private.is_workspace_admin(workspace_id)
);

create policy spaces_select on public.spaces
for select to authenticated using (private.is_workspace_member(workspace_id));
create policy spaces_insert on public.spaces
for insert to authenticated with check (private.can_edit_workspace(workspace_id));
create policy spaces_update on public.spaces
for update to authenticated using (private.can_edit_workspace(workspace_id))
with check (private.can_edit_workspace(workspace_id));
create policy spaces_delete on public.spaces
for delete to authenticated using (private.can_edit_workspace(workspace_id));

create policy folders_select on public.folders
for select to authenticated using (private.can_access_space(space_id));
create policy folders_insert on public.folders
for insert to authenticated with check (private.can_edit_space(space_id));
create policy folders_update on public.folders
for update to authenticated using (private.can_edit_space(space_id))
with check (private.can_edit_space(space_id));
create policy folders_delete on public.folders
for delete to authenticated using (private.can_edit_space(space_id));

create policy lists_select on public.lists
for select to authenticated using (private.can_access_space(space_id));
create policy lists_insert on public.lists
for insert to authenticated with check (private.can_edit_space(space_id));
create policy lists_update on public.lists
for update to authenticated using (private.can_edit_list(id))
with check (private.can_edit_space(space_id));
create policy lists_delete on public.lists
for delete to authenticated using (private.can_edit_list(id));

create policy tasks_select on public.tasks
for select to authenticated using (private.can_access_list(list_id));
create policy tasks_insert on public.tasks
for insert to authenticated with check (
  private.can_edit_list(list_id) and creator_id = (select auth.uid())
);
create policy tasks_update on public.tasks
for update to authenticated using (private.can_edit_task(id))
with check (private.can_edit_list(list_id));
create policy tasks_delete on public.tasks
for delete to authenticated using (private.can_edit_task(id));

create policy subtasks_select on public.subtasks
for select to authenticated using (private.can_access_task(task_id));
create policy subtasks_insert on public.subtasks
for insert to authenticated with check (
  private.can_edit_task(task_id) and creator_id = (select auth.uid())
);
create policy subtasks_update on public.subtasks
for update to authenticated using (private.can_edit_task(task_id))
with check (private.can_edit_task(task_id));
create policy subtasks_delete on public.subtasks
for delete to authenticated using (private.can_edit_task(task_id));

notify pgrst, 'reload schema';
```

## Appendix B: Exact Transactional RLS Isolation Test

Create `supabase/tests/work_rls.sql` with:

```sql
begin;

insert into public.app_users(id, name, email)
values
  ('00000000-0000-0000-0000-00000000a001', 'RLS User A', 'rls-a@invalid.example'),
  ('00000000-0000-0000-0000-00000000b001', 'RLS User B', 'rls-b@invalid.example');

insert into public.workspaces(id, name, owner)
values
  ('00000000-0000-0000-0000-00000000a010', 'Workspace A', '00000000-0000-0000-0000-00000000a001'),
  ('00000000-0000-0000-0000-00000000b010', 'Workspace B', '00000000-0000-0000-0000-00000000b001');

insert into public.workspace_members(workspace_id, user_id, role)
values
  ('00000000-0000-0000-0000-00000000a010', '00000000-0000-0000-0000-00000000a001', 'owner'),
  ('00000000-0000-0000-0000-00000000b010', '00000000-0000-0000-0000-00000000b001', 'viewer');

insert into public.spaces(id, workspace_id, name)
values
  ('00000000-0000-0000-0000-00000000a020', '00000000-0000-0000-0000-00000000a010', 'Space A'),
  ('00000000-0000-0000-0000-00000000b020', '00000000-0000-0000-0000-00000000b010', 'Space B');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000a001","role":"authenticated"}',
  true
);

do $$
declare
  affected integer;
begin
  if (select count(*) from public.workspaces) <> 1 then
    raise exception 'user A workspace isolation failed';
  end if;

  if exists (
    select 1 from public.spaces
    where id = '00000000-0000-0000-0000-00000000b020'
  ) then
    raise exception 'user A can read user B space';
  end if;

  update public.spaces
  set name = 'Cross-tenant write'
  where id = '00000000-0000-0000-0000-00000000b020';
  get diagnostics affected = row_count;

  if affected <> 0 then
    raise exception 'user A can update user B space';
  end if;
end
$$;

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000b001","role":"authenticated"}',
  true
);

do $$
declare
  affected integer;
begin
  if not exists (
    select 1 from public.spaces
    where id = '00000000-0000-0000-0000-00000000b020'
  ) then
    raise exception 'viewer cannot read their workspace';
  end if;

  update public.spaces
  set name = 'Viewer write'
  where id = '00000000-0000-0000-0000-00000000b020';
  get diagnostics affected = row_count;

  if affected <> 0 then
    raise exception 'viewer can update their workspace';
  end if;
end
$$;

reset role;
rollback;
```
