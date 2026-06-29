---
plan: 02-04
phase: 02-onboarding-mei
status: complete
wave: 4
started: 2026-06-29
completed: 2026-06-29
commits:
  - 457ceb3
  - 1c6ba35
key-files:
  created:
    - src/pages/EmpresaEditPage.tsx
  modified:
    - src/pages/ContaTab.tsx
    - src/App.tsx
decisions:
  - Read-only CNPJ and razão social on edit page — Receita Federal data is immutable post-onboarding
  - Empresa data sourced entirely from useEmpresaStore() — never fetches Supabase directly
  - /app/conta/empresa registered as sibling of /app/conta (not nested child) to keep URL flat
  - Defensive null guard on empresa in ContaTab — ProtectedRoute guarantees it exists in practice
  - Date rendered via toLocaleDateString('pt-BR') with explicit T00:00:00 to avoid UTC offset shift
tags:
  - empresa
  - edit
  - conta
  - routing
---

# Phase 02 Plan 04: ContaTab Empresa Section + EmpresaEditPage Summary

**One-liner:** Empresa profile display in ContaTab + full edit form at /app/conta/empresa using Zustand store as sole data source.

## What Was Built

### Task 1: EmpresaEditPage (`src/pages/EmpresaEditPage.tsx`)

Page inside the /app shell (has BottomNav via AppShell/Outlet) at route `/app/conta/empresa`.

- CNPJ field: read-only, formatted via `formatCnpj()`
- Razão social: read-only (Receita Federal data)
- Atividade principal: editable text input, pre-filled from store
- Data de abertura do MEI: editable `type="date"` input, pre-filled from store
- Is caminhoneiro: checkbox, pre-filled from store
- Save button: disabled when `atividade_principal.trim()` is empty or while saving
- On save: calls `empresaService.save()` with full payload, updates Zustand store via `setEmpresa()`, shows inline "Dados salvos" success message
- On error: shows inline error message
- Back button navigates to `/app/conta`

### Task 2: ContaTab updates + route registration

**ContaTab (`src/pages/ContaTab.tsx`):**

Added "Minha empresa" section above the privacy link:
- Shows razão social, formatted CNPJ, atividade principal (if set), data de abertura (if set, formatted pt-BR)
- "Editar dados da empresa" button navigates to `/app/conta/empresa`
- Defensive null guard: section hidden if empresa is null (ProtectedRoute guarantees it exists in practice)
- All existing content (logout, AlertDialog, privacy link, Zona de Perigo) preserved unchanged

**App.tsx:**
- Imported `EmpresaEditPage`
- Registered `<Route path="conta/empresa" element={<EmpresaEditPage />} />` as a sibling of `/app/conta` inside the `/app` block

## Verification

- `npm run build` — exits 0, no TypeScript or bundle errors
- `npm test -- --run` — 48/48 tests pass (no regressions)

## Deviations from Plan

None — plan executed exactly as written.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced. All Supabase access goes through the existing `empresaService.save()` path.

## Known Stubs

None — all fields are wired to real store data. The edit form reads from and writes to the Supabase-backed Zustand store.

## Self-Check: PASSED

- `src/pages/EmpresaEditPage.tsx` — FOUND (created, 174 lines)
- `src/pages/ContaTab.tsx` — FOUND (modified)
- `src/App.tsx` — FOUND (modified)
- Commit `457ceb3` — FOUND (feat: EmpresaEditPage)
- Commit `1c6ba35` — FOUND (feat: ContaTab + route)
- 48/48 tests green
- Build exits 0
