---
phase: 04-inteligencia-de-faturamento
plan: "03"
subsystem: faturamento-hook
tags: [tanstack-query, zustand, react-hook, tdd, faturamento]
status: complete

dependency_graph:
  requires:
    - 04-01  # useFaturamento.test.ts (RED tests)
    - 04-02  # transacaoService.getByYear + faturamento.ts pure functions
  provides:
    - useFaturamento  # composable for InicioTab (Plan 04-04)
  affects:
    - src/hooks/useFaturamento.ts

tech_stack:
  added: []
  patterns:
    - TanStack Query useQuery with enabled guard
    - Zustand store read (useEmpresaStore) + derived calculations
    - queryKey namespace for auto-invalidation (D-21)
    - empresa null guard for isLoading override (Pitfall 4)

key_files:
  created:
    - src/hooks/useFaturamento.ts
  modified: []

decisions:
  - "queryKey ['transacoes', year, 'faturamento'] — first element 'transacoes' matches invalidateQueries(['transacoes']) after mutations (D-21)"
  - "isLoading returned as isLoading || empresa === null — ensures skeleton state while EmpresaProvider is booting (Pitfall 4)"
  - "enabled: !!empresa — prevents Supabase query when empresa not yet loaded (T-04-04)"
  - "staleTime: 0, retry: false — project-wide TanStack Query standards (D-20)"

metrics:
  duration: "~5 minutes"
  completed: "2026-06-30T21:37:07Z"
  tasks_completed: 1
  tasks_total: 1
  files_created: 1
  files_modified: 0
---

# Phase 04 Plan 03: useFaturamento Hook Summary

**One-liner:** TanStack Query hook composing getByYear + useEmpresaStore + 5 pure calc functions into annual billing state with empresa-null guard and 'transacoes' queryKey namespace.

## Artifacts

| Symbol | File | Kind |
|--------|------|------|
| useFaturamento | src/hooks/useFaturamento.ts | exported React hook |

## Task Execution

### Task 1: Create useFaturamento hook — GREEN

**Commit:** `c3ba1e2` — `feat(04): useFaturamento hook — TanStack Query composable for annual billing`

**Test results:**
- `npx vitest run src/hooks/useFaturamento.test.ts` — 3/3 GREEN
- `npx vitest run` — 95/95 GREEN (13 test files, no regressions)

**Acceptance criteria verified:**
- [x] `src/hooks/useFaturamento.ts` exists
- [x] `queryKey[0]` === `'transacoes'` (D-21 namespace)
- [x] `staleTime: 0` present
- [x] `retry: false` present
- [x] `enabled: !!empresa` present
- [x] `isLoading: isLoading || empresa === null` present (empresa null guard)
- [x] All 3 hook tests GREEN
- [x] Full suite GREEN (95 tests)

## Deviations from Plan

None — plan executed exactly as written.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. The hook reads from an existing Supabase query (getByYear) via the service layer. No new threat surface.

## Self-Check: PASSED

- [x] File exists: `src/hooks/useFaturamento.ts`
- [x] Commit `c3ba1e2` exists in git log
- [x] All 3 tests GREEN
- [x] Full suite GREEN (95/95)
