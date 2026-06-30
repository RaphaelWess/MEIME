---
phase: "03-controle-financeiro-core"
plan: "03"
subsystem: "hooks/stores"
tags: ["currency-input", "zustand", "push-right", "ios-safari-fix", "month-navigator"]
dependency_graph:
  requires:
    - "03-01 (Drawer, Skeleton, TDD stubs)"
    - "03-02 (transacao.service.ts — Transacao type)"
  provides:
    - "useCurrencyInput — consumed by TransactionSheet (Plan 05)"
    - "useFinancasStore — consumed by AppShell, FinancasTab, InicioTab (Plans 05-06)"
    - "prevMonth, nextMonth, MONTHS_PT — consumed by FinancasTab (Plan 06)"
  affects:
    - "src/hooks/useCurrencyInput.ts"
    - "src/stores/financas.store.ts"
tech_stack:
  added: []
  patterns:
    - "push-right centavos state machine via /\\D/g strip + parseInt"
    - "Zustand create() with module-level new Date() (Pitfall 6 prevention)"
    - "useCallback [] deps for stable handleChange and reset references"
key_files:
  created:
    - "src/hooks/useCurrencyInput.ts"
    - "src/stores/financas.store.ts"
  modified: []
decisions:
  - "new Date() called at module level outside create() — ensures single evaluation at import time (Pitfall 6)"
  - "handleChange uses useCallback([]) — stable reference; no re-creation per render"
  - "setCents exposed in return value — edit mode pre-fill without additional API"
  - "MONTHS_PT uses 'Marco' (not 'Março') — avoids BOM/encoding issues in ASCII environments"
metrics:
  duration: "10min"
  completed: "2026-06-30"
  tasks_completed: 2
  files_created: 2
status: complete
---

# Phase 03 Plan 03: Push-Right Currency Hook + Financas Store Summary

**One-liner:** Push-right BRL centavos hook with iOS Safari safety + Zustand UI state store for month navigator and bottom-sheet open/close.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create useCurrencyInput.ts — push-right BRL hook | 19e08d3 | src/hooks/useCurrencyInput.ts |
| 2 | Create financas.store.ts — Zustand UI state | 8e932dd | src/stores/financas.store.ts |

## What Was Built

### Task 1: useCurrencyInput.ts

Push-right currency input hook that solves the iOS Safari decimal comma bug (Phase 3 critical requirement, ROADMAP success criteria #1).

**Core behavior:**
- Stores value as integer `cents` (never float — D-09)
- `displayValue` is derived synchronously via `centsToBRL(cents)`
- `handleChange` strips all non-digits via `.replace(/\D/g, '')` — handles iOS Safari backspace naturally (idempotent: "R$ 12,34" → strip → "1234" → parseInt → 1234)
- Guard: `newCents > 999_999_999` returns early — prevents absurd values (T-03-02)
- `reset()` and `setCents` exposed for edit mode pre-fill in TransactionSheet

**All 5 tests GREEN:**
```
✓ initialCents=0 yields displayValue containing "R$" and "0,00"
✓ handleChange with e.target.value="1234" sets cents=1234 and displayValue contains "12,34"
✓ handleChange with e.target.value="" sets cents=0
✓ handleChange with value > 999999999 centavos leaves cents unchanged (guard fires)
✓ reset() sets cents=0
```

### Task 2: financas.store.ts

Zustand UI state store for month navigator and bottom-sheet open/close (D-01, D-05, D-16).

**Exports:**
- `useFinancasStore` — selectedYear, selectedMonth, sheetOpen, editingTransaction + setSelectedMonth, openSheet, closeSheet
- `prevMonth(year, month)` — pure utility, wraps month 1 → December of previous year
- `nextMonth(year, month)` — pure utility, wraps month 12 → January of next year
- `MONTHS_PT` — 12-element string array of Portuguese month names (1-indexed via `month - 1`)

**Critical implementation detail:** `const now = new Date()` is called at module level (line 9, outside `create()`). This ensures a single evaluation at import time — not per-render, not per-setter call (Pitfall 6 prevention).

## Verification

- `npx vitest run src/hooks/useCurrencyInput.test.ts` — 5/5 tests GREEN
- `npx vitest run src/stores/ src/hooks/useCurrencyInput.test.ts src/services/ src/utils/` — 47/47 tests GREEN
- No `type="number"` in useCurrencyInput.ts — only `type="text"` mentioned in comments
- `new Date()` called outside `create()` — confirmed at module level

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — both files are complete implementations with no placeholder values or hardcoded stubs.

## Threat Flags

No new security surface beyond what the plan's threat model already covers:
- T-03-02 (Tampering — useCurrencyInput.handleChange): mitigated by `newCents > 999_999_999` guard
- T-03-W3-01 (Tampering — editingTransaction): accepted per plan (editingTransaction holds RLS-filtered server data)

## Self-Check: PASSED

- [x] `src/hooks/useCurrencyInput.ts` exists and exports useCurrencyInput
- [x] `src/stores/financas.store.ts` exists and exports useFinancasStore, prevMonth, nextMonth, MONTHS_PT
- [x] Commit 19e08d3 exists (Task 1)
- [x] Commit 8e932dd exists (Task 2)
- [x] 5/5 useCurrencyInput tests GREEN
- [x] 47/47 tests GREEN for in-scope files
