# CONEX.HUB Navigation and Work Management UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore and improve the multi-page Work Management experience with Overview, My Tasks, Board, project/list navigation, and persistent List/Table/Board views over the canonical Supabase hierarchy.

**Architecture:** `MainLayout` remains the shared product shell and the modal remains the product switcher. Work routes use a single canonical React Query data layer; page-level containers derive metrics and filters, then pass one normalized task collection into focused List, Table, or Board renderers. Supabase RLS remains the authorization boundary and no presentation-only database migration is introduced.

**Tech Stack:** React 18, TypeScript, React Router, TanStack React Query, Supabase/PostgREST, shadcn/ui, Tailwind CSS, Recharts, Vitest, React Testing Library, Playwright CLI.

## Global Constraints

- Keep product switching inside the existing top-bar modal.
- Keep `main` untouched; work only in `codex/work-management-stabilization`.
- Use only `workspaces`, `workspace_members`, `spaces`, `folders`, `lists`, and `tasks` for reachable Work routes.
- Do not import `useProjects`, `useTasks`, or use `project_id` in reachable Work code.
- Provide `list`, `table`, and `board` views in My Tasks and project/list task contexts.
- Preserve filters when switching views.
- Use URL `view` first, saved contextual preference second, and `list` as fallback.
- Do not add a Supabase migration for this UI phase.
- Avoid per-list task fan-out for Overview and My Tasks.
- Every task ends with focused tests and a commit.

---

### Task 1: Shared view-mode and task-selector contracts

**Files:**
- Create: `src/features/work/view/workViewMode.ts`
- Create: `src/features/work/view/workViewMode.test.ts`
- Create: `src/features/work/view/workTaskSelectors.ts`
- Create: `src/features/work/view/workTaskSelectors.test.ts`
- Modify: `src/types/hierarchy.ts`

**Interfaces:**
- Produces: `WorkViewMode = 'list' | 'table' | 'board'`
- Produces: `resolveWorkViewMode(search: string, saved: string | null): WorkViewMode`
- Produces: `workViewPreferenceKey(contextType: string, contextId: string): string`
- Produces: `WorkTaskContext` and `WorkTaskItem`
- Produces: `filterWorkTasks(tasks, filters)` and `deriveWorkTaskMetrics(tasks, now)`

- [ ] **Step 1: Write failing view-mode tests**

```ts
describe('resolveWorkViewMode', () => {
  it('prefers a valid URL value', () => {
    expect(resolveWorkViewMode('?view=board', 'table')).toBe('board');
  });

  it('uses a valid saved preference when URL is absent', () => {
    expect(resolveWorkViewMode('', 'table')).toBe('table');
  });

  it('falls back to list for malformed values', () => {
    expect(resolveWorkViewMode('?view=calendar', 'gantt')).toBe('list');
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- src/features/work/view/workViewMode.test.ts`

Expected: FAIL because `workViewMode.ts` does not exist.

- [ ] **Step 3: Implement the view contract**

```ts
export type WorkViewMode = 'list' | 'table' | 'board';

const WORK_VIEW_MODES = new Set<WorkViewMode>(['list', 'table', 'board']);

function isWorkViewMode(value: string | null): value is WorkViewMode {
  return value !== null && WORK_VIEW_MODES.has(value as WorkViewMode);
}

export function resolveWorkViewMode(search: string, saved: string | null): WorkViewMode {
  const fromUrl = new URLSearchParams(search).get('view');
  if (isWorkViewMode(fromUrl)) return fromUrl;
  if (isWorkViewMode(saved)) return saved;
  return 'list';
}

export function workViewPreferenceKey(contextType: string, contextId: string) {
  return `conex.work.view.${contextType}.${contextId}`;
}
```

- [ ] **Step 4: Write failing selector tests**

```ts
it('filters by search, status and project without mutating input', () => {
  const original = [pendingAlpha, completedBeta];
  const result = filterWorkTasks(original, {
    search: 'alpha',
    status: 'Pendente',
    space_id: 'space-a',
  });
  expect(result).toEqual([pendingAlpha]);
  expect(original).toEqual([pendingAlpha, completedBeta]);
});

it('derives overdue metrics against an injected clock', () => {
  expect(deriveWorkTaskMetrics(tasks, new Date('2026-07-22T12:00:00Z'))).toEqual({
    total: 3,
    pending: 1,
    inProgress: 1,
    completed: 1,
    overdue: 1,
  });
});
```

- [ ] **Step 5: Add normalized task context and selectors**

```ts
export interface WorkTaskContext {
  workspace_id: string;
  space_id: string;
  space_name: string;
  list_id: string;
  list_name: string;
}

export interface WorkTaskItem extends HierarchyTask {
  context: WorkTaskContext;
}
```

`filterWorkTasks` must apply search, status, priority, assignee, space, list,
date range, and tags. `deriveWorkTaskMetrics` must count completed tasks by the
exact canonical label `Concluída` and count overdue tasks only when incomplete.

- [ ] **Step 6: Run focused tests**

Run: `npm test -- src/features/work/view/workViewMode.test.ts src/features/work/view/workTaskSelectors.test.ts`

Expected: both files PASS.

- [ ] **Step 7: Commit**

```bash
git add src/types/hierarchy.ts src/features/work/view
git commit -m "feat: define shared work view contracts"
```

---

### Task 2: Canonical workspace and assignee task queries

**Files:**
- Modify: `src/features/work/api/workApi.ts`
- Modify: `src/features/work/api/workMappers.ts`
- Modify: `src/features/work/api/workMappers.test.ts`
- Modify: `src/features/work/api/workQueryKeys.ts`
- Modify: `src/features/work/hooks/useWorkData.ts`
- Modify: `src/features/work/hooks/useWorkData.test.tsx`

**Interfaces:**
- Consumes: `WorkTaskItem`, `TaskFilters`
- Produces: `fetchWorkspaceTasks(workspaceId, filters): Promise<WorkTaskItem[]>`
- Produces: `fetchAssignedTasks(workspaceId, assigneeId, filters): Promise<WorkTaskItem[]>`
- Produces: `useWorkspaceTasksQuery(workspaceId, filters)`
- Produces: `useAssignedTasksQuery(workspaceId, assigneeId, filters)`
- Produces: query keys `workspaceTasks` and `assignedTasks`

- [ ] **Step 1: Write failing API mapping tests**

```ts
it('maps a relational task row into one WorkTaskItem', () => {
  expect(mapWorkTaskRow(taskRow)).toMatchObject({
    id: taskRow.id,
    context: {
      workspace_id: 'workspace-1',
      space_id: 'space-1',
      space_name: 'Website',
      list_id: 'list-1',
      list_name: 'Sprint',
    },
  });
});
```

- [ ] **Step 2: Write failing query-hook tests**

```tsx
it('does not query workspace tasks without a workspace id', () => {
  const { result } = renderHook(() => useWorkspaceTasksQuery(undefined), {
    wrapper,
  });
  expect(result.current.fetchStatus).toBe('idle');
  expect(workApi.fetchWorkspaceTasks).not.toHaveBeenCalled();
});

it('shares one workspace task request between two consumers', async () => {
  renderHook(() => useWorkspaceTasksQuery('workspace-1'), { wrapper });
  renderHook(() => useWorkspaceTasksQuery('workspace-1'), { wrapper });
  await waitFor(() => expect(workApi.fetchWorkspaceTasks).toHaveBeenCalledTimes(1));
});
```

- [ ] **Step 3: Run focused tests and verify failure**

Run: `npm test -- src/features/work/api/workMappers.test.ts src/features/work/hooks/useWorkData.test.tsx`

Expected: FAIL because the new mapper, API functions, keys, and hooks do not exist.

- [ ] **Step 4: Add one relational task selection**

Use one shared field contract:

```ts
const WORK_TASK_FIELDS = `
  id,list_id,title,description,status,priority,due_date,assignee_id,creator_id,
  tags,estimated_hours,actual_hours,position,created_at,updated_at,completed_at,
  assignee:app_users!tasks_assignee_id_fkey(id,name,email),
  creator:app_users!tasks_creator_id_fkey(id,name,email),
  list:lists!inner(
    id,name,space_id,
    space:spaces!inner(id,name,workspace_id)
  )
`;
```

`fetchWorkspaceTasks` must filter
`list.space.workspace_id = workspaceId`. `fetchAssignedTasks` must add
`assignee_id = assigneeId`. Both functions order by `position`, normalize
errors through `normalizeWorkError`, and return `mapWorkTaskRow` results.

- [ ] **Step 5: Add stable query keys and hooks**

```ts
workspaceTasks: (workspaceId: string, filters?: TaskFilters) =>
  ['work', 'tasks', 'workspace', workspaceId, filters ?? {}] as const,
assignedTasks: (workspaceId: string, assigneeId: string, filters?: TaskFilters) =>
  ['work', 'tasks', 'assigned', workspaceId, assigneeId, filters ?? {}] as const,
```

Both hooks use a 30-second stale time, one retry, and `enabled` guards for every
required identifier.

- [ ] **Step 6: Update mutation invalidation**

After task create/update/delete, invalidate the exact list collection and the
workspace/assignee task prefixes affected by that task. Do not invalidate the
entire `['work']` tree.

- [ ] **Step 7: Run focused and scoped checks**

Run: `npm test -- src/features/work/api/workMappers.test.ts src/features/work/hooks/useWorkData.test.tsx`

Run: `npm run typecheck:work`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/features/work/api src/features/work/hooks src/types/hierarchy.ts
git commit -m "feat: query work tasks at workspace grain"
```

---

### Task 3: Distinct Work routes and clarified sidebar

**Files:**
- Modify: `src/features/work/navigation/workRoutes.ts`
- Modify: `src/features/work/navigation/workRoutes.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/NavigationSidebar.tsx`
- Modify: `src/components/MainLayout.tsx`
- Modify: `src/components/AppSwitcher.tsx`
- Create: `src/components/NavigationSidebar.test.tsx`
- Create: `src/features/work/context/WorkContext.tsx`
- Create: `src/features/work/context/WorkContext.test.tsx`

**Interfaces:**
- Produces: `WORK_HOME`, `WORK_TASKS`, `WORK_BOARD`, `WORK_WORKSPACES`
- Produces: `useWorkContext(): { selectedWorkspaceId?: string; setSelectedWorkspaceId(id?: string): void }`
- Consumes: existing `AppModuleContext` and product-switcher modal
- Guarantees: primary Work links have distinct routes and the modal behavior is unchanged

- [ ] **Step 1: Extend route tests**

```ts
expect(WORK_HOME).toBe('/work');
expect(WORK_TASKS).toBe('/work/tasks');
expect(WORK_BOARD).toBe('/work/board');
expect(WORK_WORKSPACES).toBe('/work/workspaces');
expect(legacyWorkRedirect('/projects/tasks')).toBe(WORK_TASKS);
expect(legacyWorkRedirect('/projects/board')).toBe(WORK_BOARD);
```

- [ ] **Step 2: Add a failing sidebar test**

```tsx
it('renders distinct Work destinations and keeps hierarchy below the separator', () => {
  render(<NavigationSidebar isCollapsed={false} onToggleCollapse={vi.fn()} />);
  expect(screen.getByRole('link', { name: 'Visão geral' })).toHaveAttribute('href', '/work');
  expect(screen.getByRole('link', { name: 'Minhas tarefas' })).toHaveAttribute('href', '/work/tasks');
  expect(screen.getByRole('link', { name: 'Quadro' })).toHaveAttribute('href', '/work/board');
  expect(screen.getByText('Projetos')).toBeInTheDocument();
});
```

- [ ] **Step 3: Run tests and verify failure**

Run: `npm test -- src/features/work/navigation/workRoutes.test.ts src/components/NavigationSidebar.test.tsx`

Expected: FAIL because routes still collapse to `/work` and sidebar buttons are not links.

- [ ] **Step 4: Add shared selected-workspace context**

Write the context test first:

```tsx
it('shares and persists the selected workspace', () => {
  const { result } = renderHook(() => useWorkContext(), { wrapper });
  act(() => result.current.setSelectedWorkspaceId('workspace-1'));
  expect(result.current.selectedWorkspaceId).toBe('workspace-1');
  expect(localStorage.getItem('conex.work.workspace')).toBe('workspace-1');
});
```

`WorkContextProvider` owns only the selected workspace identifier and its
namespaced browser preference. It does not query Supabase. Wrap authenticated
routes inside the provider so the sidebar and every Work page use the same
selection.

- [ ] **Step 5: Implement canonical route constants and redirects**

Add lazy or direct route entries for Overview, My Tasks, and Board. Preserve
`/projects/*` compatibility redirects but map each old route to its matching
new destination.

- [ ] **Step 6: Refactor sidebar information hierarchy**

Use the approved order:

```ts
const NAV_WORK = [
  { id: 'work-overview', label: 'Visão geral', icon: LayoutDashboard, path: WORK_HOME },
  { id: 'work-tasks', label: 'Minhas tarefas', icon: ClipboardList, path: WORK_TASKS },
  { id: 'work-board', label: 'Quadro', icon: Kanban, path: WORK_BOARD },
  { id: 'workspaces', label: 'Workspaces', icon: FolderOpen, path: WORK_WORKSPACES },
  { id: 'settings', label: 'Configurações', icon: Settings, path: '/settings' },
];
```

Primary navigation stays above the workspace selector. The project tree remains
below a labeled separator. Use semantic links with `aria-current="page"`.
Replace the sidebar's private `selectedWorkspaceId` state with `useWorkContext`.

- [ ] **Step 7: Preserve and polish the product modal**

Do not move product cards into the sidebar. Keep the top-bar trigger and modal,
but make the active product obvious and keep a disabled extension card for
future products.

- [ ] **Step 8: Run tests and commit**

Run: `npm test -- src/features/work/navigation/workRoutes.test.ts src/components/NavigationSidebar.test.tsx src/features/work/context/WorkContext.test.tsx`

Run: `npm run typecheck:work`

Expected: PASS.

```bash
git add src/App.tsx src/components/NavigationSidebar.tsx src/components/MainLayout.tsx src/components/AppSwitcher.tsx src/features/work/navigation src/features/work/context
git commit -m "feat: clarify work navigation and routes"
```

---

### Task 4: Shared Work page and task-view components

**Files:**
- Create: `src/features/work/components/WorkPageHeader.tsx`
- Create: `src/features/work/components/WorkViewSwitcher.tsx`
- Create: `src/features/work/components/WorkTaskFilters.tsx`
- Create: `src/features/work/components/TaskListView.tsx`
- Create: `src/features/work/components/TaskTableView.tsx`
- Create: `src/features/work/components/TaskBoardView.tsx`
- Create: `src/features/work/components/WorkStates.tsx`
- Create: `src/features/work/components/WorkViews.test.tsx`
- Create: `src/features/work/hooks/useWorkViewMode.ts`
- Create: `src/features/work/hooks/useWorkViewMode.test.tsx`

**Interfaces:**
- Consumes: `WorkTaskItem[]`, `TaskFilters`, `WorkViewMode`
- Produces: `WorkViewSwitcher({ value, onChange })`
- Produces: `TaskListView`, `TaskTableView`, and `TaskBoardView`
- Produces: `useWorkViewMode(contextType, contextId)`

- [ ] **Step 1: Write failing persistence tests**

```tsx
it('updates the URL and contextual preference together', async () => {
  const { result } = renderHook(() => useWorkViewMode('workspace', 'w1'), { wrapper });
  act(() => result.current.setView('board'));
  expect(result.current.view).toBe('board');
  expect(localStorage.getItem('conex.work.view.workspace.w1')).toBe('board');
  expect(window.location.search).toContain('view=board');
});
```

- [ ] **Step 2: Write failing shared-view tests**

Render the same two tasks through each view and assert:

```tsx
expect(screen.getAllByText('Prepare proposal')).not.toHaveLength(0);
expect(screen.getByText('Urgente')).toBeInTheDocument();
expect(screen.getByText('Website')).toBeInTheDocument();
```

The Board test must also verify an explicit keyboard-accessible status menu,
not only drag-and-drop.

- [ ] **Step 3: Run tests and verify failure**

Run: `npm test -- src/features/work/components/WorkViews.test.tsx src/features/work/hooks/useWorkViewMode.test.tsx`

Expected: FAIL because shared components do not exist.

- [ ] **Step 4: Implement the view-mode hook**

Read URL and localStorage only through `resolveWorkViewMode`. `setView` updates
the `view` search parameter without dropping unrelated filters and writes the
contextual preference key.

- [ ] **Step 5: Implement focused view renderers**

- List groups compact task rows by status.
- Table uses sortable semantic columns and horizontal overflow.
- Board uses status columns with 280 px minimum width, pointer movement, and an
  accessible status-change menu.

No renderer performs a query.

- [ ] **Step 6: Implement shared states and filters**

`WorkLoadingState` uses shape-compatible skeletons. `WorkEmptyState` accepts
title, description, and optional action. `WorkErrorState` accepts a retry
callback. `WorkTaskFilters` controls search, status, priority, project, and due
date through one `TaskFilters` value.

- [ ] **Step 7: Run tests and commit**

Run: `npm test -- src/features/work/components/WorkViews.test.tsx src/features/work/hooks/useWorkViewMode.test.tsx`

Run: `npm run typecheck:work`

Expected: PASS.

```bash
git add src/features/work/components src/features/work/hooks/useWorkViewMode.ts src/features/work/hooks/useWorkViewMode.test.tsx
git commit -m "feat: add reusable work task views"
```

---

### Task 5: Restore the analytical Work Overview

**Files:**
- Create: `src/pages/work/WorkOverview.tsx`
- Create: `src/pages/work/WorkOverview.test.tsx`
- Create: `src/features/work/components/WorkOverviewCharts.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/work/WorkManagement.tsx`

**Interfaces:**
- Consumes: `useWorkspaceTreeQuery`, `useWorkspaceTasksQuery`
- Consumes: `deriveWorkTaskMetrics`
- Produces: the `/work` analytical page

- [ ] **Step 1: Write failing Overview tests**

```tsx
it('renders project and task metrics from canonical data', async () => {
  renderOverview();
  expect(await screen.findByText('Visão geral')).toBeInTheDocument();
  expect(screen.getByText('Total de projetos')).toBeInTheDocument();
  expect(screen.getByText('Tarefas pendentes')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Projetos' })).toBeInTheDocument();
});

it('shows a useful empty chart state instead of zero axes', async () => {
  renderOverview({ tasks: [] });
  expect(await screen.findByText('Ainda não há tarefas para analisar')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- src/pages/work/WorkOverview.test.tsx`

Expected: FAIL because `WorkOverview` does not exist.

- [ ] **Step 3: Implement page state and metric cards**

Use the selected workspace tree for project counts and one workspace task query
for task metrics. Keep the previous information sequence: four metric cards,
project/task charts, productivity, activity summary, filters, and project
table.

- [ ] **Step 4: Implement responsive charts**

Use the existing Recharts dependency. Stack charts below `lg`, provide labels
and legends, and replace empty chart axes with `WorkEmptyState`.

- [ ] **Step 5: Add searchable project table**

Rows use canonical `SpaceTree` values and derive completed/total counts from the
single workspace task collection. Row actions navigate to
`/work/project/:spaceId`.

- [ ] **Step 6: Route `/work` to Overview and retire generic landing behavior**

`WorkManagement.tsx` may become a compatibility re-export of `WorkOverview` or
be removed from reachable routes. It must not remain a second task navigation
surface.

- [ ] **Step 7: Run tests and commit**

Run: `npm test -- src/pages/work/WorkOverview.test.tsx`

Run: `npm run typecheck:work`

Expected: PASS.

```bash
git add src/App.tsx src/pages/work/WorkOverview.tsx src/pages/work/WorkOverview.test.tsx src/pages/work/WorkManagement.tsx src/features/work/components/WorkOverviewCharts.tsx
git commit -m "feat: restore work overview analytics"
```

---

### Task 6: Restore My Tasks with persistent views

**Files:**
- Create: `src/pages/work/WorkTasks.tsx`
- Create: `src/pages/work/WorkTasks.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useAssignedTasksQuery(workspaceId, userId, filters)`
- Consumes: `useWorkViewMode('assigned', userId)`
- Consumes: shared filters and task views
- Produces: `/work/tasks`

- [ ] **Step 1: Write failing page tests**

```tsx
it('loads assigned tasks once and preserves filters across views', async () => {
  renderWorkTasks();
  await user.type(screen.getByRole('searchbox'), 'proposal');
  await user.click(screen.getByRole('button', { name: 'Tabela' }));
  expect(screen.getByRole('searchbox')).toHaveValue('proposal');
  expect(screen.getByRole('columnheader', { name: 'Tarefa' })).toBeInTheDocument();
});

it('renders pending, in-progress, completed and overdue metrics', async () => {
  renderWorkTasks();
  expect(await screen.findByText('Atrasadas')).toBeInTheDocument();
  expect(screen.getByText('Pendentes')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- src/pages/work/WorkTasks.test.tsx`

Expected: FAIL because the page does not exist.

- [ ] **Step 3: Implement the My Tasks container**

Resolve selected workspace from shared workspace state and current Supabase user
ID. Query assigned tasks once, derive metrics with an injected current clock,
filter above the renderers, and pass the same result to the active view.

- [ ] **Step 4: Implement action boundaries**

Show “Nova tarefa” only when a destination list is known. Status changes use the
canonical task mutation and preserve current filters/view. Destructive actions
require confirmation.

- [ ] **Step 5: Add loading, empty, filtered-empty, and error states**

An empty assigned collection explains that tasks appear when assigned. A
filtered-empty state offers a clear-filter action. Errors expose one retry
button and no database details.

- [ ] **Step 6: Run tests and commit**

Run: `npm test -- src/pages/work/WorkTasks.test.tsx`

Run: `npm run typecheck:work`

Expected: PASS.

```bash
git add src/App.tsx src/pages/work/WorkTasks.tsx src/pages/work/WorkTasks.test.tsx
git commit -m "feat: restore my tasks work views"
```

---

### Task 7: Restore Board and connect project/list contexts

**Files:**
- Create: `src/pages/work/WorkBoard.tsx`
- Create: `src/pages/work/WorkBoard.test.tsx`
- Modify: `src/pages/work/ProjectDetails.tsx`
- Modify: `src/pages/work/ListDetails.tsx`
- Create: `src/pages/work/WorkContextViews.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useWorkspaceTasksQuery`, `useListTasksQuery`
- Consumes: `TaskBoardView`, `TaskListView`, `TaskTableView`
- Produces: `/work/board`, project view switching, and list view switching

- [ ] **Step 1: Write failing Board tests**

```tsx
it('filters the cross-project board without issuing one request per list', async () => {
  renderWorkBoard();
  await user.selectOptions(screen.getByLabelText('Projeto'), 'space-a');
  expect(screen.getByText('Task A')).toBeInTheDocument();
  expect(screen.queryByText('Task B')).not.toBeInTheDocument();
  expect(workApi.fetchWorkspaceTasks).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Write failing context-view tests**

```tsx
it.each(['list', 'table', 'board'] as const)(
  'renders the selected %s list view from one query',
  async (view) => {
    renderListDetails(`?view=${view}`);
    expect(await screen.findByTestId(`work-${view}-view`)).toBeInTheDocument();
    expect(workApi.fetchTasksByList).toHaveBeenCalledTimes(1);
  },
);
```

- [ ] **Step 3: Run tests and verify failure**

Run: `npm test -- src/pages/work/WorkBoard.test.tsx src/pages/work/WorkContextViews.test.tsx`

Expected: FAIL because Board and context view switching are absent.

- [ ] **Step 4: Implement the workspace Board**

Use one workspace task query, project filter, shared Board renderer, and
canonical status mutation. Keep Pending, In Progress, and Completed labels and
semantic colors.

- [ ] **Step 5: Refactor ProjectDetails**

Add breadcrumb, project status/progress, child-list navigation, and a view
switcher for aggregated project tasks. Do not import `ProjectDetails_old.tsx`.

- [ ] **Step 6: Refactor ListDetails**

Use `useListTasksQuery` once, own filters above the view renderer, and render
List, Table, or Board based on `useWorkViewMode('list', listId)`.

- [ ] **Step 7: Run tests and commit**

Run: `npm test -- src/pages/work/WorkBoard.test.tsx src/pages/work/WorkContextViews.test.tsx`

Run: `npm run typecheck:work`

Expected: PASS.

```bash
git add src/App.tsx src/pages/work/WorkBoard.tsx src/pages/work/WorkBoard.test.tsx src/pages/work/ProjectDetails.tsx src/pages/work/ListDetails.tsx src/pages/work/WorkContextViews.test.tsx
git commit -m "feat: restore board and contextual work views"
```

---

### Task 8: Remove reachable legacy paths and verify the complete experience

**Files:**
- Modify: `src/pages/work/WorkManagement.test.tsx`
- Modify: `src/features/work/navigation/workRoutes.test.ts`
- Modify: `tsconfig.work.json`
- Review only: `src/pages/projects/*`
- Review only: `src/hooks/useProjects.ts`
- Review only: `src/hooks/useTasks.ts`

**Interfaces:**
- Guarantees: no reachable Work route imports legacy project/task hooks
- Guarantees: desktop/mobile navigation and Supabase requests pass local browser verification

- [ ] **Step 1: Add a static legacy-import guard test**

```ts
it('keeps reachable Work files off legacy hooks and project_id', () => {
  for (const source of reachableWorkSources) {
    expect(source).not.toMatch(/useProjects|useTasks|project_id/);
  }
});
```

The source list must include every file imported by canonical Work routes, not
the intentionally retained unreachable legacy archive.

- [ ] **Step 2: Run all Work tests**

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 3: Run scoped typecheck and production build**

Run: `npm run typecheck:work`

Expected: exit 0.

Run: `npm run build`

Expected: exit 0; existing unrelated CSS import and bundle-size warnings may
remain, but no new compile error is accepted.

- [ ] **Step 4: Run targeted lint**

Run:

```powershell
npx eslint src/features/work src/pages/work/WorkOverview.tsx src/pages/work/WorkTasks.tsx src/pages/work/WorkBoard.tsx src/components/NavigationSidebar.tsx src/components/AppSwitcher.tsx
```

Expected: no new errors in files created or materially changed by this plan.
Existing repository-wide legacy lint debt is recorded separately.

- [ ] **Step 5: Verify local desktop flows**

Use Playwright CLI against `http://127.0.0.1:8080`:

1. Open the product modal and confirm Work Management remains a product card.
2. Navigate Overview, My Tasks, Board, Workspaces, a project, and a list.
3. Switch List -> Table -> Board and confirm search/filter state persists.
4. Collapse and expand the sidebar.
5. Confirm charts, empty states, retry states, and active navigation.

Expected: no uncaught browser error and no layout clipping.

- [ ] **Step 6: Verify mobile flows**

Set a mobile viewport, open the navigation drawer, select a route, and confirm
the drawer closes. Verify List/Table/Board controls remain usable and tables
scroll horizontally.

- [ ] **Step 7: Review Supabase diagnostics**

Inspect recent API logs for the browser verification window. Expected:

- no new Work 400 or 404 response;
- no per-list request fan-out for Overview/My Tasks;
- canonical workspaces, spaces/lists, and tasks requests succeed under RLS.

Run security and performance advisors again. Record unrelated pre-existing
warnings without broadening this UI task.

- [ ] **Step 8: Check branch integrity and commit**

Run:

```bash
git diff --check
git status --short
git log --oneline main..HEAD
```

Stage only intended implementation files. Do not stage line-ending-only changes
in `ProjectDetails_old.tsx`.

```bash
git commit -m "test: verify restored work management experience"
```

- [ ] **Step 9: Keep the local server running**

Confirm the branch Vite server remains reachable at
`http://127.0.0.1:8080` so the project owner can review before any merge.
