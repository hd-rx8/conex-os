# CONEX.HUB Navigation and Work Management UI Design

Status: Approved for implementation planning
Owner: CONEX.HUB
Last updated: 2026-07-22

## 1. Summary

CONEX.HUB will keep its current product-switcher modal and restore the Work
Management experience as a set of distinct, task-oriented pages. The redesign
preserves the stabilized Supabase hierarchy and cached canonical queries while
recovering the analytical dashboard, My Tasks page, Kanban board, workspace
management, and contextual project navigation shown in the previous interface.

The selected direction is a controlled evolution: retain the recognizable
CONEX.HUB layout and the useful parts of the former Work UI, then improve
navigation clarity, information density, responsive behavior, interaction
states, accessibility, and consistency. Monday and ClickUp are interaction
references, not visual templates to copy.

## 2. Goals and Non-goals

### Goals

- Make the active product and current location immediately understandable.
- Keep the product switcher inside a modal that can accommodate future
  CONEX.HUB products.
- Restore separate Work pages for overview, assigned work, board, workspaces,
  projects, and lists.
- Support List, Table, and Board task views without changing the underlying
  task context or filters.
- Preserve the canonical `workspace -> space -> folder -> list -> task`
  hierarchy, RLS policies, cached queries, and database performance work.
- Share cached data across Work pages and avoid N+1 task queries.
- Define reusable navigation, page-header, filter, status, empty-state, and
  error-state patterns that can also improve the CRM.
- Keep the stable `main` branch untouched until the isolated branch has passed
  automated and browser verification.

### Non-goals

- Reintroducing the legacy `projects` or `legacy_tasks` data paths.
- Copying Monday or ClickUp branding, layout, or proprietary UI.
- Rebuilding the entire CRM feature set during this Work-focused iteration.
- Adding a new Supabase migration solely for the visual redesign.
- Adding calendar, Gantt, timeline, automation, or document views in this
  iteration.
- Implementing real-time collaboration before the navigation and core views
  are stable.

## 3. Navigation Architecture

### 3.1 Product shell

`MainLayout` remains the shared application shell. It owns the responsive
sidebar, top bar, product switcher, theme control, user menu, and page content
area. Product pages provide only their content and contextual actions.

The top-bar product switcher remains a modal. It shows the currently available
products as cards and leaves a clear extension point for future products.
Switching products changes both the active module and its home route.

### 3.2 Sidebar hierarchy

The sidebar shows only the navigation for the active product.

For Work Management, the primary navigation is:

1. Overview
2. My Tasks
3. Board
4. Workspaces
5. Settings

The operational context appears below a separator:

1. Workspace selector
2. Project tree
3. Expandable folders
4. Expandable lists
5. Contextual create actions

The current route, selected project, and selected list must have distinct active
states. Primary navigation and hierarchy navigation cannot visually compete.
The sidebar is 256 px expanded and 64 px collapsed on desktop. Mobile uses a
drawer with the same information order.

### 3.3 Routes

| Purpose | Canonical route |
| --- | --- |
| Work overview | `/work` |
| My Tasks | `/work/tasks` |
| Workspace board | `/work/board` |
| Workspace management | `/work/workspaces` |
| Project context | `/work/project/:spaceId` |
| List context | `/work/list/:listId` |

The project and list routes accept `view=list`, `view=table`, or `view=board`.
My Tasks and the workspace board use the same view vocabulary. Existing
`/projects/*` routes remain compatibility redirects and never render legacy
components.

## 4. Page Design

### 4.1 Overview

The Work overview restores the former analytical structure:

- Total projects
- Active projects
- Pending tasks
- Completed projects
- Project-status chart
- Task-status chart
- Productivity by project
- Activity summary
- Searchable and sortable project table

Charts use the existing charting dependency and receive explicit loading,
empty, populated, and error states. On narrow screens, charts stack and retain
readable labels. Empty charts show an explanation instead of misleading zero
axes.

### 4.2 My Tasks

My Tasks shows work assigned to the current user across the selected workspace.
It includes:

- Pending, in-progress, completed, and overdue counts
- Search
- Status, priority, project, and due-date filters
- List, Table, and Board view switcher
- Task detail interaction
- Contextual create-task action when a destination list is known

Filters remain active when changing views.

### 4.3 Workspace Board

The workspace Board is a cross-project Kanban with a project filter. The
initial columns are Pending, In Progress, and Completed. Moving a task changes
only its status and updates the relevant React Query caches. Cards display the
minimum useful metadata: title, project/list, priority, assignee, and due date.

### 4.4 Project and list contexts

Project pages use a breadcrumb and show the project's description, status,
progress, and child lists. Selecting a list opens its task context. Both project
and list task contexts support List, Table, and Board views.

The view switcher does not fetch a separate representation of the same data.
All three views receive the same normalized task collection and filter state.

### 4.5 Workspaces

Workspace administration remains separate from daily task work. It handles
workspace metadata and membership with explicit permissions and confirmation
for destructive actions.

## 5. View System

`WorkViewMode` is a shared union: `list | table | board`.

Resolution order:

1. Valid `view` query parameter
2. Saved preference for the current context
3. `list` default

The saved preference uses a namespaced browser key scoped by context:
`conex.work.view.<context-type>.<context-id>`. A malformed or unsupported value
falls back safely to `list`.

View responsibilities:

- List: compact task cards grouped by status.
- Table: sortable columns for title, status, priority, assignee, due date,
  project, and list.
- Board: status columns with accessible move controls in addition to pointer
  interaction.

Search and filters are owned above the view renderer. Switching view therefore
does not reset them.

## 6. Design System Standards

### 6.1 Layout and spacing

- Shared 4 px spacing base with 8, 12, 16, 24, and 32 px steps.
- Top bar: 64 px.
- Desktop sidebar: 256 px expanded, 64 px collapsed.
- Page content: fluid with a 1600 px maximum for analytical layouts.
- Standard content card radius: 10-12 px.
- Compact controls and navigation rows: 36-40 px.
- Table rows: at least 44 px.
- Kanban columns: at least 280 px and normally 320 px.

### 6.2 Visual hierarchy

- One page title and one concise supporting description per route.
- Contextual actions align with the page title.
- Primary actions use the brand primary color.
- Status colors are semantic and never the sole status indicator.
- Blue and green preserve CONEX.HUB identity; decorative gradients are limited
  to brand moments rather than routine controls.
- Borders and neutral surfaces separate hierarchy without excessive card
  nesting.

### 6.3 Reusable patterns

- `ProductSwitcher`
- `ModuleSidebar`
- `WorkspaceTree`
- `WorkPageHeader`
- `WorkViewSwitcher`
- `WorkFilters`
- `MetricCard`
- `TaskListView`
- `TaskTableView`
- `TaskBoardView`
- `WorkLoadingState`
- `WorkEmptyState`
- `WorkErrorState`

These components expose data and event contracts and do not perform unrelated
queries internally.

### 6.4 Accessibility and responsiveness

- Visible keyboard focus for every interactive element.
- Semantic navigation landmarks and accurate `aria-current`.
- Tooltips for collapsed navigation icons.
- Text or icon labels in addition to status color.
- Keyboard-accessible alternatives for Kanban status changes.
- Mobile drawers close after route selection.
- Tables allow horizontal scrolling without clipping critical actions.
- List and Board views adapt to narrow screens without fixed viewport widths.

## 7. Data Architecture

The UI uses only the canonical Supabase tables protected by RLS:
`workspaces`, `workspace_members`, `spaces`, `folders`, `lists`, and `tasks`.

Existing cached queries remain responsible for workspace and tree data. The
task layer is extended with canonical, bounded query functions for:

- Tasks in one list
- Tasks in one workspace
- Tasks assigned to the current application user

Workspace and assigned-task queries use relational filters from `tasks` through
`lists` and `spaces`, selecting only fields required by the UI. They must not
load every list separately.

React Query keys are scoped by workspace, list, assignment, and normalized
filters. Task mutations invalidate only affected task collections and summary
metrics. View changes never invalidate data because they are presentation
changes.

## 8. Request and Interaction Flow

1. The route identifies the product, page context, and optional view mode.
2. `MainLayout` activates the correct product without changing the requested
   route.
3. The sidebar loads the workspace collection and selected workspace tree from
   the shared cache.
4. The page issues one canonical task query at the appropriate context grain.
5. Search, filters, grouping, and view mode derive a presentation collection.
6. A status or task mutation writes through the canonical API.
7. The mutation invalidates the narrowest affected query keys.
8. The UI shows success or a recoverable error and retains the user's current
   context.

## 9. Failure and Empty States

- Workspace loading uses sidebar and page skeletons.
- A missing workspace shows a create-workspace call to action.
- A workspace with no projects shows a create-project call to action.
- A project with no lists explains that a list is required before creating
  tasks.
- An empty filtered result offers a clear-filter action.
- Query errors show a stable message and retry control.
- Mutation errors keep modal or inline form state so user input is not lost.
- Error messages shown to users do not expose database internals.
- Logging retains normalized error codes for diagnosis.

## 10. Security and Performance

- No service-role credential is used by the browser.
- RLS remains the authorization boundary.
- The redesign introduces no permissive policy or database migration.
- Workspace and task IDs always come from the authenticated user's visible
  hierarchy.
- Destructive actions require explicit confirmation and permission checks.
- Task collections select only visible fields and use indexed workspace,
  list, assignee, status, and due-date paths.
- The application avoids per-list task requests for dashboards and My Tasks.
- React Query stale times and narrow invalidation prevent repeated navigation
  fetches.
- Large task sets can later add pagination or virtualization without changing
  the page contracts.

## 11. Testing and Verification

Automated checks:

- Route and legacy redirect tests
- Sidebar active-state and module-switch tests
- View-mode resolution and persistence tests
- Filter preservation across views
- List, Table, and Board rendering from the same collection
- Workspace-level and assignee-level query contract tests
- Narrow cache invalidation tests
- Dashboard metric derivation tests
- Loading, empty, error, and retry states
- Guard test preventing imports of legacy project/task hooks in reachable Work
  routes
- Scoped TypeScript, unit tests, and production build

Browser checks:

- Desktop expanded and collapsed sidebar
- Mobile navigation drawer
- Product-switcher modal behavior
- Overview charts and project table
- My Tasks view switching
- Kanban status movement and keyboard fallback
- Project tree navigation and active states
- No new 400/404 responses or unexpected duplicate Work queries

## 12. Alternatives Considered

### Exact restoration

This would minimize visual change but would also restore legacy query hooks,
debug behavior, duplicated state, and route ambiguity. It was rejected because
it would compromise the database stabilization.

### Single canonical hierarchy screen

This is the current branch implementation. It is technically coherent but
collapses overview, assigned work, and board into one destination, making the
menu misleading and removing useful analytical views. It was rejected as the
final user experience.

### Full redesign

A new information architecture could provide more freedom but would increase
scope, regress familiar workflows, and make verification harder. It was
rejected in favor of controlled evolution.

## 13. Rollout

1. Implement the shared view contracts and route structure in the isolated
   `codex/work-management-stabilization` worktree.
2. Extend the canonical task query layer with tests.
3. Rebuild the sidebar navigation and restore Overview, My Tasks, and Board.
4. Connect project/list contexts to the shared view system.
5. Run automated checks and browser verification against the local server.
6. Review the isolated branch before any merge or deployment.

The stable `main` branch remains untouched throughout this work.
