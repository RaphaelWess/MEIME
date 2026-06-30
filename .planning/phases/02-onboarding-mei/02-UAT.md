---
status: complete
phase: 02-onboarding-mei
source:
  - 02-01-SUMMARY.md
  - 02-02-SUMMARY.md
  - 02-03-SUMMARY.md
  - 02-04-SUMMARY.md
started: 2026-06-29T00:00:00Z
updated: 2026-06-29T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. CNPJ mask applies as user types
expected: |
  Open the app as a new (unauthenticated or empresa-less) user and navigate to /onboarding.
  Click the CNPJ input field. Type digits one by one: 1, 1, 2, 2, 2, 3, 3, 3, 0, 0, 0, 1, 8, 1.
  As you type, the field should progressively apply the mask: "11", "11.222", "11.222.333", "11.222.333/0001", "11.222.333/0001-81".
  The field should end up showing "11.222.333/0001-81" with exactly 18 visible characters.
result: pass

### 2. Auto-lookup fills read-only fields after valid CNPJ
expected: |
  After typing a valid 14-digit CNPJ (e.g. 11.222.333/0001-81), wait ~500ms.
  A loading spinner or skeleton should appear briefly.
  Then: razão social field appears pre-filled and read-only (greyed out / not editable), CNAE description appears read-only, situação cadastral appears read-only.
  These fields should NOT be editable — clicking them should not allow typing.
result: pass

### 3. Inactive CNPJ shows non-blocking warning
expected: |
  If you test a CNPJ whose situação cadastral is NOT "ATIVA" (e.g. a CNPJ that is "BAIXADA" or "SUSPENSA"), a yellow inline warning message should appear below the status field.
  The warning should NOT prevent submission — "Salvar e começar" button should still be enabled once other required fields are filled.
  (Skip this test if you don't have an inactive CNPJ handy — type "skip".)
result: pass

### 4. CNPJ not found shows editable error state
expected: |
  Clear the CNPJ field and type an invalid or non-existent CNPJ (14 digits that pass format but don't exist in Receita Federal, e.g. 00.000.000/0001-91).
  After ~500ms debounce: an error message appears reading "CNPJ não encontrado. Verifique o número ou preencha os dados manualmente."
  The razão social field should become editable (not greyed out).
result: issue
reported: "Com exceção da mensagem de 'CNPJ não encontrado. Verifique o número ou preencha os dados manualmente.', mas ele permite colocar tudo manualmente (CNPJ, Razão social e data de abertura)."
severity: minor

### 5. Submit button requires razão social + data de abertura
expected: |
  With the CNPJ field filled (lookup succeeded or manual entry mode), leave razão social OR data de abertura do MEI empty.
  The "Salvar e começar" button should be visibly disabled.
  Fill in both fields. The button should become enabled.
result: pass

### 6. Full onboarding saves and redirects to /app
expected: |
  Complete the onboarding form: valid CNPJ → auto-fill or manual fill razão social → fill data de abertura do MEI.
  Click "Salvar e começar".
  The app should redirect to /app (the main dashboard). The onboarding screen should no longer appear.
  If you refresh the page, you should stay on /app (not redirected back to /onboarding) — the empresa is persisted.
result: pass

### 7. ContaTab shows "Minha empresa" section
expected: |
  After completing onboarding, navigate to /app/conta (Conta tab in the bottom nav).
  A "Minha empresa" section (or similar) should be visible showing: razão social, formatted CNPJ (XX.XXX.XXX/XXXX-XX), atividade principal, and data de abertura do MEI.
  An "Editar dados da empresa" button should be present in this section.
result: pass

### 8. Edit empresa form opens pre-filled
expected: |
  From ContaTab, tap "Editar dados da empresa".
  The page should navigate to /app/conta/empresa.
  The form should be pre-filled with the empresa data saved during onboarding:
  - CNPJ field: read-only (cannot be edited)
  - Razão social: read-only (cannot be edited)
  - Atividade principal: editable, pre-filled with the current value
  - Data de abertura do MEI: editable, pre-filled
  - Is caminhoneiro: checkbox, pre-filled
result: pass

### 9. Edit and save empresa data
expected: |
  On the edit page (/app/conta/empresa), change the "Atividade principal" text.
  Click "Salvar". An inline "Dados salvos" success message should appear (or the page navigates back).
  Navigate back to ContaTab. The updated atividade principal should be reflected in the "Minha empresa" display.
result: pass

## Summary

total: 9
passed: 8
issues: 1
skipped: 0
pending: 0

## Gaps

- truth: "On API error with CNPJ_NOT_FOUND: error message 'CNPJ não encontrado. Verifique o número ou preencha os dados manualmente.' appears inline"
  status: failed
  reason: "User reported: error message not showing, but manual entry fields do unlock correctly"
  severity: minor
  test: 4
  artifacts: []
  missing: []
