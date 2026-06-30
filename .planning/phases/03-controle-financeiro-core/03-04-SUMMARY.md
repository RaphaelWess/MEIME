---
phase: 03-controle-financeiro-core
plan: "04"
subsystem: hooks
tags: [tanstack-query, react-hooks, typescript, vitest, aggregation]

requires:
  - phase: 03-02
    provides: transacaoService.getByMonth + Transacao type
  - phase: 03-03
    provides: financas.store + useCurrencyInput (store shape pattern)

provides:
  - "useTransacoes(year, month) — TanStack Query hook with queryKey ['transacoes', year, month], staleTime 0, retry false"
  - "useTransacoesSummary(year, month) — aggregates Transacao[] into { summary: TransacoesSummary, isLoading, error }"
  - "TransacoesSummary interface: { entradas, saidas, saldo, lucro } all centavos integers"

affects:
  - 03-05-TransactionSheet
  - 03-06-InicioTab-FinancasTab

tech-stack:
  added: []
  patterns:
    - "useTransacoes: thin TanStack Query wrapper — queryKey, queryFn, staleTime 0, retry false (D-20)"
    - "useTransacoesSummary: compose pattern — calls hook, reduces array, derives values; no extra query"
    - "Mock pattern: vi.mock('./useTransacoes') avoids TanStack Query provider in tests"

key-files:
  created:
    - src/hooks/useTransacoes.ts
    - src/hooks/useTransacoesSummary.ts
  modified: []

key-decisions:
  - "staleTime 0 on useTransacoes — always refetch on mount (D-20)"
  - "useTransacoesSummary calls useTransacoes internally — no separate Supabase query"
  - "lucro is an alias of saldo (same value) — MEI terminology per D-10"
  - "saldo can be negative when saidas > entradas"

patterns-established:
  - "Aggregation via reduce over Transacao[] — start with zeros, accumulate, compute derived values after"
  - "isLoading and error forwarded unchanged from inner hook to outer hook"

requirements-completed:
  - FIN-01
  - FIN-05

coverage:
  - id: D1
    description: "useTransacoes(year, month) — TanStack Query hook with queryKey ['transacoes', year, month], staleTime 0, retry false"
    requirement: FIN-01
    verification:
      - kind: unit
        ref: "src/hooks/useTransacoesSummary.test.ts (via vi.mock — useTransacoes called internally)"
        status: pass
    human_judgment: false
  - id: D2
    description: "useTransacoesSummary aggregates entradas/saidas/saldo/lucro from Transacao[] — all 4 test cases GREEN"
    requirement: FIN-05
    verification:
      - kind: unit
        ref: "src/hooks/useTransacoesSummary.test.ts#with 2 entradas (500, 300) and 1 saida (200)"
        status: pass
      - kind: unit
        ref: "src/hooks/useTransacoesSummary.test.ts#with no transactions: entradas=0, saidas=0, saldo=0"
        status: pass
      - kind: unit
        ref: "src/hooks/useTransacoesSummary.test.ts#with saidas > entradas: saldo is negative"
        status: pass
      - kind: unit
        ref: "src/hooks/useTransacoesSummary.test.ts#isLoading is forwarded from useTransacoes mock"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-06-30
status: complete
---

# Phase 03 Plan 04: useTransacoes + useTransacoesSummary Hooks Summary

**TanStack Query data layer for monthly transaction metrics — useTransacoes with staleTime 0 (D-20) and useTransacoesSummary with centavos aggregation (D-10), 30/30 tests GREEN**

## Performance

- **Duration:** 8 min
- **Started:** 2026-06-30T12:41:15Z
- **Completed:** 2026-06-30T12:49:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `useTransacoes(year, month)` wraps `transacaoService.getByMonth` with queryKey `['transacoes', year, month]`, staleTime 0 (always fresh, D-20), and retry false — matches the project hook pattern from `useOnboardingCnpj`
- `useTransacoesSummary(year, month)` composes `useTransacoes` internally and reduces `Transacao[]` into `{ entradas, saidas, saldo, lucro }` — saldo can be negative, lucro is alias of saldo (D-10 MEI terminology)
- All 4 test cases in `useTransacoesSummary.test.ts` GREEN; 30/30 tests pass across `src/services/` + `src/hooks/`; `npx tsc --noEmit` passes

## Task Commits

Each task was committed atomically:

1. **Task 1: useTransacoes hook** — `9274a88` (feat)
2. **Task 2: useTransacoesSummary hook + tests GREEN** — `0853c7d` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/hooks/useTransacoes.ts` — TanStack Query hook: queryKey, staleTime 0, retry false
- `src/hooks/useTransacoesSummary.ts` — Aggregation hook: TransacoesSummary interface + reduce logic

## Decisions Made

- staleTime 0 on `useTransacoes` — per D-20, always refetch on mount (guaranteed fresh data, acceptable at MVP scale)
- `useTransacoesSummary` composes `useTransacoes` internally rather than issuing a separate Supabase query — single data fetch, TanStack Query deduplicates when both hooks call `useTransacoes(year, month)` with same args
- lucro is numeric alias of saldo (same integer value) — MEI accounting concept per D-10
- `data: undefined` guard via `data: transacoes = []` default — handles isLoading=true state where data is not yet available

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 05 (TransactionSheet) has the data layer it needs: `useTransacoes` for list display, `queryClient.invalidateQueries(['transacoes'])` for cache invalidation after mutations
- Plan 06 (InicioTab + FinancasTab) can now use `useTransacoesSummary` for 4-card metrics panel (D-10/D-11) and `useTransacoes` for transaction list with month navigator (D-12 through D-17)
- TanStack Query deduplication: if both InicioTab and FinancasTab call `useTransacoes(year, month)` with the same args, only one network request fires

---
*Phase: 03-controle-financeiro-core*
*Completed: 2026-06-30*
