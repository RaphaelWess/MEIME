---
phase: 02-onboarding-mei
status: ready
source: extracted from 02-RESEARCH.md Validation Architecture section
---

# Phase 2 — Validation Architecture

## Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 + @testing-library/react 16.3.2 |
| Config file | `vite.config.ts` (test block) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

## Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Plan |
|--------|----------|-----------|-------------------|------|
| ONB-01 | CNPJ mask applies XX.XXX.XXX/XXXX-XX format | unit | `npm test -- --run cnpj` | 02-03 Task 1 |
| ONB-01 | `isValidCnpj` rejects invalid, accepts valid numeric + alphanumeric | unit | `npm test -- --run cnpj` | 02-03 Task 1 |
| ONB-01 | `useOnboardingCnpj` does not fire before 14 chars | unit | `npm test -- --run useOnboardingCnpj` | 02-03 Task 1 |
| ONB-01 | `useOnboardingCnpj` fires after debounce with valid CNPJ | unit | `npm test -- --run useOnboardingCnpj` | 02-03 Task 1 |
| ONB-02 | `empresaService.save` calls supabase upsert with correct args | unit | `npm test -- --run empresa.service` | 02-02 Task 1 |
| ONB-02 | `empresaService.getForCurrentUser` returns null when no row | unit | `npm test -- --run empresa.service` | 02-02 Task 1 |
| ONB-03 | OnboardingPage renders atividade_principal and data_abertura_mei fields | integration | `npm test -- --run OnboardingPage` | 02-03 Task 2 |
| ONB-03 | ProtectedRoute redirects to /onboarding when empresa is null | integration | `npm test -- --run ProtectedRoute` | 02-02 Task 2 (extends existing) |

## Sampling Rate

| Gate | Command | When |
|------|---------|------|
| Per task commit | `npm test -- --run` (fast, no watch) | After each task completes |
| Per wave merge | `npm test` | After all tasks in a wave |
| Phase gate | Full suite green | Before `/gsd-verify-work 2` |

## Wave 0 Test Files to Create

These do not exist yet — each plan creates them during execution:

- [ ] `src/utils/cnpj.test.ts` — covers `isValidCnpj`, `formatCnpj`, `stripCnpj` (created in 02-03 Task 1)
- [ ] `src/hooks/useOnboardingCnpj.test.ts` — covers enabled/debounce behavior (created in 02-03 Task 1)
- [ ] `src/services/empresa.service.test.ts` — covers save + getForCurrentUser (created in 02-02 Task 1)
- [ ] `src/pages/OnboardingPage.test.tsx` — integration coverage for the form (created in 02-03 Task 2)

## Key Behaviors to Test

### CNPJ Utilities (`cnpj.ts`)
- `isValidCnpj('00000000000000')` → `false` (all-same rejected)
- `isValidCnpj('11222333000181')` → `true` (known valid)
- `isValidCnpj('11222333000182')` → `false` (invalid checksum)
- `isValidCnpj('1234')` → `false` (wrong length)
- `formatCnpj('12345678000195')` → `'12.345.678/0001-95'`
- `stripCnpj('AB.CDE.FGH/0001-00')` → `'ABCDEFGH000100'` (alphanumeric CNPJ)

### Service (`empresa.service.ts`)
- `getForCurrentUser()` returns `null` when no row (uses `.maybeSingle()`, not `.single()`)
- `getForCurrentUser()` throws on Supabase error
- `save()` calls upsert with `onConflict: 'user_id'`
- `save()` throws on Supabase error

### OnboardingPage
- Renders CNPJ field with placeholder `00.000.000/0000-00`
- On API success: razão social field is read-only
- On API error `CNPJ_NOT_FOUND`: shows "CNPJ não encontrado..." message
- On API error `API_ERROR`: shows "Não foi possível buscar os dados..." message
- Submit button disabled when razão social or data de abertura is empty
