---
phase: 01-fundacao-e-infraestrutura
plan: "03"
subsystem: auth-infrastructure
tags: [supabase, zustand, tanstack-query, auth, currency, tdd, service-layer]
status: complete
dependency_graph:
  requires:
    - 01-01 (Supabase project URL + delete_user() SECURITY DEFINER function)
    - 01-02 (Vite scaffold with @/* alias, zustand, @tanstack/react-query, @supabase/supabase-js installed)
  provides:
    - src/lib/supabase.ts (Supabase singleton, named export)
    - src/utils/currency.ts (centsToBRL + BRLtoCents — D-09)
    - src/utils/currency.test.ts (7 passing tests)
    - src/stores/auth.store.ts (useAuthStore — user, loading, setUser, setLoading)
    - src/providers/AuthProvider.tsx (onAuthStateChange + initial getSession)
    - src/providers/QueryProvider.tsx (TanStack QueryClient wrapper)
    - src/services/auth.service.ts (signUp, signIn, signOut, deleteAccount — D-11)
    - src/services/auth.service.test.ts (5 passing tests)
    - .env.example (committed template with placeholder values)
  affects:
    - 01-04 (auth UI — imports authService + useAuthStore)
    - 01-05 (AppShell — wraps with AuthProvider + QueryProvider)
    - All subsequent plans that use monetary values (import centsToBRL/BRLtoCents from currency.ts)
tech_stack:
  added: []
  patterns:
    - Supabase client singleton in src/lib/supabase.ts — throws if env vars missing (T-1-02)
    - D-09: centavos INTEGER in DB; centsToBRL/BRLtoCents are the only conversion points
    - D-11: *.service.ts pure layer — components never import @supabase/supabase-js directly
    - AuthProvider: getSession on mount → loading=false to prevent auth flash (T-1-03)
    - deleteAccount: rpc('delete_user') SECURITY DEFINER → graceful signOut (T-1-04)
    - TDD RED/GREEN cycle applied to both currency.ts and auth.service.ts
key_files:
  created:
    - src/lib/supabase.ts
    - src/utils/currency.ts
    - src/utils/currency.test.ts
    - src/stores/auth.store.ts
    - src/providers/AuthProvider.tsx
    - src/providers/QueryProvider.tsx
    - src/services/auth.service.ts
    - src/services/auth.service.test.ts
    - .env.example
  modified: []
decisions:
  - "D-09 enforced: currency.ts centsToBRL uses Intl.NumberFormat pt-BR; BRLtoCents strips thousand separator before parsing"
  - "D-11 enforced: auth.service.ts is the only file calling supabase.auth.*; no component imports @supabase/supabase-js"
  - ".env.local gitignored per Vite scaffold .gitignore; .env.example committed with placeholder values"
  - "QueryClient instantiated inside QueryProvider component (not module level) to avoid shared state in tests"
  - "AuthProvider sets loading=false after getSession() resolves — prevents ProtectedRoute redirect flash (T-1-03)"
metrics:
  duration: "~3 minutes"
  completed_date: "2026-06-29"
  tasks_completed: 2
  tasks_total: 2
  files_created: 9
  files_modified: 0
---

# Phase 01 Plan 03: Core Infrastructure Layer Summary

**One-liner:** Supabase singleton with env-var guard, currency utility (centsToBRL/BRLtoCents) with 7 unit tests, Zustand auth store, AuthProvider (onAuthStateChange + loading state), TanStack QueryProvider, and authService (D-11 service layer) with 5 unit tests — all 13 tests passing.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Supabase singleton + currency utility (TDD RED→GREEN) | 9ced7cc | src/lib/supabase.ts, src/utils/currency.ts, src/utils/currency.test.ts, .env.example |
| 2 | Auth store, providers, auth service (TDD RED→GREEN) | 1ef81b2 | src/stores/auth.store.ts, src/providers/AuthProvider.tsx, src/providers/QueryProvider.tsx, src/services/auth.service.ts, src/services/auth.service.test.ts |

## Verification Results

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| npm run test -- --run (all) | 13 passed | 13 passed (3 test files) | PASS |
| currency.test.ts | 7 passed | 7 passed | PASS |
| auth.service.test.ts | 5 passed | 5 passed | PASS |
| supabase.ts has throw near env var check | present | line 7: throw new Error(...) | PASS |
| .env.local exists | yes | yes (gitignored) | PASS |
| .env.local NOT tracked by git | not in git status | confirmed absent from git status | PASS |
| auth.service.ts contains 'delete_user' | present | line 24: supabase.rpc('delete_user') | PASS |
| No component imports @supabase/supabase-js | zero direct imports | only auth.store.ts (User type) + supabase.ts (createClient) | PASS |

## Deviations from Plan

None — plan executed exactly as written. TDD RED/GREEN cycle followed for both tasks. All acceptance criteria met on first implementation attempt.

## Known Stubs

- `.env.local` contains `VITE_SUPABASE_ANON_KEY=REPLACE_WITH_ANON_KEY_FROM_DASHBOARD` as a placeholder. The user must replace this with the real anon key from Supabase Dashboard → Project Settings → API before running the app. This is intentional — the anon key was not available in the execution context and must not be committed to git.

## Threat Surface Scan

No new threat surface beyond the plan's threat model:
- T-1-02: supabase.ts uses only VITE_SUPABASE_ANON_KEY (anon key, browser-safe). No VITE_SUPABASE_SERVICE_ROLE_KEY referenced anywhere.
- T-1-03: AuthProvider sets loading=true initially, false after getSession() — ProtectedRoute (Plan 04) reads this to prevent auth flash.
- T-1-04: deleteAccount() calls rpc('delete_user') — SECURITY DEFINER function from Plan 01 that deletes WHERE id = auth.uid(); signOut failure after deletion is silently ignored.

## Self-Check

Files verified:
