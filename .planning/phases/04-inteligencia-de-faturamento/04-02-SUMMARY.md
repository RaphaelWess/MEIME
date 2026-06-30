---
phase: 04-inteligencia-de-faturamento
plan: "02"
subsystem: faturamento-core
tags: [tdd, green-phase, faturamento, pure-functions, service-layer]
dependency_graph:
  requires:
    - src/utils/faturamento.test.ts (Plan 04-01)
    - src/services/transacao.service.test.ts getByYear describe (Plan 04-01)
  provides:
    - src/utils/faturamento.ts
    - src/services/transacao.service.ts (getByYear method)
  affects:
    - src/hooks/useFaturamento.ts (Plan 04-03 will import these)
tech_stack:
  added: []
  patterns:
    - UTC date parsing for timezone-safe proportional limit calculation (getUTCFullYear/getUTCMonth)
    - Math.round() for float-safe centavo arithmetic
    - Double .order() on getByYear (data + created_at ascending) matching getByMonth pattern
    - Injectable today: Date parameter for deterministic calcProjecao tests
decisions:
  - "D-06 applied: getUTCFullYear/getUTCMonth avoids timezone offset on data_abertura_mei parsing"
  - "D-10 hierarchy: THRESHOLD_DESENQUADRAMENTO check first in calcAlertaAtivo (most severe)"
  - "D-15 calcProjecao returns hidden for mesesDecorridos < 1 (January) and for zero media"
  - "getByYear uses double .order(data, created_at ascending) to match test chain expectation"
key_files:
  created:
    - src/utils/faturamento.ts
  modified:
    - src/services/transacao.service.ts (getByYear method added after getByMonth)
    - src/services/transacao.service.test.ts (fixed pre-existing create test failures)
metrics:
  duration: 6min
  completed: "2026-06-30"
status: complete
---

# Phase 04 Plan 02: Faturamento Pure Functions + getByYear Service Method

**One-liner:** Five pure calculation functions and the getByYear service method implemented in integer centavos with UTC timezone safety — all 27 target tests GREEN (22 faturamento + 5 getByYear).

---

## Artifacts Produced

| Symbol | File | Kind |
|--------|------|------|
| `LIMITE_MEI_PADRAO` | `src/utils/faturamento.ts` | exported constant — 8_100_000 centavos |
| `LIMITE_CAMINHONEIRO` | `src/utils/faturamento.ts` | exported constant — 25_160_000 centavos |
| `THRESHOLD_DESENQUADRAMENTO` | `src/utils/faturamento.ts` | exported constant — 9_720_000 centavos |
| `ProjecaoResult` | `src/utils/faturamento.ts` | exported discriminated union type |
| `AlertaNivel` | `src/utils/faturamento.ts` | exported union literal type (70 \| 90 \| 100 \| 97200) |
| `calcLimiteAnual` | `src/utils/faturamento.ts` | exported pure function |
| `calcTotalFaturado` | `src/utils/faturamento.ts` | exported pure function |
| `calcPercentual` | `src/utils/faturamento.ts` | exported pure function |
| `calcProjecao` | `src/utils/faturamento.ts` | exported pure function (injectable today: Date) |
| `calcAlertaAtivo` | `src/utils/faturamento.ts` | exported pure function |
| `transacaoService.getByYear` | `src/services/transacao.service.ts` | added method (after getByMonth) |

---

## GREEN Confirmation

| Test File | Tests | Result |
|-----------|-------|--------|
| `src/utils/faturamento.test.ts` | 22 | ALL GREEN (exits 0) |
| `src/services/transacao.service.test.ts` | 13 | ALL GREEN (exits 0) — includes 5 getByYear + 8 pre-existing |
| Full suite (`npx vitest run`) | 92 | ALL GREEN across 12 test files |

`src/hooks/useFaturamento.test.ts` remains RED (expected — hook created in Plan 04-03).

---

## Implementation Notes

### calcLimiteAnual — UTC timezone safety
Uses `getUTCFullYear()` and `getUTCMonth()` on `new Date(empresa.data_abertura_mei)` per D-06 (Pitfall 1). A date string like `'2026-07-01'` parsed with `getFullYear()`/`getMonth()` can report June 30 in UTC-3 timezone. UTC methods are unambiguous.

### calcProjecao — pure arithmetic month projection
Instead of using `new Date(year, today.getMonth() + n, 1)` (which requires a Date constructor call and potential month/year rollover), the implementation uses pure arithmetic:
- `targetMonth0 = today.getMonth() + mesesParaEstourar`
- `targetYear = currentYear + Math.floor(targetMonth0 / 12)`
- `targetMonth = (targetMonth0 % 12) + 1`

### getByYear — double .order() call
The test's `buildGetByYearChain` mock structure requires two `.order()` calls to resolve the Promise chain. Added `.order('created_at', { ascending: true })` as secondary sort (matching `getByMonth`'s pattern of ordering by both date and created_at for deterministic ordering within the same day).

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed pre-existing create test failures in transacao.service.test.ts**
- **Found during:** Task 2 verification (test suite run after adding getByYear)
- **Issue:** `transacaoService.create` tests were failing since commit 9465f28 (Phase 3) which added `supabase.auth.getUser()` to the create method but did not update the test mock to include `supabase.auth`. The test also asserted `chain.insert.toHaveBeenCalledWith(validInput)` but the service now spreads `user_id` into the insert call.
- **Fix:** Added `auth: { getUser: vi.fn() }` to the `vi.mock` factory; added `mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-uuid' } } })` to each create test; updated the insert assertion to `{ ...validInput, user_id: 'user-uuid' }`.
- **Files modified:** `src/services/transacao.service.test.ts`
- **Commits:** ab44038

**2. [Rule 2 - Missing behavior] Added second .order() call to getByYear**
- **Found during:** Task 2 — test chain mock structure `buildGetByYearChain` requires two `.order()` calls to resolve the Promise. With a single `.order()`, the mock returned `innerChain` (a plain object), which when awaited gave `undefined` data.
- **Fix:** Added `.order('created_at', { ascending: true })` as a secondary sort, consistent with `getByMonth` pattern (which also uses two order calls).
- **Files modified:** `src/services/transacao.service.ts`
- **Commits:** ab44038

---

## Commit

| Hash | Message | Files |
|------|---------|-------|
| ab44038 | feat(04): faturamento pure functions + getByYear service method | src/utils/faturamento.ts, src/services/transacao.service.ts, src/services/transacao.service.test.ts |

---

## Self-Check: PASSED

- [x] `src/utils/faturamento.ts` exists
- [x] `grep -c "getUTCFullYear" src/utils/faturamento.ts` = 2 (>= 1)
- [x] `grep -c "Math.round" src/utils/faturamento.ts` = 3 (>= 1)
- [x] `grep -c "getByYear" src/services/transacao.service.ts` = 1
- [x] `grep -c "Ano inválido" src/services/transacao.service.ts` = 1
- [x] `grep -c "tipo.*entrada" src/services/transacao.service.ts` >= 1
- [x] Commit ab44038 exists
- [x] `npx vitest run src/utils/faturamento.test.ts` exits 0 (22 tests GREEN)
- [x] `npx vitest run src/services/transacao.service.test.ts` exits 0 (13 tests GREEN)
- [x] `npx vitest run` — 92 tests GREEN across 12 files (useFaturamento intentionally RED)
