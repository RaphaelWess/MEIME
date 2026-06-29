---
plan: 02-03
phase: 02-onboarding-mei
status: complete
wave: 3
started: 2026-06-29
completed: 2026-06-29
commits:
  - dd17f6c: test(02-03): add failing tests for CNPJ utils and useOnboardingCnpj
  - 4fea915: feat(02-03): cnpj utils + useCnpjMask + useOnboardingCnpj
  - b710dc7: test(02-03): add failing tests for OnboardingPage
  - 1259f04: feat(02-03): OnboardingPage — CNPJ lookup + save flow
key-files:
  created:
    - src/utils/cnpj.ts
    - src/utils/cnpj.test.ts
    - src/hooks/useCnpjMask.ts
    - src/hooks/useOnboardingCnpj.ts
    - src/hooks/useOnboardingCnpj.test.ts
    - src/pages/OnboardingPage.test.tsx
  modified:
    - src/pages/OnboardingPage.tsx (replaced stub)
decisions:
  - alphanumeric CNPJ: charCodeAt(i)-48 algorithm supports A-Z (Receita Federal spec live July 6 2026)
  - debounce 500ms: prevents API calls on every keystroke; isValidCnpj guard prevents invalid lookups
  - BrasilAPI primary + OpenCNPJ fallback: best uptime, no API key, CORS-enabled
  - situacao_cadastral column stores text string (descricao_situacao_cadastral), NOT the integer
  - test fix: useOnboardingCnpj tests use act(async) + Promise.resolve() instead of waitFor with fake timers
tech-stack:
  added: []
  patterns:
    - TDD RED/GREEN per task
    - useDebouncedCnpj internal hook pattern
    - fetchCnpjWithFallback: try primary API, normalize fallback to shared type
metrics:
  duration: 6 minutes
  tasks_completed: 2
  files_created: 6
  files_modified: 1
  tests_added: 25
  total_tests: 48
---

# Phase 02 Plan 03: OnboardingPage — CNPJ Lookup + Save Flow Summary

**One-liner:** CNPJ utilities (alphanumeric-ready) + BrasilAPI/OpenCNPJ lookup hook + full onboarding form with empresa save.

## What Was Built

### Task 1: CNPJ Utilities + Mask Hook + Lookup Hook

**`src/utils/cnpj.ts`** — Three exports:
- `stripCnpj(value)` — strips non-alphanumeric chars, uppercases; handles new A-Z CNPJs
- `formatCnpj(raw)` — progressive mask XX.XXX.XXX/XXXX-XX as user types
- `isValidCnpj(raw)` — charCodeAt(i)-48 modulo-11 algorithm; strips first, rejects all-same sequences, validates 14-char length

**`src/hooks/useCnpjMask.ts`** — Controlled input hook returning `{ raw, masked, handleChange }`. `raw` is used for API/save, `masked` for the input `value` prop.

**`src/hooks/useOnboardingCnpj.ts`** — TanStack Query hook:
- Internal `useDebouncedCnpj(rawCnpj)` with 500ms delay
- `isReady = debouncedCnpj.length === 14 && isValidCnpj(debouncedCnpj)` guards the query
- `fetchCnpjWithFallback`: BrasilAPI primary → OpenCNPJ fallback → throws `CNPJ_NOT_FOUND` or `API_ERROR`
- `CnpjData` type exported for use in OnboardingPage
- 1-hour staleTime, retry: false

### Task 2: OnboardingPage

Replaced the stub `OnboardingPage.tsx` with a full implementation:
- Standalone full-screen centered card (no AppShell, no BottomNav)
- CNPJ input with `inputMode="numeric"`, `maxLength=18`, progressive mask via `useCnpjMask`
- Loading spinner while `isFetching`
- **On API success:** `razao_social` is read-only (disabled), CNAE description shown, situacao cadastral shown; yellow warning if not "ATIVA" (non-blocking)
- **On API error:** `razao_social` and CNAE become editable text inputs; error message distinguishes `CNPJ_NOT_FOUND` vs `API_ERROR`
- `atividade_principal` always editable, pre-filled from CNAE description
- `data_abertura_mei` date input always editable
- Submit disabled until `razao_social` + `data_abertura_mei` non-empty
- `situacao_cadastral` column receives `data.descricao_situacao_cadastral` (text "ATIVA"), NOT the integer `data.situacao_cadastral`
- On success: `setEmpresa(result)` → `navigate('/app', { replace: true })`

## Test Coverage

| File | Tests |
|------|-------|
| cnpj.test.ts | 17 (stripCnpj, formatCnpj, isValidCnpj) |
| useOnboardingCnpj.test.ts | 3 (debounce, guard, fetch trigger) |
| OnboardingPage.test.tsx | 5 (placeholder, disabled submit, CNPJ_NOT_FOUND, API_ERROR, read-only) |
| **Total new tests** | **25** |
| **Total suite** | **48 passing** |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] useOnboardingCnpj test timing with fake timers**
- **Found during:** Task 1 GREEN phase (test debugging)
- **Issue:** `waitFor` with `vi.useFakeTimers()` causes infinite timeout because `waitFor` uses real-time polling that never advances under fake timers
- **Fix:** Replaced `waitFor(() => ...)` with `await act(async () => { vi.advanceTimersByTime(600); await Promise.resolve() })` followed by synchronous assertion
- **Files modified:** `src/hooks/useOnboardingCnpj.test.ts`
- **Commit:** 4fea915 (included in GREEN commit)

**2. [Rule 2 - Missing input] Initial CNPJ in fetch-trigger test caused immediate query**
- **Found during:** Task 1 RED → GREEN fix
- **Issue:** Starting the hook with a valid 14-char CNPJ immediately enables the query before "before debounce" assertion runs
- **Fix:** Test starts with 13-char (invalid) CNPJ, then rerenders with 14-char valid CNPJ, then advances timer
- **Files modified:** `src/hooks/useOnboardingCnpj.test.ts`
- **Commit:** 4fea915

## Known Stubs

None — all fields are wired to real state and the form submits to `empresaService.save()`.

## Threat Flags

None — OnboardingPage performs a write on behalf of the authenticated user (user_id comes from `useAuthStore().user.id`). The empresa service uses Supabase RLS; no new unauthenticated surface introduced.

## TDD Gate Compliance

- RED gate (test commits before implementation): dd17f6c (CNPJ utils), b710dc7 (OnboardingPage)
- GREEN gate (implementation commits after tests): 4fea915 (CNPJ utils + hooks), 1259f04 (OnboardingPage)
- Gate sequence: PASSED

## Self-Check: PASSED

Files exist:
- src/utils/cnpj.ts: FOUND
- src/utils/cnpj.test.ts: FOUND
- src/hooks/useCnpjMask.ts: FOUND
- src/hooks/useOnboardingCnpj.ts: FOUND
- src/hooks/useOnboardingCnpj.test.ts: FOUND
- src/pages/OnboardingPage.tsx: FOUND (replaced stub)
- src/pages/OnboardingPage.test.tsx: FOUND

Commits: dd17f6c, 4fea915, b710dc7, 1259f04 — all in git log.

Build: passes (tsc -b + vite build, 0 errors).
Tests: 48/48 passing.
