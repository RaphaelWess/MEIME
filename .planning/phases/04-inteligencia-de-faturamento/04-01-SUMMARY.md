---
phase: 04-inteligencia-de-faturamento
plan: "01"
subsystem: faturamento-tdd-red
tags: [tdd, tests, red-phase, faturamento, gauge]
dependency_graph:
  requires: []
  provides:
    - src/utils/faturamento.test.ts
    - src/services/transacao.service.test.ts (getByYear describe block)
    - src/hooks/useFaturamento.test.ts
  affects: []
tech_stack:
  added: []
  patterns:
    - buildGetByYearChain fluent mock helper (extends buildChain)
    - injectable today parameter for calcProjecao deterministic testing
key_files:
  created:
    - src/utils/faturamento.test.ts
    - src/hooks/useFaturamento.test.ts
  modified:
    - src/services/transacao.service.test.ts
decisions: []
metrics:
  duration: 10min
  completed: "2026-06-30"
status: complete
---

# Phase 04 Plan 01: TDD Red Phase — Failing Tests for Faturamento Summary

**One-liner:** Three failing test files establish acceptance gates for calcLimiteAnual, calcTotalFaturado, calcPercentual, calcProjecao, calcAlertaAtivo, getByYear, and useFaturamento — all RED because implementation modules do not exist yet.

---

## Artifacts Produced

| Symbol | File | Kind | Test Count | RED Reason |
|--------|------|------|------------|------------|
| faturamento.test.ts | `src/utils/faturamento.test.ts` | test file (new) | 22 cases | Import error: `@/utils/faturamento` does not exist |
| transacao.service.test.ts | `src/services/transacao.service.test.ts` | test file (appended) | 5 new cases | TypeError: `transacaoService.getByYear is not a function` |
| useFaturamento.test.ts | `src/hooks/useFaturamento.test.ts` | test file (new) | 3 cases | Import error: `@/hooks/useFaturamento` does not exist |

---

## RED Confirmation

| Test File | Exit Code | Failure Reason |
|-----------|-----------|----------------|
| `src/utils/faturamento.test.ts` | non-zero | `Failed to resolve import "@/utils/faturamento"` |
| `src/services/transacao.service.test.ts` | non-zero | 8 failed, 5 passed — getByYear: `is not a function` |
| `src/hooks/useFaturamento.test.ts` | non-zero | `Failed to resolve import "@/hooks/useFaturamento"` |

All three files exit non-zero. Wave 0 RED phase confirmed.

---

## Test Coverage Map

### faturamento.test.ts (22 cases)

| Function | Cases | Requirements |
|----------|-------|--------------|
| calcLimiteAnual | 6 | FAT-01 (proportional limit, Caminhoneiro, null empresa) |
| calcTotalFaturado | 2 | FAT-01 (sum of entradas) |
| calcPercentual | 4 | FAT-01 (0%, 50%, 100%, >100%) |
| calcProjecao | 5 | FAT-02 (hidden, dentro_do_limite, mes_ano, already exceeded) |
| calcAlertaAtivo | 5 | FAT-03 (97200, 100, 90, 70, null) |

### transacao.service.test.ts (5 new cases in getByYear describe)

| Case | Requirements |
|------|--------------|
| returns array of entrada transactions | FAT-01 |
| returns empty array for null data | FAT-01 |
| throws on Supabase error | V5 security |
| throws for year < 2020 | V5 security (year validation) |
| throws for year > 2050 | V5 security (year validation) |

### useFaturamento.test.ts (3 cases)

| Case | Requirements |
|------|--------------|
| empresa null → isLoading=true | FAT-01 (guard for null empresa) |
| queryKey[0] = 'transacoes' | D-21 (invalidateQueries namespace) |
| limiteAnual = 8_100_000 for standard MEI | FAT-01 |

---

## Commit

| Hash | Message |
|------|---------|
| ae5205b | test(04): TDD red phase — failing tests for faturamento, getByYear, useFaturamento |

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Self-Check: PASSED

- [x] `src/utils/faturamento.test.ts` exists
- [x] `src/hooks/useFaturamento.test.ts` exists
- [x] `src/services/transacao.service.test.ts` contains `describe('transacaoService.getByYear')`
- [x] Commit ae5205b exists
- [x] All three test files exit non-zero (RED phase confirmed)
- [x] Existing getByMonth/create/update/delete tests unaffected (5 still passing)
