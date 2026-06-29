---
plan: 02-02
phase: 02-onboarding-mei
status: complete
wave: 2
started: 2026-06-29
completed: 2026-06-29
subsystem: auth-routing
tags: [service-layer, zustand, provider, routing, tdd]
requires:
  - 02-01 (UNIQUE constraint on user_id — required for upsert onConflict)
  - src/stores/auth.store.ts (useAuthStore — EmpresaProvider depends on user/authLoading)
provides:
  - src/services/empresa.service.ts (CRUD for empresa_mei)
  - src/stores/empresa.store.ts (useEmpresaStore — empresa + loading state)
  - src/providers/EmpresaProvider.tsx (boot hydration after auth resolves)
  - src/components/OnboardingGuard.tsx (guards /onboarding route)
  - ProtectedRoute extended with 3-way guard (auth + empresa check)
  - /onboarding route in App.tsx
affects:
  - src/main.tsx (EmpresaProvider added to provider tree)
  - src/components/ProtectedRoute.tsx (extended with empresa check)
  - src/App.tsx (new /onboarding route)
tech-stack:
  added:
    - useEmpresaStore (Zustand — mirrors useAuthStore shape)
    - EmpresaProvider (boot-time hydration pattern)
    - OnboardingGuard (complementary guard to ProtectedRoute)
  patterns:
    - service layer pure functions (D-11) — empresa.service.ts calls Supabase, nothing else does
    - upsert with onConflict: 'user_id' — safe for first-save and profile edits
    - maybeSingle() instead of single() — returns null on zero rows, doesn't throw
    - double-loading guard (authLoading OR empresaLoading) — prevents premature redirect (T-02-03 / Pitfall 6)
    - cancelled flag in useEffect cleanup — prevents state update on unmounted component
key-files:
  created:
    - src/services/empresa.service.ts
    - src/services/empresa.service.test.ts
    - src/stores/empresa.store.ts
    - src/providers/EmpresaProvider.tsx
    - src/components/OnboardingGuard.tsx
    - src/pages/OnboardingPage.tsx (placeholder stub for plan 02-03)
  modified:
    - src/components/ProtectedRoute.tsx (extended with empresa check)
    - src/components/ProtectedRoute.test.tsx (updated to mock useEmpresaStore, +2 new tests)
    - src/App.tsx (added /onboarding route with OnboardingGuard)
    - src/main.tsx (EmpresaProvider added after AuthProvider)
decisions:
  - empresaService uses maybeSingle not single — avoids throw on zero rows (per plan must_haves)
  - useEmpresaStore initial loading: true — prevents flash before first fetch
  - EmpresaProvider placed inside AuthProvider (reads user/authLoading from auth store)
  - /onboarding route placed outside /app block — no AppShell, no BottomNav (D-07)
  - cancelled flag in EmpresaProvider useEffect — prevents race condition on fast navigation
metrics:
  duration: 5min
  completed: 2026-06-29
  tasks: 2
  files: 10
commits:
  - 68d4ac9 (test RED — failing empresa.service tests)
  - b8a3369 (feat GREEN — service + store + provider)
  - 3ecb3fd (feat — guards + route)
---

# Phase 02 Plan 02: Foundation Layer Summary

## What Was Built

empresa.service.ts (pure Supabase layer), empresa.store.ts (Zustand store mirroring auth.store.ts), EmpresaProvider (boot-time hydration), ProtectedRoute extended with 3-way auth+empresa guard, OnboardingGuard for /onboarding, and /onboarding stub route in App.tsx — full foundation for the Onboarding UI in plan 02-03.

## Tasks Completed

| # | Task | Commit | Result |
|---|------|--------|--------|
| 1 | empresa.service.ts + empresa.store.ts + EmpresaProvider | b8a3369 | 5 unit tests pass |
| 2 | ProtectedRoute 3-way guard + OnboardingGuard + /onboarding in App.tsx | 3ecb3fd | Build clean, 23 tests pass |

## Architecture

### Provider Tree (main.tsx)
```
QueryProvider
  → AuthProvider        (auth.store: user + authLoading)
    → EmpresaProvider   (empresa.store: empresa + empresaLoading)
      → App             (BrowserRouter + Routes)
```

### Route Guard Logic

**ProtectedRoute** (guards /app/*):
1. authLoading OR empresaLoading → Carregando...
2. user === null → /welcome
3. empresa === null → /onboarding
4. empresa !== null → render children

**OnboardingGuard** (guards /onboarding):
1. authLoading OR empresaLoading → Carregando...
2. user === null → /welcome
3. empresa !== null → /app
4. Otherwise → render children (show onboarding form)

### Service Layer

`empresaService.getForCurrentUser()` — uses `.maybeSingle()` to return `null` on zero rows (not throw). Called only by EmpresaProvider at boot.

`empresaService.save(input)` — uses `.upsert({ onConflict: 'user_id' })` safe for both first save and subsequent edits.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated ProtectedRoute.test.tsx to mock useEmpresaStore**
- **Found during:** Task 2 verification (full test suite run)
- **Issue:** Existing test set `user` non-null and `loading: false` but empresa store still had initial state `loading: true` — ProtectedRoute showed spinner instead of children, failing the "renders children" assertion
- **Fix:** Added `vi.mock('@/stores/empresa.store')` to the test, updated mocks in each test case, added 2 new test cases (empresaLoading guard, /onboarding redirect)
- **Files modified:** `src/components/ProtectedRoute.test.tsx`
- **Commit:** 3ecb3fd

## Known Stubs

| File | Line | Reason |
|------|------|--------|
| src/pages/OnboardingPage.tsx | all | Placeholder div "Onboarding" — real CNPJ form implemented in plan 02-03 |

## Threat Mitigations Applied

| Threat ID | Mitigation |
|-----------|-----------|
| T-02-03 | authLoading OR empresaLoading guard prevents premature redirect before session/empresa resolves |
| T-02-04 | onConflict: 'user_id' + migration 0002 UNIQUE constraint prevents duplicate rows |
| T-02-06 | OnboardingGuard redirects unauthenticated users to /welcome — no empresa_mei data exposed |

## Self-Check: PASSED
