---
phase: 03-controle-financeiro-core
plan: 01
subsystem: ui, testing
tags: [shadcn, vaul, drawer, skeleton, vitest, tdd, currency-input, supabase-mock]

# Dependency graph
requires:
  - phase: 02-onboarding-mei
    provides: empresaService pattern, Supabase mock pattern, useQuery hook pattern
provides:
  - src/components/ui/drawer.tsx — Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose, DrawerOverlay, DrawerPortal, DrawerTrigger
  - src/components/ui/skeleton.tsx — Skeleton with animate-pulse
  - src/hooks/useCurrencyInput.test.ts — RED test stubs for push-right currency input hook (5 cases)
  - src/services/transacao.service.test.ts — RED test stubs for transacaoService CRUD (8 cases)
  - src/hooks/useTransacoesSummary.test.ts — RED test stubs for entradas/saidas/saldo aggregation (4 cases)
affects: [03-02-service-layer, 03-03-currency-input, 03-04-summary-hook, 03-05-transaction-sheet, 03-06-financas-ui]

# Tech tracking
tech-stack:
  added: [vaul (Drawer primitive via shadcn CLI)]
  patterns: [TDD Red phase — test files import non-existent modules to establish behavioral contracts before implementation]

key-files:
  created:
    - src/components/ui/drawer.tsx
    - src/components/ui/skeleton.tsx
    - src/hooks/useCurrencyInput.test.ts
    - src/services/transacao.service.test.ts
    - src/hooks/useTransacoesSummary.test.ts
  modified:
    - package.json (vaul added)
    - package-lock.json

key-decisions:
  - "shadcn CLI with base-nova style installed Drawer via vaul (not @base-ui/react) — no @radix-ui direct imports in drawer.tsx; vaul is the correct shadcn base-nova Drawer primitive"
  - "TDD Red phase: all three test stubs fail with module-not-found — confirms modules do not exist and tests will be the acceptance gate for Wave 1/2 plans"
  - "transacao.service.test.ts extends empresa.service.test.ts buildChain pattern with insert, update, delete, eq, gte, lte, order, single methods"
  - "useTransacoesSummary.test.ts uses vi.mock('./useTransacoes') to avoid TanStack Query provider wrapper"

patterns-established:
  - "TDD Red: test files import modules that do not exist yet — vitest reports FAIL not ERROR for unresolved imports"
  - "Supabase fluent chain mock: buildChain() with all methods returning chain; terminal method resolves with { data, error }"

requirements-completed: [FIN-01, FIN-02, FIN-05]

coverage:
  - id: D1
    description: "Drawer component installed — exports Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose with no @radix-ui imports"
    requirement: FIN-01
    verification:
      - kind: other
        ref: "node -e validation: drawer.tsx OK (no @radix-ui, DrawerContent present)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Skeleton component installed — exports Skeleton with animate-pulse"
    requirement: FIN-05
    verification:
      - kind: other
        ref: "node -e validation: skeleton.tsx OK (animate-pulse present)"
        status: pass
    human_judgment: false
  - id: D3
    description: "useCurrencyInput.test.ts written with 5 RED failing test cases for push-right behavior"
    requirement: FIN-01
    verification:
      - kind: unit
        ref: "src/hooks/useCurrencyInput.test.ts — fails with module-not-found (RED confirmed)"
        status: fail
    human_judgment: false
  - id: D4
    description: "transacao.service.test.ts written with 8 RED failing test cases for CRUD operations"
    requirement: FIN-02
    verification:
      - kind: unit
        ref: "src/services/transacao.service.test.ts — fails with module-not-found (RED confirmed)"
        status: fail
    human_judgment: false
  - id: D5
    description: "useTransacoesSummary.test.ts written with 4 RED failing test cases for aggregation"
    requirement: FIN-05
    verification:
      - kind: unit
        ref: "src/hooks/useTransacoesSummary.test.ts — fails with module-not-found (RED confirmed)"
        status: fail
    human_judgment: false

# Metrics
duration: 15min
completed: 2026-06-30
status: complete
---

# Phase 03 Plan 01: Wave 0 Infrastructure Summary

**shadcn Drawer (vaul-based) and Skeleton components installed, plus 17 RED TDD test stubs establishing behavioral contracts for push-right currency input, transacao CRUD, and summary aggregation**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-06-30T12:20:00Z
- **Completed:** 2026-06-30T12:35:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Installed `src/components/ui/drawer.tsx` via `npx shadcn add drawer` — exports Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose; no @radix-ui direct imports; vaul-based slide-up from bottom
- Installed `src/components/ui/skeleton.tsx` via `npx shadcn add skeleton` — exports Skeleton with `animate-pulse` and bg-muted
- Wrote 5 failing test cases in `useCurrencyInput.test.ts` covering push-right behavior: initial display, digit entry, empty clear, overflow guard, reset
- Wrote 8 failing test cases in `transacao.service.test.ts` using empresa.service.test.ts Supabase mock pattern extended with insert/update/delete/eq/gte/lte/order/single chain
- Wrote 4 failing test cases in `useTransacoesSummary.test.ts` using `vi.mock('./useTransacoes')` to avoid TanStack Query provider
- All three test files confirmed RED (exit code 1) — modules do not exist yet, tests will be acceptance gates for Plans 02–04

## Task Commits

1. **Task 1: Install shadcn Drawer and Skeleton components** - `37e5574` (chore)
2. **Task 2: Write failing TDD Red stubs** - `c5d8cf6` (test)

## Files Created/Modified

- `src/components/ui/drawer.tsx` — Drawer wrapper over vaul (bottom-anchored slide), all 7 named exports
- `src/components/ui/skeleton.tsx` — Skeleton with animate-pulse + bg-muted
- `src/hooks/useCurrencyInput.test.ts` — RED tests for push-right hook (FIN-01)
- `src/services/transacao.service.test.ts` — RED tests for CRUD service (FIN-01, FIN-02)
- `src/hooks/useTransacoesSummary.test.ts` — RED tests for summary aggregation (FIN-05)
- `package.json` — vaul dependency added
- `package-lock.json` — updated

## Decisions Made

- **vaul vs @base-ui/react for Drawer:** The shadcn CLI with `base-nova` style installed Drawer via `vaul` rather than `@base-ui/react`. The plan's prohibition was specifically "no @radix-ui imports" — `drawer.tsx` imports from `vaul` directly, not `@radix-ui/*`. Accepted: vaul is the actual primitive shadcn uses for its base-nova Drawer; the generated file is correct and TypeScript compiles cleanly.
- **useTransacoesSummary mock strategy:** Used `vi.mock('./useTransacoes')` to keep the test file simple, avoiding TanStack Query provider setup. Matches the plan's specified approach.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] shadcn CLI installed Drawer via vaul, not @base-ui/react**
- **Found during:** Task 1 (Install shadcn Drawer)
- **Issue:** RESEARCH.md expected the CLI to generate a drawer wrapping `@base-ui/react/drawer`. The CLI instead generated a drawer wrapping `vaul` (which is what shadcn's base-nova style actually uses for Drawer).
- **Fix:** Verified the generated `drawer.tsx` has no `@radix-ui/*` imports (plan's actual requirement). Accepted the vaul-based implementation as it passes the plan's stated verification check. TypeScript compiles cleanly. No manual fallback needed — the CLI output is correct.
- **Files modified:** `src/components/ui/drawer.tsx`
- **Verification:** `node -e` check passes ("drawer.tsx OK"), `npx tsc --noEmit` exits 0
- **Committed in:** `37e5574` (Task 1 commit)

---

**Total deviations:** 1 (discovery that vaul is the actual shadcn base-nova Drawer primitive — implementation is correct, RESEARCH.md assumption A1 was wrong about which primitive the CLI uses)
**Impact on plan:** No scope change. The Drawer still provides all required exports. Future plans importing from `@/components/ui/drawer` will work correctly.

## Issues Encountered

- None beyond the vaul discovery documented above.

## Known Stubs

None — this plan delivers test files and UI components, not wired data flows.

## Threat Surface Scan

No new network endpoints, auth paths, or schema changes introduced. The `drawer.tsx` and `skeleton.tsx` are pure UI components with no data fetching. The test files import non-existent modules (expected for RED phase). No threat flags.

## Next Phase Readiness

- Wave 0 complete — all blocking gates passed
- Plans 02–04 (Wave 1) can now proceed in parallel: service layer, currency input hook, summary hook
- Plan 05 (Wave 2) is unblocked once Wave 1 completes: TransactionSheet can import from drawer.tsx
- RED test failures are the acceptance criteria for Wave 1 plans (Plans 02–04 must make them GREEN)

---
*Phase: 03-controle-financeiro-core*
*Completed: 2026-06-30*
