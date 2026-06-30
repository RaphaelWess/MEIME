---
phase: "03"
plan: "02"
subsystem: controle-financeiro-core
status: complete
tags:
  - service-layer
  - categories
  - supabase
  - security-validation
  - tdd
dependency_graph:
  requires:
    - "03-01"  # useCurrencyInput hook (provides Transacao interface reference)
  provides:
    - "src/utils/categories.ts"
    - "src/services/transacao.service.ts"
  affects:
    - "03-03"  # financas.store.ts (depends on transacaoService)
    - "03-04"  # useTransacoes hook (depends on transacaoService)
    - "03-05"  # TransactionSheet (depends on transacaoService + Categoria type)
    - "03-06"  # InicioTab/FinancasTab (depends on transacaoService via hooks)
tech_stack:
  added:
    - "src/utils/categories.ts (pure constants, no deps)"
    - "src/services/transacao.service.ts (Supabase CRUD, security validation)"
  patterns:
    - "Service layer purity (D-08): no try/catch, if (error) throw error"
    - "INTEGER centavos validation (D-09): valor > 0 && valor <= 999_999_999"
    - "RLS user isolation (T-03-01): no user_id filter in queries"
    - "Fluent mock chain builder for double .order() in tests"
key_files:
  created:
    - "src/utils/categories.ts"
    - "src/services/transacao.service.ts"
  modified:
    - "src/services/transacao.service.test.ts (fixed getByMonth mock chain for double .order())"
decisions:
  - "D-09: CATEGORIAS_ENTRADA has 3 items, CATEGORIAS_SAIDA has 8 items, TODAS_CATEGORIAS union of 11"
  - "D-08: service layer uses if (error) throw error — never try/catch; errors bubble to TanStack Query"
  - "T-03-01: RLS enforces user isolation server-side; no user_id filter added to getByMonth queries"
  - "Test deviation: fixed pre-existing test's double .order() mock chain (built buildGetByMonthChain helper)"
metrics:
  duration: "15min"
  completed: "2026-06-30"
  tasks_completed: 2
  files_created: 2
  files_modified: 1
---

# Phase 03 Plan 02: Categories + Transaction Service Summary

**One-liner:** Predefined MEI category constants and Supabase CRUD service with T-02/T-03/T-05 security validation — 8/8 tests GREEN.

## What Was Built

### Task 1: src/utils/categories.ts

Pure constants file following the `currency.ts` pattern (no imports, `as const`, named exports).

Exports:
- `CATEGORIAS_ENTRADA` — 3-item readonly tuple: `'Servicos Prestados'`, `'Venda de Produtos'`, `'Outros'`
- `CATEGORIAS_SAIDA` — 8-item readonly tuple: `'Materiais e Suprimentos'`, `'Transporte'`, `'Alimentacao'`, `'Software e Assinaturas'`, `'Impostos e DAS'`, `'Marketing e Publicidade'`, `'Equipamentos'`, `'Outros'`
- `TODAS_CATEGORIAS` — spread union of both arrays, 11 items total
- `Categoria` — TypeScript union type from `typeof TODAS_CATEGORIAS[number]`

JSDoc references D-09 and documents that this is the single source of truth for category strings.

### Task 2: src/services/transacao.service.ts + test GREEN

Service file following the `empresa.service.ts` pattern exactly: single `supabase` import, exported interface, exported type aliases, const object with async methods, `if (error) throw error` error handling.

**Transacao interface:** `id`, `user_id`, `tipo` (`'entrada' | 'saida'`), `valor` (number — INTEGER centavos), `categoria`, `descricao`, `tipo_pessoa` (`'PF' | 'PJ' | null`), `data` (YYYY-MM-DD), `created_at`.

**Security validations (before Supabase calls):**
- `create`: throws `'Valor invalido'` if `valor <= 0` or `valor > 999_999_999` (T-02)
- `create`: throws `'Tipo invalido'` if `tipo` not in `['entrada', 'saida']` (T-03)
- `create`: throws `'Tipo de pessoa invalido'` if `tipo_pessoa` not in `['PF', 'PJ', null, undefined]` (T-03)
- `create`: throws `'Data invalida'` if `data` doesn't match `/^\d{4}-\d{2}-\d{2}$/` (T-05)
- `update`: throws `'Valor invalido'` if `patch.valor` is defined and out of range (T-02)

**Methods:**
- `getByMonth(year, month)`: date range query with `.gte/.lte`, double `.order()` (date desc, created_at desc). Returns `data ?? []`.
- `create(input)`: validates → `.insert(input).select().single()` → returns `Transacao`
- `update(id, patch)`: validates valor if present → `.update(patch).eq('id', id).select().single()` → returns `Transacao`
- `delete(id)`: `.delete().eq('id', id)` → returns `void`

## Test Results

```
npx vitest run src/services/transacao.service.test.ts

 ✓ transacaoService.getByMonth > calls supabase.from("transacoes").select("*").gte.lte and returns array
 ✓ transacaoService.getByMonth > returns [] when supabase returns null data
 ✓ transacaoService.getByMonth > throws when supabase returns error
 ✓ transacaoService.create > calls supabase.from("transacoes").insert(input).select().single() and returns row
 ✓ transacaoService.create > create with tipo_pessoa="PF" is accepted
 ✓ transacaoService.create > create with tipo_pessoa="PJ" is accepted
 ✓ transacaoService.update > calls supabase.from("transacoes").update(patch).eq("id", id).select().single()
 ✓ transacaoService.delete > calls supabase.from("transacoes").delete().eq("id", id)

 Tests: 8 passed (8) — EXIT 0
```

## Commits

| Hash | Message |
|------|---------|
| 7c943f7 | feat(03-02): create categories.ts — predefined MEI category lists (D-09) |
| a09ed3b | feat(03-02): create transacao.service.ts — Supabase CRUD with security validation |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed getByMonth mock chain for double .order() call**
- **Found during:** Task 2 — first vitest run
- **Issue:** The pre-existing test stubs in `transacao.service.test.ts` had a broken mock chain for `getByMonth`. The service calls `.order('data', ...)` then `.order('created_at', ...)` (two sequential `.order()` calls), but the test's `finalChain.order.mockResolvedValue(...)` made the FIRST `.order()` call resolve immediately — so the second `.order()` had no method to call (`order is not a function`).
- **Fix:** Added `buildGetByMonthChain(resolvedValue)` helper inside `describe('transacaoService.getByMonth')` that correctly models the two-layer chain: `innerChain.order` resolves, `middleChain.order` returns `innerChain`, `outerChain.lte` returns `middleChain`. All 3 `getByMonth` tests now pass.
- **Files modified:** `src/services/transacao.service.test.ts`
- **Note:** The pre-existing test was written as a RED stub in Plan 01 with an acknowledged complex mock pattern — the fix makes it correctly GREEN rather than changing the behavior being tested.

## Verification

- [x] `src/utils/categories.ts` exports CATEGORIAS_ENTRADA (3), CATEGORIAS_SAIDA (8), TODAS_CATEGORIAS (11), Categoria
- [x] First item of CATEGORIAS_ENTRADA is `'Servicos Prestados'`
- [x] First item of CATEGORIAS_SAIDA is `'Materiais e Suprimentos'`
- [x] `src/services/transacao.service.ts` exports Transacao, CreateTransacaoInput, UpdateTransacaoInput, transacaoService
- [x] transacaoService has methods: getByMonth, create, update, delete
- [x] create() throws security errors for invalid valor, tipo, tipo_pessoa, data
- [x] No @radix-ui imports in any new file
- [x] No try/catch in service layer
- [x] `npx vitest run src/services/transacao.service.test.ts` exits 0 (8/8 GREEN)
- [x] `npx tsc --noEmit` exits 0 (clean)

## Known Stubs

None — all exports are complete implementations with real data.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes introduced. The service layer reads the existing `transacoes` table (already in schema) through the established Supabase RLS boundary. No new threat surface beyond what was planned.

## Self-Check: PASSED

- src/utils/categories.ts: FOUND
- src/services/transacao.service.ts: FOUND
- Commit 7c943f7: FOUND (feat(03-02): create categories.ts)
- Commit a09ed3b: FOUND (feat(03-02): create transacao.service.ts)
- vitest exits 0: VERIFIED (8/8 tests pass)
- tsc --noEmit exits 0: VERIFIED (clean)
