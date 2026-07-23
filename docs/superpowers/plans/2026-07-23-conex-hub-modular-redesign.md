# CONEX.HUB Modular Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a modern, consistent CRM and Work Management interface on `codex/work-management-stabilization`, preserve all business behavior, and run the completed branch locally for review.

**Architecture:** Introduce a small set of stateless layout primitives, make `MainLayout` and `NavigationSidebar` the only owners of application-shell geometry, and migrate modules in focused commits. Existing hooks, Supabase requests, mutations, routes, metrics, funnel calculations, and task view persistence remain unchanged.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/Radix UI, Recharts, React Router, Vitest, Testing Library.

## Global Constraints

- Work only on `codex/work-management-stabilization`; do not modify `main`.
- Keep the current CONEX.HUB blue and green palette.
- Use Stitch for spacing, density, hierarchy, and layout only.
- Keep product switching inside the current modal.
- Preserve the CRM funnel, metrics, chart, filters, proposal actions, and data queries.
- Preserve Work Overview charts and List, Table, and Kanban modes.
- Do not add or execute a database migration.
- Do not add a second request path for data already supplied by a page hook.
- Keep each module runnable and commit it independently.

---

### Task 1: Shared layout primitives and visual foundation

**Files:**
- Create: `src/components/layout/PageHeader.tsx`
- Create: `src/components/layout/PageToolbar.tsx`
- Create: `src/components/layout/MetricCard.tsx`
- Create: `src/components/layout/ContentCard.tsx`
- Create: `src/components/layout/LayoutPrimitives.test.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Produces: `PageHeader({ eyebrow?, title, description?, actions?, breadcrumbs? })`
- Produces: `PageToolbar({ children, className? })`
- Produces: `MetricCard({ label, value, detail?, icon?, tone?, loading? })`
- Produces: `ContentCard({ title?, description?, action?, children, className?, contentClassName? })`
- Consumes: existing `Card`, `Skeleton`, `cn`, and semantic Tailwind tokens.

- [ ] **Step 1: Write the failing primitive tests**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Activity } from 'lucide-react';
import { ContentCard } from './ContentCard';
import { MetricCard } from './MetricCard';
import { PageHeader } from './PageHeader';
import { PageToolbar } from './PageToolbar';

describe('layout primitives', () => {
  it('renders page hierarchy and actions', () => {
    render(
      <PageHeader
        eyebrow="CRM"
        title="Dashboard"
        description="Visão comercial"
        actions={<button>Novo</button>}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('CRM')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Novo' })).toBeInTheDocument();
  });

  it('renders metric, toolbar and content surfaces', () => {
    render(
      <>
        <PageToolbar><label>Buscar<input /></label></PageToolbar>
        <MetricCard label="Propostas" value="12" detail="no período" icon={Activity} />
        <ContentCard title="Recentes"><p>Conteúdo</p></ContentCard>
      </>,
    );
    expect(screen.getByText('Propostas')).toBeInTheDocument();
    expect(screen.getByText('Recentes')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the primitive test and verify the missing-module failure**

Run: `npx vitest run src/components/layout/LayoutPrimitives.test.tsx`

Expected: FAIL because the four layout modules do not exist.

- [ ] **Step 3: Implement the primitives**

Use these exact contracts:

```tsx
// PageHeader root
<header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
  <div className="min-w-0 space-y-1.5">
    {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>}
    <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
    {description && <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>}
  </div>
  {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
</header>

// PageToolbar root
<section className={cn("flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm sm:p-4 lg:flex-row lg:items-center", className)}>
  {children}
</section>

// MetricCard root
<Card className={cn("overflow-hidden shadow-sm transition-shadow hover:shadow-md", toneClasses[tone])}>
  <CardContent className="flex min-h-28 items-start justify-between gap-4 p-5">...</CardContent>
</Card>

// ContentCard root
<Card className={cn("overflow-hidden shadow-sm", className)}>...</Card>
```

Add only these global refinements to `src/index.css`:

```css
@layer base {
  html { @apply scroll-smooth; }
  body { @apply antialiased; }
}

@layer components {
  .app-page { @apply space-y-6 pb-10; }
  .app-table-wrap { @apply overflow-x-auto rounded-xl border bg-card shadow-sm; }
  .app-focus-ring { @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2; }
}
```

- [ ] **Step 4: Run the focused test**

Run: `npx vitest run src/components/layout/LayoutPrimitives.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the visual foundation**

```bash
git add src/components/layout src/index.css
git commit -m "feat: add shared application layout primitives"
```

### Task 2: Application shell, sidebar, header, and overflow correction

**Files:**
- Create: `src/components/WorkspaceSelector.test.tsx`
- Modify: `src/components/MainLayout.tsx`
- Modify: `src/components/NavigationSidebar.tsx`
- Modify: `src/components/WorkspaceSelector.tsx`
- Modify: `src/components/SpacesTreeNav.tsx`
- Modify: `src/components/UserNav.tsx`
- Modify: `src/components/SettingsButton.tsx`

**Interfaces:**
- Consumes: `MainLayoutProps`, current module context, current sidebar persistence key, current product modal, and current hierarchy callbacks.
- Produces: a strict 256/64-pixel desktop shell and a drawer-style mobile shell.
- Produces: `WorkspaceSelector` rows that never exceed their parent width.

- [ ] **Step 1: Write the sidebar-width regression test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WorkspaceSelector from './WorkspaceSelector';

describe('WorkspaceSelector', () => {
  it('keeps a long workspace and add button inside the sidebar row', () => {
    render(
      <WorkspaceSelector
        workspaces={[{
          id: 'workspace-1',
          name: 'Workspace principal com um nome extremamente longo',
          icon: '🏢',
        } as never]}
        selectedWorkspaceId="workspace-1"
        onSelect={vi.fn()}
        onCreateProject={vi.fn()}
      />,
    );

    const row = screen.getByTestId('workspace-selector-row');
    const trigger = screen.getByRole('combobox');
    const add = screen.getByRole('button', { name: 'Criar projeto' });
    expect(row).toHaveClass('w-full', 'min-w-0');
    expect(trigger).toHaveClass('w-0', 'min-w-0', 'flex-1');
    expect(add).toHaveClass('w-10', 'shrink-0');
  });
});
```

- [ ] **Step 2: Run the regression test and verify it fails**

Run: `npx vitest run src/components/WorkspaceSelector.test.tsx`

Expected: FAIL because the test id, accessible button name, and width-contract classes are absent.

- [ ] **Step 3: Implement the width contract**

Apply these exact structural rules in `WorkspaceSelector.tsx`:

```tsx
<div data-testid="workspace-selector-row" className="flex w-full min-w-0 items-center gap-2">
  <Select ...>
    <SelectTrigger className="w-0 min-w-0 flex-1">
      <SelectValue>
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-base">{icon}</span>
          <span className="truncate">{name}</span>
        </div>
      </SelectValue>
    </SelectTrigger>
  </Select>
  <Button aria-label="Criar projeto" className="h-10 w-10 shrink-0" ... />
</div>
```

In `SpacesTreeNav.tsx`, every hierarchy row must have `w-full min-w-0`; icons and disclosure controls use `shrink-0`; labels use `min-w-0 flex-1 truncate`; long names receive `title={name}`.

- [ ] **Step 4: Standardize `MainLayout` and `NavigationSidebar`**

Implement:

- `MainLayout` root: `h-dvh overflow-hidden bg-muted/20`.
- Header: fixed 64-pixel height, `border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6`.
- Main page wrapper: `w-full px-4 py-6 sm:px-6 lg:px-8`, max width `1600px`.
- Sidebar: `bg-background`, fixed widths `w-64`/`w-16`, no content-based expansion.
- Navigation scroll area: `min-w-0 flex-1 overflow-x-hidden overflow-y-auto`.
- Work hierarchy wrapper: `min-w-0 overflow-hidden`.
- Active navigation: blue primary fill with white foreground.
- Collapsed actions: tooltips and accessible labels.
- Footer: fixed structural region separated from the independently scrolling navigation.
- Keep `AppSwitcher` unchanged inside the header modal flow.

- [ ] **Step 5: Run shell tests and Work regressions**

Run: `npx vitest run src/components/WorkspaceSelector.test.tsx src/pages/work/WorkManagement.test.tsx src/pages/work/WorkContextViews.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit the shell**

```bash
git add src/components/MainLayout.tsx src/components/NavigationSidebar.tsx src/components/WorkspaceSelector.tsx src/components/WorkspaceSelector.test.tsx src/components/SpacesTreeNav.tsx src/components/UserNav.tsx src/components/SettingsButton.tsx
git commit -m "feat: standardize application shell and navigation"
```

### Task 3: CRM Dashboard refinement with funnel preserved

**Files:**
- Create: `src/components/DashboardFunnelChart.test.tsx`
- Modify: `src/components/Dashboard.tsx`
- Modify: `src/components/DashboardBarChart.tsx`
- Modify: `src/components/DashboardFunnelChart.tsx`

**Interfaces:**
- Consumes: existing `useProposals`, `useDashboardChart`, `useCurrency`, and router actions.
- Produces: the same filters, four metrics, monthly chart, funnel, proposal table, pagination, duplicate/delete/edit/view actions.
- Must not alter `DashboardChartFilters`, `ProposalFilters`, hook dependencies, or request count.

- [ ] **Step 1: Add a funnel-preservation test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/context/CurrencyContext', () => ({
  useCurrency: () => ({ formatCurrency: (value: number) => `R$ ${value}` }),
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FunnelChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Funnel: () => <div data-testid="conversion-funnel" />,
  Tooltip: () => null,
  Cell: () => null,
}));

import DashboardFunnelChart from './DashboardFunnelChart';

describe('DashboardFunnelChart', () => {
  it('keeps the conversion funnel and its stage summary', () => {
    render(<DashboardFunnelChart isLoading={false} data={[
      { stage: 'Total de Propostas', status: 'all', count: 10, valueSum: 5000 },
      { stage: 'Em Negociação', status: 'Negociando', count: 4, valueSum: 2000 },
      { stage: 'Aprovadas', status: 'Aprovada', count: 2, valueSum: 1000 },
    ]} />);
    expect(screen.getByRole('heading', { name: 'Funil de Conversão' })).toBeInTheDocument();
    expect(screen.getByTestId('conversion-funnel')).toBeInTheDocument();
    expect(screen.getByText('10 propostas no período')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the funnel test and verify the summary failure**

Run: `npx vitest run src/components/DashboardFunnelChart.test.tsx`

Expected: FAIL because the compact stage summary is not rendered.

- [ ] **Step 3: Refine the Dashboard composition**

In `Dashboard.tsx`:

- Wrap content in `.app-page`.
- Add `PageHeader` with eyebrow `CRM`, title `Dashboard`, description `Acompanhe propostas, receita e conversão em um só lugar.`
- Keep the create action and existing floating action behavior.
- Move filters into `PageToolbar`; use responsive grid `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`.
- Replace duplicated KPI markup with the existing values passed to four `MetricCard` instances.
- Keep `Aprovado este mês` as the only strong green accent.
- Use `grid-cols-1 gap-6 xl:grid-cols-12`; monthly chart spans 8 columns and funnel spans 4.
- Wrap the proposal table in `ContentCard` and `.app-table-wrap`.
- Preserve every existing handler and pagination control.

In `DashboardFunnelChart.tsx`:

- Preserve Recharts normalization and tooltip logic.
- Add a compact text summary based on the top-stage actual count.
- Use a 280-pixel chart area on desktop and a stable skeleton of the same height.

In `DashboardBarChart.tsx`:

- Use matching card header spacing and stable 280-pixel chart geometry.
- Preserve series, period selector, tooltip, legend, and data mapping.

- [ ] **Step 4: Run the focused and full Work-safe tests**

Run: `npx vitest run src/components/DashboardFunnelChart.test.tsx src/pages/work/WorkOverview.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the Dashboard**

```bash
git add src/components/Dashboard.tsx src/components/DashboardBarChart.tsx src/components/DashboardFunnelChart.tsx src/components/DashboardFunnelChart.test.tsx
git commit -m "feat: modernize CRM dashboard layout"
```

### Task 4: CRM Clientes and Oportunidades

**Files:**
- Create: `src/components/ViewSwitcher.test.tsx`
- Modify: `src/components/ViewSwitcher.tsx`
- Modify: `src/pages/crm/Clients.tsx`
- Modify: `src/pages/crm/Opportunities.tsx`

**Interfaces:**
- Consumes: existing client/proposal hooks and actions.
- Produces: unchanged client CRUD, proposal actions, filters, pagination, Kanban drag behavior, and persisted `opportunities-view`.
- Produces: accessible `ViewSwitcher` buttons with `aria-pressed`.

- [ ] **Step 1: Write the view-switcher regression test**

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ViewSwitcher from './ViewSwitcher';

describe('ViewSwitcher', () => {
  it('exposes Kanban, Lista and Tabela as accessible selected controls', () => {
    const onChange = vi.fn();
    render(<ViewSwitcher currentView="kanban" onViewChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Kanban' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Tabela' }));
    expect(onChange).toHaveBeenCalledWith('table');
  });
});
```

- [ ] **Step 2: Run the test and verify the accessibility failure**

Run: `npx vitest run src/components/ViewSwitcher.test.tsx`

Expected: FAIL because desktop icon controls do not expose accessible names or pressed state.

- [ ] **Step 3: Modernize `ViewSwitcher`**

Keep the `ViewType` API and mobile dropdown. Add:

```tsx
aria-label={view.label}
aria-pressed={currentView === view.id}
className={cn(
  "h-9 gap-2 px-3",
  currentView === view.id && "bg-background text-foreground shadow-sm",
)}
```

Use a shared segmented-control surface: `rounded-lg border bg-muted/40 p-1`.

- [ ] **Step 4: Migrate Clientes**

In `Clients.tsx`:

- Use `.app-page` and `PageHeader` with eyebrow `CRM`, title `Clientes`, and a create-client action.
- Place search and result count in `PageToolbar`.
- Wrap the table in `ContentCard` and `.app-table-wrap`.
- Keep the create/edit dialog, detail sheet, inline fields, proposals list, CRUD callbacks, and pagination unchanged.
- Standardize icon-only actions with `aria-label`.
- Use the shared empty-state composition without removing the existing create action.

- [ ] **Step 5: Migrate Oportunidades**

In `Opportunities.tsx`:

- Use `.app-page` and `PageHeader` with the current create action and `ViewSwitcher`.
- Put search, filter toggle, owner/client/status/period filters, and sorting inside `PageToolbar`.
- Keep Kanban/List/Table render branches and localStorage persistence.
- Use `min-w-[280px]` Kanban columns, independent horizontal scrolling, compact cards, visible counts, and stable empty columns.
- Wrap list/table modes in `ContentCard`.
- Keep drag/drop, update, duplicate, edit, view, print, delete, and pagination behavior unchanged.

- [ ] **Step 6: Run the CRM control test and production build**

Run: `npx vitest run src/components/ViewSwitcher.test.tsx`

Expected: PASS.

Run: `npm run build`

Expected: successful Vite production build.

- [ ] **Step 7: Commit CRM operational pages**

```bash
git add src/components/ViewSwitcher.tsx src/components/ViewSwitcher.test.tsx src/pages/crm/Clients.tsx src/pages/crm/Opportunities.tsx
git commit -m "feat: standardize CRM operational pages"
```

### Task 5: Proposal Generator and CRM settings

**Files:**
- Create: `src/pages/crm/QuoteGeneratorPage.test.tsx`
- Modify: `src/pages/crm/QuoteGeneratorPage.tsx`
- Modify: `src/components/Stepper.tsx`
- Modify: `src/components/quote-wizard/StepServices.tsx`
- Modify: `src/components/quote-wizard/StepSettings.tsx`
- Modify: `src/components/quote-wizard/StepClient.tsx`
- Modify: `src/components/quote-wizard/StepReview.tsx`
- Modify: `src/pages/Settings.tsx`

**Interfaces:**
- Consumes: current `QuoteWizardContext` and company/account settings hooks.
- Produces: unchanged wizard validation, step order, next/back actions, proposal calculations, save/generate behavior, theme settings, company settings, email, and password operations.

- [ ] **Step 1: Add a wizard-navigation regression test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/Stepper', () => ({
  default: () => <div data-testid="stepper" />,
}));
vi.mock('@/components/quote-wizard/StepServices', () => ({
  default: () => <div>Serviços</div>,
}));
vi.mock('@/components/quote-wizard/StepSettings', () => ({
  default: () => <div>Dados</div>,
}));
vi.mock('@/components/quote-wizard/StepClient', () => ({
  default: () => <div>Cliente</div>,
}));
vi.mock('@/components/quote-wizard/StepReview', () => ({
  default: () => <div>Revisão</div>,
}));
vi.mock('@/context/QuoteWizardContext', () => ({
  useQuoteWizard: () => ({
    currentStep: 0,
    goToNextStep: vi.fn(),
    goToPreviousStep: vi.fn(),
    steps: [
      { id: 'services', label: 'Serviços' },
      { id: 'settings', label: 'Dados' },
      { id: 'client', label: 'Cliente' },
      { id: 'review', label: 'Revisão' },
    ],
    selectedServices: [],
    clientInfo: { name: '', email: '' },
    proposalTitle: '',
  }),
}));

import QuoteGeneratorPage from './QuoteGeneratorPage';

describe('QuoteGeneratorPage', () => {
  it('keeps wizard validation inside the standardized page shell', () => {
    render(<QuoteGeneratorPage userId="user-1" />);

    expect(screen.getByRole('heading', { name: 'Gerador de propostas' })).toBeInTheDocument();
    expect(screen.getByTestId('stepper')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Próximo' })).toBeDisabled();
  });
});
```

Expected assertions:

```tsx
expect(screen.getByRole('heading', { name: 'Gerador de propostas' })).toBeInTheDocument();
expect(screen.getByRole('button', { name: 'Voltar' })).toBeDisabled();
expect(screen.getByRole('button', { name: 'Próximo' })).toBeDisabled();
```

- [ ] **Step 2: Run the wizard test and verify the missing page-heading failure**

Run: `npx vitest run src/pages/crm/QuoteGeneratorPage.test.tsx`

Expected: FAIL because the page has no standardized heading.

- [ ] **Step 3: Modernize the generator**

- Add `PageHeader` with eyebrow `CRM`, title `Gerador de propostas`, and step-aware description.
- Put `Stepper` and step content inside a centered `ContentCard` with `max-w-6xl`.
- Replace the viewport-wide fixed footer with a sticky in-shell footer that respects the 256/64-pixel layout.
- Keep `isStepValid`, step ids, context reads, and navigation callbacks unchanged.
- Standardize each step's section heading, card spacing, helper text, field grid, errors, and review summary without changing field names or calculations.

- [ ] **Step 4: Modernize Settings**

- Add `PageHeader` with module-aware eyebrow and title `Configurações`.
- Use a responsive two-column settings grid at `xl`, with company and security sections as full-height `ContentCard` surfaces.
- Keep appearance and regional settings grouped in a compact preferences column.
- Preserve every hook call and save/security handler.
- Add accessible names to password-visibility and icon-only actions.

- [ ] **Step 5: Run wizard and build checks**

Run: `npx vitest run src/pages/crm/QuoteGeneratorPage.test.tsx`

Expected: PASS.

Run: `npm run build`

Expected: successful build.

- [ ] **Step 6: Commit generator and settings**

```bash
git add src/pages/crm/QuoteGeneratorPage.tsx src/pages/crm/QuoteGeneratorPage.test.tsx src/components/Stepper.tsx src/components/quote-wizard src/pages/Settings.tsx
git commit -m "feat: refine proposal workflow and settings"
```

### Task 6: Work Management visual unification

**Files:**
- Modify: `src/features/work/components/WorkPageHeader.tsx`
- Modify: `src/features/work/components/WorkTaskFilters.tsx`
- Modify: `src/features/work/components/WorkViewSwitcher.tsx`
- Modify: `src/features/work/components/WorkOverviewCharts.tsx`
- Modify: `src/features/work/components/TaskListView.tsx`
- Modify: `src/features/work/components/TaskTableView.tsx`
- Modify: `src/features/work/components/TaskBoardView.tsx`
- Modify: `src/features/work/components/WorkStates.tsx`
- Modify: `src/pages/work/WorkOverview.tsx`
- Modify: `src/pages/work/WorkTasks.tsx`
- Modify: `src/pages/work/WorkBoard.tsx`
- Modify: `src/pages/work/ProjectDetails.tsx`
- Modify: `src/pages/work/ListDetails.tsx`
- Modify: `src/pages/work/WorkManagement.tsx`
- Modify: `src/pages/work/WorkspaceSettings.tsx`
- Modify: `src/features/work/components/WorkViews.test.tsx`
- Modify: `src/pages/work/WorkOverview.test.tsx`
- Modify: `src/pages/work/WorkContextViews.test.tsx`

**Interfaces:**
- Consumes: current normalized Work data, routes, mutations, selectors, view-mode hook, and status changes.
- Produces: the same Overview analytics and task operations in consistent List, Table, and Kanban surfaces.

- [ ] **Step 1: Extend existing Work view tests**

Add assertions:

```tsx
expect(screen.getByRole('button', { name: 'Lista' })).toHaveAttribute('aria-pressed', 'true');
expect(screen.getByRole('button', { name: 'Tabela' })).toBeInTheDocument();
expect(screen.getByRole('button', { name: 'Kanban' })).toBeInTheDocument();
```

In the Overview test, retain:

```tsx
expect(screen.getByTestId('overview-charts')).toBeInTheDocument();
expect(screen.getByRole('heading', { name: 'Visão geral' })).toBeInTheDocument();
```

- [ ] **Step 2: Run Work tests before visual migration**

Run: `npx vitest run src/features/work/components/WorkViews.test.tsx src/pages/work/WorkOverview.test.tsx src/pages/work/WorkContextViews.test.tsx`

Expected: current assertions pass; any new shared-layout assertion fails until migration.

- [ ] **Step 3: Reuse shared layout primitives**

- Make `WorkPageHeader` a compatibility wrapper around shared `PageHeader`.
- Make `WorkTaskFilters` render through `PageToolbar`.
- Keep `WorkViewSwitcher` API and use the same segmented visual language as CRM.
- Replace repeated Work metric cards with `MetricCard`.
- Use `ContentCard` for charts, project tables, task lists, and board framing.
- Keep `WorkOverviewCharts` data and chart types unchanged.

- [ ] **Step 4: Standardize routes and views**

- `WorkOverview`: keep four metrics, both charts, search, and projects table.
- `WorkTasks`: keep status counts, filters, search, selected view, and actions.
- `WorkBoard`: keep project filter, metrics, filters, status changes, and board.
- `ProjectDetails` and `ListDetails`: keep URL/query-driven view selection and all three modes.
- `TaskBoardView`: use horizontal scroll, 280-pixel minimum columns, visible column counts, and compact cards.
- `TaskTableView`: use `.app-table-wrap` and responsive action cells.
- `TaskListView`: use consistent metadata hierarchy and status badges.
- `WorkStates`: use shared stable skeleton, empty, error, and retry composition.

- [ ] **Step 5: Remove the duplicate inner navigation from `WorkManagement`**

The global Work sidebar already owns workspace and hierarchy navigation. Replace the route's internal `w-80` aside with a responsive content surface that uses the selected workspace/list context. Preserve all current create dialogs, task actions, error/loading states, and the contextual FAB. This removes the nested-sidebar appearance without changing routes or data calls.

- [ ] **Step 6: Standardize workspace settings**

- Replace the legacy `p-6` heading with `PageHeader`.
- Use shared cards and a responsive workspace grid.
- Preserve create, edit, delete, selection, navigation, and confirmation behavior.
- Truncate long names and expose full text via `title`.
- Visually separate destructive actions from the primary edit action.

- [ ] **Step 7: Run all Work tests and Work typecheck**

Run: `npm test -- --run`

Expected: all Vitest tests pass.

Run: `npm run typecheck:work`

Expected: TypeScript exits with code 0.

- [ ] **Step 8: Commit Work Management**

```bash
git add src/features/work/components src/pages/work
git commit -m "feat: unify Work Management visual experience"
```

### Task 7: Responsive, accessibility, regression, and local review

**Files:**
- Modify only files implicated by verification failures.
- Do not modify `src/pages/work/ProjectDetails_old.tsx`.

**Interfaces:**
- Produces: validated desktop, collapsed-sidebar, tablet, and mobile behavior.
- Produces: a local development server bound to `127.0.0.1:8080`.

- [ ] **Step 1: Run automated verification**

Run:

```bash
npm test -- --run
npm run typecheck:work
npm run lint
npm run build
```

Expected:

- All tests pass.
- Work typecheck exits with code 0.
- No new lint errors are introduced in touched files.
- Vite production build succeeds.

- [ ] **Step 2: Start the redesign branch locally**

Run: `npm run dev -- --host 127.0.0.1 --port 8080`

Expected: Vite reports `http://127.0.0.1:8080/`.

- [ ] **Step 3: Verify representative routes in a real browser**

At desktop width 1440×1000, collapsed desktop width, tablet 1024×768, and mobile 390×844, verify:

- `/`
- `/clients`
- `/opportunities`
- `/generator`
- `/settings`
- `/work/overview`
- `/work/tasks`
- `/work/board`
- `/work/workspaces`
- Work settings route exposed by the router

Check:

- No sidebar overlap or horizontal page overflow.
- Long workspace/project names truncate.
- Product modal opens and remains the switching mechanism.
- CRM funnel is visible.
- Work charts are visible.
- List, Table, and Kanban controls remain available.
- Tables scroll within their surface.
- Icon-only controls have accessible labels.
- Primary actions and dialogs still open.

- [ ] **Step 4: Fix only reproduced verification defects**

For every defect, add or extend the closest regression test first, run it to confirm failure, apply the smallest fix, and rerun the focused test.

- [ ] **Step 5: Run final verification after fixes**

Run:

```bash
npm test -- --run
npm run typecheck:work
npm run build
```

Expected: all commands pass.

- [ ] **Step 6: Commit verification fixes if any**

```bash
git add -- src/components src/pages src/features src/index.css ':(exclude)src/pages/work/ProjectDetails_old.tsx'
git commit -m "fix: polish responsive redesign behavior"
```

- [ ] **Step 7: Keep the localhost server running and report the URL**

Leave the final verified branch running at `http://127.0.0.1:8080` for user review.
