# Work Management Data Model Stabilization Design

**Date:** 2026-07-22

**Status:** Approved for planning

## Objective

Stabilize the CONEX.HUB Work Management module around one secure, performant data model; preserve the existing project and task; remove the schema mismatch that currently causes `404` responses for `workspaces`, `spaces`, and `lists` and `400` responses for task relationship queries; and make `/work` the canonical module entry point.

## Current State and Confirmed Failure

The frontend contains two Work Management generations:

- `src/pages/projects` and the legacy `projects -> tasks` contract.
- `src/pages/work` and the intended `workspaces -> spaces -> folders -> lists -> tasks -> subtasks` contract.

The active Supabase project is `conex-os` (`arbjhqbcoiuzlidvehtd`). Its remote schema contains only the legacy `projects` and `tasks` tables for Work Management. API logs confirm repeated `404` responses for `workspaces`, `spaces`, and `lists`, plus `400` responses when the client requests `tasks` joined to `lists`. The remote migration history has only one legacy migration, while the repository contains a later, unapplied hierarchy migration sequence.

The production build succeeds because Vite transpiles TypeScript without a full type check. A separate TypeScript check fails because the generated Supabase types still describe the legacy schema while the new Work UI expects the hierarchy schema.

## Scope

This delivery covers:

- A forward-only, data-preserving migration from the legacy Work schema.
- Tenant-aware RLS for all Work tables.
- Query indexes aligned with the navigation and task filters.
- Regenerated Supabase TypeScript types.
- A single frontend query contract for Work Management.
- Canonical navigation through `/work`.
- Error, loading, empty, and retry states for Work data.
- Automated schema, RLS, query, and frontend regression checks.

This delivery does not redesign the CRM, resolve every existing TypeScript error outside the touched Work paths, or change the visual language of the application. Security advisor findings in CRM functions and grants will be handled in a separate hardening delivery unless they directly block Work Management.

## Chosen Architecture

The canonical hierarchy is:

```text
workspace
  -> space (the business project)
      -> folder (optional organization)
          -> list
              -> task
                  -> subtask
```

`space` is the canonical project entity. The application will stop translating `spaces` into the legacy `Project` shape after consumers have moved to the new contract.

The existing tables are retained temporarily as `legacy_projects` and `legacy_tasks`. New canonical tables are created with the names already expected by the new frontend: `workspaces`, `workspace_members`, `spaces`, `folders`, `lists`, `tasks`, and `subtasks`.

## Data Migration

The migration is transactional and forward-only.

1. Rename `projects` to `legacy_projects` and `tasks` to `legacy_tasks`, preserving their rows, constraints, and recovery value.
2. Create the canonical hierarchy tables and their constraints.
3. Create one default workspace per distinct legacy project owner. The owner becomes an `owner` member of that workspace.
4. Migrate each legacy project to a `space`, preserving the legacy project UUID as the space UUID, title as name, description, project status, owner relationship through the workspace, and timestamps.
5. Create one list named `Tarefas` for every migrated space.
6. Migrate each legacy task to the default list for its former project, preserving the task UUID, title, description, status, priority, due date, owner as creator and assignee where applicable, and timestamps. Known legacy spellings are normalized explicitly, including `Media` to `Média`; unrecognized values abort the migration instead of being silently rewritten.
7. Validate that every legacy project and task has exactly one canonical counterpart before the transaction commits.

The legacy tables will not be exposed to `anon` or used by frontend code. They remain available only for controlled recovery until a later cleanup migration is explicitly approved.

## Canonical Table Responsibilities

### `workspaces`

Tenant boundary and top-level container. Stores name, description, icon, color, owner, and timestamps.

### `workspace_members`

Maps authenticated users to workspaces with `owner`, `admin`, `member`, or read-only `viewer` roles. The pair `(workspace_id, user_id)` is unique.

### `spaces`

Represents a business project. Belongs to exactly one workspace and stores name, description, lifecycle status, presentation metadata, position, and timestamps.

### `folders`

Optional grouping inside a space. Belongs to exactly one space.

### `lists`

Task container inside a space and optionally inside a folder. `space_id` is mandatory and `folder_id` is nullable.

### `tasks`

Belongs to exactly one list. Stores task content, status, priority, assignee, creator, due date, tags, position, completion timestamp, and audit timestamps. It does not contain `project_id`; the project is reached through `list -> space`.

### `subtasks`

Belongs to a task and may reference a parent subtask for nesting. Stores assignment, creator, state, priority, due date, position, and timestamps.

## Authorization and RLS

RLS is enabled on every canonical table. `anon` receives no Work table privileges. `authenticated` receives only the table privileges required by the UI; row visibility remains governed by RLS.

Membership checks are implemented as narrowly scoped helper functions in a non-exposed `private` schema. These functions use `SECURITY DEFINER` only where necessary to break RLS recursion, set a fixed empty `search_path`, qualify all referenced objects, verify `auth.uid()` is present, and return only booleans. `EXECUTE` is revoked from `PUBLIC` and granted only to `authenticated` for the exact helper signatures.

Policies follow these rules:

- Workspace owners and members can read their workspace.
- An authenticated user can create a workspace only with themselves as owner.
- Owners and admins can update workspace metadata and membership.
- Only owners can delete a workspace.
- Owners, admins, and members can read and modify spaces, folders, lists, tasks, and subtasks inside their workspace. Viewers can only read them.
- Moving an entity cannot change it into a workspace the user cannot access; update policies include both `USING` and `WITH CHECK`.
- Initial owner membership is allowed only when the workspace owner and inserted member both equal the current authenticated user.

Authorization never depends on user-editable metadata. Policies use `(select auth.uid())` or the protected membership helpers.

## Query and Performance Design

The initial Work page performs one nested workspace-tree query selecting only navigation fields:

- Workspaces visible to the current user.
- Their spaces.
- Folders and lists for those spaces.

Tasks are not included in the tree payload. They are fetched lazily only for the selected list. Task detail and subtasks are fetched only when a task is opened.

TanStack Query becomes the single server-state mechanism for Work data. Query keys include the smallest stable scope, for example `['workspaces']`, `['workspace-tree', workspaceId]`, and `['tasks', listId, filters]`. Mutations invalidate only affected scopes.

The database provides aggregated dashboard values instead of requiring the browser to download every task. Any exposed view must use `security_invoker = true`; an RPC is used only when it can remain `SECURITY INVOKER` and preserve RLS.

Required indexes cover:

- `workspace_members(user_id, workspace_id)` and the unique reverse pair.
- `spaces(workspace_id, position)`.
- `folders(space_id, position)`.
- `lists(space_id, folder_id, position)`.
- `tasks(list_id, position)`.
- `tasks(list_id, status)`.
- `tasks(assignee_id, due_date)`.
- `subtasks(task_id, parent_subtask_id, position)`.

Indexes are validated with Supabase performance advisors after migration. Redundant indexes are not retained merely because they existed in an earlier draft.

## Frontend Boundaries

Work queries and mapping live behind focused data modules rather than being rebuilt in pages. Pages consume typed domain results and do not know PostgREST relationship syntax.

The module switcher navigates to `/work`. Legacy `/projects` routes redirect to their canonical Work equivalents while bookmarks remain valid during the transition. Legacy `src/pages/projects` and `useProjects` are removed only after all reachable consumers use the canonical hierarchy.

The active workspace and selected list are URL- or query-state driven where practical. Stale local-storage project IDs are validated before use and cleared when the referenced entity is unavailable.

## Error Handling

Data hooks preserve the Supabase error code, message, details, and hint for diagnostics while presenting safe Portuguese copy to the user.

Each Work screen has distinct states for loading, empty data, authorization failure, missing resource, and transient query failure. A failed query renders a retry action. Toasts are triggered from effects or mutation handlers, never during render, so one failure creates one notification.

Unexpected errors are captured by an error boundary at the module boundary. Logs include the operation and entity scope but never access tokens, API keys, or private record contents.

## Testing and Verification

Database verification includes:

- A pre-migration assertion that demonstrates the canonical tables are missing.
- Post-migration assertions for tables, columns, foreign keys, indexes, RLS, grants, and policies.
- Row-count and ID-preservation assertions for migrated projects and tasks.
- Transactional RLS tests using two synthetic authenticated identities and rollback, proving cross-workspace reads and writes are denied.
- A task query joined through `lists -> spaces -> workspaces` under an authenticated identity.

Frontend verification includes:

- Unit tests for route selection and Work query mapping.
- Query tests for loading, empty, error, retry, and successful states.
- A regression test proving a Work query failure does not emit repeated toasts on re-render.
- TypeScript checking for all touched Work files.
- Production build and lint checks.
- Browser verification of login, module switching, workspace tree load, project selection, task load, and refresh persistence against the remote Supabase project from the local Vite server.

After DDL changes, both Supabase security and performance advisors are run. Relevant new warnings are fixed before completion or documented with a specific reason when outside this delivery's scope.

## Delivery Sequence

1. Add executable failing schema and RLS checks.
2. Apply and verify the transactional canonical schema migration.
3. Regenerate and commit Supabase TypeScript types.
4. Introduce the canonical Work query layer with tests.
5. Move navigation and reachable screens to `/work`.
6. Remove reachable dependencies on the legacy project contract.
7. Run type, build, lint, advisor, API-log, and browser verification.

## Rollback and Recovery

The migration preserves source rows in `legacy_projects` and `legacy_tasks`. If frontend verification fails, the application can temporarily route back to a compatibility release while the canonical tables are repaired; the legacy records remain intact. A destructive removal of legacy tables is explicitly excluded from this delivery.

No migration is rolled back by editing or deleting an applied migration. Corrections are always new forward migrations.

## Success Criteria

- `/work` loads without `404` or relationship `400` responses.
- The existing legacy project and task are visible in the canonical hierarchy.
- An authenticated user cannot read or mutate another workspace's records.
- The workspace tree is obtained without sequential per-level fetches.
- Tasks are fetched only for the selected list or explicit dashboard aggregation.
- Generated Supabase types contain the canonical Work tables and relationships.
- No reachable Work screen uses `project_id` or the legacy `Project` adapter.
- The local app passes the scoped tests, type check for touched files, production build, and browser smoke flow.
