# CONEX.HUB Modular Redesign Design

## Status

Approved for implementation on the isolated branch `codex/work-management-stabilization`.

## Objective

Modernize the CONEX.HUB interface without losing its visual identity or changing its business rules. The redesign must make CRM and Work Management feel like parts of the same product, fix navigation defects, preserve the CRM conversion funnel, and keep Work Management's List, Table, and Kanban views.

The finished branch must run locally for visual review before any integration with `main`.

## Product constraints

- Keep the current CONEX.HUB blue and green identity.
- Use the Stitch project as a layout, spacing, density, and hierarchy reference, not as a replacement color palette.
- Keep the product switcher inside the existing top modal, following the Monday-style product-switching model.
- Keep module-specific navigation instead of merging every CRM and Work action into one oversized menu.
- Preserve the CRM Dashboard metrics, conversion funnel, monthly chart, proposal table, filters, and business logic.
- Preserve Work Management Overview analytics and the user-selectable List, Table, and Kanban task views.
- Do not add a database migration for visual changes.
- Do not change the stable `main` branch during redesign development.

## Chosen approach

### Foundation-first modular rollout

Build and validate the shared application shell first, then migrate the pages module by module. Each module receives an isolated commit and a verification checkpoint, while all work remains on one redesign branch.

This approach was selected because the main inconsistencies come from duplicated page-level patterns and missing layout contracts. Fixing individual pages first would reproduce those inconsistencies and make later standardization more expensive.

### Alternatives considered

1. **Page-by-page visual patches:** faster for the first screenshot, but leaves duplicated spacing, headers, toolbars, and responsive defects.
2. **Single large visual rewrite:** produces a uniform result in one pass, but has a high regression risk and makes it difficult to review or revert a specific module.
3. **Foundation-first modular rollout — selected:** adds a small initial investment in reusable primitives, then reduces risk and implementation time across all pages.

## Information architecture

### Global product shell

The persistent shell contains:

- A module-specific sidebar.
- A shared 64-pixel application header.
- The CONEX.HUB brand.
- The product-switcher modal trigger.
- Theme and account actions.
- A responsive main-content region.

The shell owns structural sizing and responsive behavior. Pages own only their local content, filters, and actions.

### CRM navigation

1. Dashboard
2. Gerador de Propostas
3. Oportunidades
4. Clientes
5. Configurações

### Work Management navigation

1. Visão geral
2. Minhas tarefas
3. Quadro
4. Workspaces
5. Configurações

The workspace selector and project hierarchy remain contextual elements below the primary Work navigation. They are not promoted to global product navigation.

## Shared visual system

### Layout

- Expanded sidebar: 256 pixels.
- Collapsed sidebar: 64 pixels.
- Application header: 64 pixels.
- Main content maximum width: 1600 pixels.
- Desktop page padding: 32 pixels.
- Tablet page padding: 24 pixels.
- Mobile page padding: 16 pixels.
- Standard section gap: 24 pixels.
- Compact content gap: 12 or 16 pixels.

### Typography

- Page eyebrow: uppercase, compact tracking, blue or muted foreground.
- Page title: 30–32 pixels, semibold or bold.
- Section title: 20–24 pixels, semibold.
- Body and controls: 14 pixels.
- Supporting metadata: 12–13 pixels with muted foreground.

### Surfaces

- Cards use light borders, subtle shadows, and 10–12 pixel radii.
- Interactive controls use consistent 40–42 pixel heights.
- Table rows use a compact but readable 56–64 pixel height.
- Strong color fills are reserved for one primary action or an important KPI, not every card.
- Status colors remain semantic: blue for active/in progress, green for completed/approved, amber for pending/negotiating, and red for overdue/destructive states.

### Shared components

The redesign introduces or consolidates the following visual primitives:

- `PageHeader`: eyebrow, title, description, breadcrumbs, and page actions.
- `PageToolbar`: search, filters, sort, view switcher, and a mobile overflow layout.
- `MetricCard`: label, value, supporting text, icon, trend, and optional accent.
- `ContentCard`: consistent card header, content spacing, empty state, and loading state.
- `DataTableShell`: responsive table container, header density, row actions, and mobile fallback.
- `ViewModeSwitcher`: List, Table, and Kanban modes with accessible labels and persisted user preference where the current feature already supports persistence.
- `EmptyState` and `ErrorState`: consistent guidance and retry actions.
- Shared sidebar navigation item and section styles.

Existing business components remain responsible for data and actions. The shared components standardize presentation and composition.

## Module 1: Shared shell and navigation

### Sidebar width contract

The Work sidebar overflow is caused by the workspace selector trigger consuming the full inner width while the adjacent add button also requires fixed space. The redesign establishes a width contract for every nested sidebar row:

- Containers use `w-full`, `min-w-0`, and clipped overflow where appropriate.
- Flexible labels use `min-w-0` and text truncation.
- The workspace trigger uses zero base width plus flexible growth.
- The add button has a fixed 40-pixel width and cannot shrink.
- Project, folder, and list rows respect the same contract.
- Tooltips expose truncated names.

The fix must work in expanded, collapsed, mobile drawer, and long-name states.

### Navigation behavior

- The active item has one clear blue treatment.
- Section separation relies on spacing and subtle borders rather than repeated heavy cards.
- Collapsed navigation displays icons with tooltips.
- Work hierarchy disappears in collapsed desktop mode and remains reachable through the expanded or mobile experience.
- Sidebar scrolling is independent from the account footer.
- The account footer and settings access use the same interaction pattern in CRM and Work.

### Header behavior

- Branding remains left-aligned in the content shell.
- Product switching stays in the modal.
- Theme and user actions share consistent hit areas and focus states.
- The mobile header exposes the sidebar trigger without duplicating navigation actions.

## Module 2: CRM Dashboard

The Dashboard is a refinement, not a replacement.

### Preserved behavior

- Period, date type, and status filters.
- Total proposals, total value, conversion rate, and approved-this-month KPIs.
- Opportunities by month chart.
- Conversion funnel.
- Recent proposals table and all existing actions.
- Existing query and metric calculations.

### Visual changes

- Add a clear page header and compact filter summary.
- Align KPI cards to the shared metric-card system.
- Keep the primary monthly chart wider than the funnel.
- Keep the funnel visible on desktop and move it below the chart on narrow layouts.
- Give the funnel labels and stage values enough contrast without changing its meaning.
- Standardize table density and action affordances.
- Replace abrupt content shifts with skeletons sized like the final cards and charts.

## Module 3: CRM operational pages

### Clientes

- Use a shared page header and toolbar.
- Present search, filters, sorting, and the primary create action in one responsive control region.
- Preserve existing table columns, CRUD actions, dialogs, and pagination.
- Improve empty and no-result states.

### Oportunidades

- Standardize page framing and filtering.
- Preserve current pipeline data, statuses, actions, and navigation.
- Use semantic status styling consistently with the Dashboard and proposal table.
- Keep dense operational information scannable on smaller screens.

### Gerador de Propostas

- Preserve proposal-generation flow and all business fields.
- Improve step hierarchy, grouping, helper text, validation placement, and action positioning.
- Keep the main creation action visually dominant.
- Avoid changing calculation, persistence, or PDF-generation behavior.

## Module 4: Work Management

### Visão geral

- Restore and retain project and task analytics.
- Use the shared page header, metric cards, content cards, filters, and tables.
- Keep charts legible when the sidebar is expanded or collapsed.

### Minhas tarefas

- Preserve status counts, task filters, search, and actions.
- Keep List and Table presentations available when supported by the current route.
- Use a shared toolbar and consistent task metadata.

### Quadro

- Preserve Kanban drag-and-drop behavior.
- Keep the project filter and status columns.
- Improve card hierarchy, overflow handling, empty columns, and horizontal scrolling.
- Ensure visual redesign does not change task status rules.

### Contextual project views

- Preserve List, Table, and Kanban switching.
- Make the selected mode clear and keyboard accessible.
- Reuse the same task card, row, status, and toolbar primitives across views.
- Keep the current URL and query behavior unless a defect requires a backward-compatible correction.

### Workspaces and hierarchy

- Keep workspace creation inside the existing context.
- Standardize workspace cards, project rows, and settings screens.
- Support long workspace and project names without resizing the sidebar.
- Make destructive actions explicit and visually separated from primary actions.

## Module 5: Settings and finishing

- Align CRM settings and Work workspace settings with the same page header, navigation, card, and form rules.
- Group configuration by purpose rather than by implementation detail.
- Standardize save, cancel, success, warning, and destructive-action feedback.
- Add consistent skeleton, empty, error, and retry states.
- Verify focus visibility, keyboard navigation, color contrast, and touch target sizes.

## Data and state flow

The redesign does not introduce a new data layer. Existing hooks, Supabase clients, query functions, mutations, and route loaders remain the source of truth.

Presentation components receive already-shaped values and callbacks. They must not issue duplicate requests. Shared visual components remain stateless unless they own purely local UI state such as a collapsed section or an open menu.

View selection uses the current persistence mechanism where one exists. If a route currently keeps view mode only in local state, the redesign may preserve that behavior; adding cross-device persistence is outside this scope.

## Loading, error, and empty states

- Loading states use stable skeleton geometry to prevent layout jumps.
- Query failures remain visible within the affected module and offer retry where the existing data layer supports it.
- A partial widget failure must not hide an otherwise usable page.
- Empty states distinguish between no records and no results for the active filters.
- Destructive actions retain confirmation and cannot be triggered through ambiguous icon-only interactions.
- Existing toast and error-reporting behavior remains in place.

## Responsive behavior

### Desktop

- Persistent expanded or collapsed sidebar.
- Multi-column KPI and chart layouts.
- Full table actions.

### Tablet

- Reduced content padding.
- Charts stack when width becomes insufficient.
- Toolbars wrap into logical groups.
- Tables may scroll horizontally without overflowing the application shell.

### Mobile

- Sidebar becomes a drawer.
- Header actions remain reachable with 40-pixel minimum hit areas.
- Filters move into a compact panel or vertical stack.
- Cards and charts become single-column.
- Critical row actions remain accessible through an overflow menu.

## Accessibility

- Every icon-only action has an accessible name and tooltip where useful.
- Active navigation uses both color and structural indication.
- Focus rings remain visible on all interactive elements.
- View switchers expose selected state programmatically.
- Charts keep text summaries or legends sufficient to interpret their values.
- Truncated sidebar labels remain available through title or tooltip text.

## Verification strategy

### Automated

- Unit tests for shared layout and view-switching behavior.
- Regression tests for sidebar long-name overflow and collapsed state.
- Existing CRM and Work tests must continue to pass.
- Type checking, linting, and production build must pass.
- No additional Supabase request may be introduced by purely visual components.

### Browser verification

Validate at minimum:

- CRM Dashboard.
- Clientes.
- Oportunidades.
- Gerador de Propostas.
- Work Visão geral.
- Minhas tarefas.
- Quadro.
- Workspaces.
- CRM and Work settings.

For each representative route, verify expanded sidebar, collapsed sidebar, mobile navigation, loading state where reproducible, empty state where reproducible, and primary actions.

The final review uses the local branch at `http://127.0.0.1:8080` or the next available local port.

## Implementation sequence and commit boundaries

1. Shared shell, sidebar overflow fix, header, and visual primitives.
2. CRM Dashboard refinement with funnel preserved.
3. CRM Clientes, Oportunidades, and Gerador de Propostas.
4. Work Overview, tasks, Board, contextual views, and workspace hierarchy.
5. Settings, responsive polish, accessibility, and full regression verification.

Each boundary must produce a runnable application and a focused commit on `codex/work-management-stabilization`.

## Acceptance criteria

- The sidebar never overlaps page content, including with long workspace and project names.
- CRM and Work share the same shell, spacing, headers, toolbars, cards, tables, and feedback language.
- Product switching remains inside the modal.
- The CRM conversion funnel remains present and functional.
- Work Overview retains analytics.
- Users can still choose List, Table, or Kanban where the current feature supports those views.
- Current business operations and database behavior remain unchanged.
- All required automated checks pass.
- The completed redesign branch is running locally for user review.
