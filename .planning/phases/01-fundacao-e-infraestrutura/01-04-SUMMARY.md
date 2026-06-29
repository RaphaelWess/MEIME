---
phase: 01-fundacao-e-infraestrutura
plan: "04"
subsystem: auth-ui
tags: [react-router, protected-route, auth-ui, tdd, welcome-page, auth-page, privacidade, lgpd]
status: complete
dependency_graph:
  requires:
    - 01-03 (useAuthStore + authService + AuthProvider + QueryProvider)
    - 01-02 (Vite scaffold with shadcn/ui Button, Input, Label, Alert components installed)
  provides:
    - src/components/ProtectedRoute.tsx (loading-state flash prevention, 3 unit tests)
    - src/components/ProtectedRoute.test.tsx (3 passing test cases)
    - src/components/AppShell.tsx (stub — Plan 05 replaces)
    - src/App.tsx (full BrowserRouter + declarative route tree)
    - src/main.tsx (QueryProvider → AuthProvider → App, single BrowserRouter in App)
    - src/pages/WelcomePage.tsx (entry point, CTA, /privacidade footer link)
    - src/pages/AuthPage.tsx (email+password login+register tabs, D-11 authService, D-03 link)
    - src/pages/PrivacidadePage.tsx (public LGPD policy, no auth required)
    - src/pages/InicioTab.tsx (stub — Plan 05 replaces)
    - src/pages/FinancasTab.tsx (stub — Plan 05 replaces)
    - src/pages/AgendaTab.tsx (stub — Plan 05 replaces)
    - src/pages/CobrarTab.tsx (stub — Plan 05 replaces)
    - src/pages/ContaTab.tsx (stub — Plan 05 replaces)
  affects:
    - 01-05 (AppShell, BottomNav, stub tab pages — all replaced)
    - All subsequent plans that navigate within /app/*
tech_stack:
  added: []
  patterns:
    - ProtectedRoute: loading===true → spinner (prevents auth flash T-1-03/Pitfall 6), user===null+loading===false → Navigate /welcome, else render children
    - Single BrowserRouter in App.tsx only — NOT in main.tsx (Pitfall 4)
    - Provider nesting: QueryProvider → AuthProvider → App (BrowserRouter inside)
    - D-11 enforced: AuthPage calls authService.signIn/signUp — zero direct Supabase imports in pages
    - D-03 enforced: /privacidade link in WelcomePage footer AND AuthPage footer
    - TDD RED/GREEN cycle: ProtectedRoute.test.tsx written before implementation
key_files:
  created:
    - src/components/ProtectedRoute.tsx
    - src/components/ProtectedRoute.test.tsx
    - src/components/AppShell.tsx
    - src/pages/WelcomePage.tsx
    - src/pages/AuthPage.tsx
    - src/pages/PrivacidadePage.tsx
    - src/pages/InicioTab.tsx
    - src/pages/FinancasTab.tsx
    - src/pages/AgendaTab.tsx
    - src/pages/CobrarTab.tsx
    - src/pages/ContaTab.tsx
  modified:
    - src/App.tsx (full router tree replaces scaffold stub)
    - src/main.tsx (providers added; BrowserRouter moved to App)
    - src/test/App.test.tsx (updated smoke test; no longer expects scaffold text)
    - tsconfig.app.json (exclude test files from build; add @testing-library/jest-dom types)
decisions:
  - "Pitfall 4 mitigated: BrowserRouter lives in App.tsx only; main.tsx wraps App in QueryProvider → AuthProvider"
  - "Pitfall 6 mitigated: ProtectedRoute returns loading spinner when loading===true; never redirects while loading"
  - "D-11 enforced: AuthPage imports authService from @/services/auth.service; zero @supabase/supabase-js in pages"
  - "D-03 enforced: /privacidade linked from WelcomePage footer AND AuthPage footer"
  - "tsconfig.app.json updated to exclude *.test.tsx files from build (pre-existing Plan 03 type error suppressed)"
  - "App.test.tsx smoke test updated: renders without crash using mocked Supabase; no longer checks scaffold text"
metrics:
  duration: "~5 minutes"
  completed_date: "2026-06-29"
  tasks_completed: 2
  tasks_total: 2
  files_created: 11
  files_modified: 4
---

# Phase 01 Plan 04: Auth UI Flow Summary

**One-liner:** React Router declarative tree with ProtectedRoute (loading-state flash prevention, 3 TDD tests), WelcomePage entry point, AuthPage with email+password login/register tabs calling authService (D-11), and public PrivacidadePage with LGPD compliance — all 16 tests passing, build clean.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | ProtectedRoute + router tree (TDD RED→GREEN) | 48853d8 | src/components/ProtectedRoute.tsx, src/components/ProtectedRoute.test.tsx, src/App.tsx, src/main.tsx, src/components/AppShell.tsx, src/pages/*.tsx (stubs), src/test/App.test.tsx, tsconfig.app.json |
| 2 | WelcomePage, AuthPage, PrivacidadePage | b704fa8 | src/pages/WelcomePage.tsx, src/pages/AuthPage.tsx, src/pages/PrivacidadePage.tsx |

## Verification Results

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| ProtectedRoute tests (3 cases) | 3 passed | 3 passed | PASS |
| All tests | 16 passed | 16 passed (4 test files) | PASS |
| npm run build | exits 0 | exits 0 | PASS |
| App.tsx has exactly one BrowserRouter import | 1 import | 1 import (comment refs excluded) | PASS |
| main.tsx has NO BrowserRouter import | absent | absent (only in comments) | PASS |
| /privacidade is top-level public route | not inside /app | Route path="/privacidade" at root level | PASS |
| ProtectedRoute wraps /app | element={<ProtectedRoute>} | confirmed | PASS |
| AuthPage imports authService (not supabase) | @/services/auth.service | confirmed, zero @supabase imports | PASS |
| WelcomePage has 'Começar agora' | present | present | PASS |
| WelcomePage has /privacidade link | present (D-03) | present in footer | PASS |
| AuthPage has /privacidade link | present (D-03) | present in footer | PASS |
| PrivacidadePage no auth imports | absent | absent | PASS |
| PrivacidadePage heading | 'Política de Privacidade' | present | PASS |
| PrivacidadePage LGPD deletion ref | 'Excluir minha conta' | present in section 4 | PASS |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Pre-existing smoke test expected scaffold text after App.tsx replacement**
- **Found during:** Task 1 verification (npm run test -- --run)
- **Issue:** `src/test/App.test.tsx` from Plan 02 expected `screen.getByText('MEIME scaffold')` — but App.tsx was fully replaced with the real BrowserRouter tree, making this test fail
- **Fix:** Updated smoke test to verify App renders without crash (container truthy), with Supabase mocked to avoid real network calls
- **Files modified:** src/test/App.test.tsx
- **Commit:** 48853d8

**2. [Rule 3 - Blocking] tsconfig.app.json included test files in build causing TS errors**
- **Found during:** Task 1 verification (npm run build)
- **Issue:** `src/services/auth.service.test.ts` was included in the build due to broad `"include": ["src"]` with only `"exclude": ["src/test"]` — vitest mock types caused TS2352 errors. Additionally `@testing-library/jest-dom` matchers weren't in the types array
- **Fix:** Added `"src/**/*.test.ts"`, `"src/**/*.test.tsx"`, `"src/**/*.spec.ts"`, `"src/**/*.spec.tsx"` to tsconfig.app.json exclude; added `"@testing-library/jest-dom"` to types
- **Files modified:** tsconfig.app.json
- **Commit:** 48853d8

**3. [Rule 3 - Blocking] AuthProvider and QueryProvider use named exports, not default**
- **Found during:** Task 1 build verification
- **Issue:** Plan action said `import AuthProvider from '@/providers/AuthProvider'` (default import) but both providers from Plan 03 use named exports (`export function AuthProvider`, `export function QueryProvider`)
- **Fix:** Used named imports in main.tsx: `import { AuthProvider } from '@/providers/AuthProvider'`
- **Files modified:** src/main.tsx
- **Commit:** 48853d8

## Known Stubs

The following stub components were created to satisfy the router tree. They return `null` and will be fully replaced in Plan 05:
- `src/components/AppShell.tsx` — will render BottomNav + children + FAB
- `src/pages/InicioTab.tsx` — will render "Em breve" placeholder
- `src/pages/FinancasTab.tsx` — will render "Em breve" placeholder
- `src/pages/AgendaTab.tsx` — will render "Em breve" placeholder
- `src/pages/CobrarTab.tsx` — will render "Em breve" placeholder
- `src/pages/ContaTab.tsx` — will render Conta tab (user info, logout, delete account, privacy link)

These stubs do NOT prevent the plan's goal (auth flow end-to-end): WelcomePage → AuthPage → ProtectedRoute → /app works correctly. AppShell renders null (blank page after login) until Plan 05.

## Threat Surface Scan

No new threat surface beyond the plan's threat model:
- T-1-03 mitigated: ProtectedRoute checks `loading===true` before redirecting. Unit tests verify all 3 cases (loading, no-user, has-user).
- T-1-06 accepted: AuthPage calls authService which uses Supabase JWT-based auth; no CSRF surface.
- `/privacidade` is a top-level public route — not inside ProtectedRoute subtree, accessible without auth.

## Self-Check: PASSED

All created files verified on disk. All commits verified in git log.

| Item | Status |
|------|--------|
| src/components/ProtectedRoute.tsx | FOUND |
| src/components/ProtectedRoute.test.tsx | FOUND |
| src/App.tsx | FOUND |
| src/main.tsx | FOUND |
| src/pages/WelcomePage.tsx | FOUND |
| src/pages/AuthPage.tsx | FOUND |
| src/pages/PrivacidadePage.tsx | FOUND |
| commit 48853d8 (Task 1) | FOUND |
| commit b704fa8 (Task 2) | FOUND |
