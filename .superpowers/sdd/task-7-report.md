# Task 7 — Unsaved-change navigation guard

## Delivered

- Migrated the application shell from `BrowserRouter` to a React Router 6.30.1 data router while preserving the existing route table, authentication/layout providers, and legacy redirects.
- Added `useUnsavedProposalGuard` with SPA transition blocking and native `beforeunload` protection.
- Enabled the guard only for dirty, editable proposal sessions that are not locked or saving.
- Added an accessible discard dialog with explicit continue-editing and discard actions.
- Cancel resets the pending transition and preserves the draft; confirm proceeds with the exact pending link, programmatic, back, or forward transition without a blocker loop.

## TDD and verification

- RED: the focused hook suite failed because `useUnsavedProposalGuard` did not exist.
- GREEN: hook suite passed all clean, dirty, reset, proceed, back-navigation, and `beforeunload` cases.
- Integration RED: two page tests failed because the discard dialog and actions were absent.
- Integration GREEN/regression: `pnpm vitest run src/features/crm/proposals/useUnsavedProposalGuard.test.tsx src/components/MainLayout.test.tsx src/pages/crm/QuoteGeneratorRoute.test.tsx src/pages/crm/QuoteGeneratorPage.test.tsx` — passed.
- `pnpm exec eslint src/App.tsx src/pages/crm/QuoteGeneratorPage.tsx src/pages/crm/QuoteGeneratorPage.test.tsx src/features/crm/proposals/useUnsavedProposalGuard.ts src/features/crm/proposals/useUnsavedProposalGuard.test.tsx` — passed.
- `pnpm typecheck:work` — passed.
- `pnpm exec tsc -p tsconfig.app.json --noEmit` — blocked by 23 pre-existing errors outside the Task 7 files; no diagnostic referenced a changed file.
- `pnpm build` — passed (3,944 modules transformed).
- `pnpm test` — 29 files and 114 tests passed.

## Review

- `git diff --check` passed.
- Existing routes, auth behavior, module/layout providers, and the legacy proposal redirect remain intact.
- No database, migration, MCP, push, or out-of-worktree changes were made.
