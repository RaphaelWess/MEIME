---
phase: 01-fundacao-e-infraestrutura
plan: "05"
subsystem: app-shell
tags: [app-shell, bottom-nav, fab, tab-pages, conta-tab, lgpd, logout, delete-account, accessibility]
status: complete
dependency_graph:
  requires:
    - 01-04 (ProtectedRoute, App.tsx router tree, stub tab pages)
    - 01-03 (useAuthStore, authService, AuthProvider)
    - 01-02 (shadcn/ui: AlertDialog, Button, Separator, Avatar installed)
  provides:
    - src/components/AppShell.tsx (Outlet + BottomNav + FAB layout wrapper)
    - src/components/BottomNav.tsx (5 tabs, active state green-600, ARIA)
    - src/components/FAB.tsx (fixed position, 56px, no-op Phase 1)
    - src/pages/InicioTab.tsx ("Em breve" placeholder)
    - src/pages/FinancasTab.tsx ("Em breve" placeholder)
    - src/pages/AgendaTab.tsx ("Em breve" placeholder)
    - src/pages/CobrarTab.tsx ("Em breve" placeholder)
    - src/pages/ContaTab.tsx (logout + delete account AlertDialog + /privacidade link)
  affects:
    - 01-06 (all tab pages available for navigation)
    - All subsequent plans that add content to tab pages
tech_stack:
  added: []
  patterns:
    - AppShell renders Outlet (React Router) for child tab routes; BottomNav and FAB fixed-positioned
    - BottomNav active detection via useLocation(); /app special-cased (exact match only)
    - FAB onClick is console.log no-op per D-02 (TransactionForm deferred to Phase 3)
    - ContaTab uses @base-ui/react AlertDialog (not Radix) — AlertDialogTrigger has no asChild prop
    - ContaTab calls authService.signOut() and authService.deleteAccount() (D-11 enforced)
    - AlertDialogCancel default focus is Radix/base-ui default behavior — no extra autoFocus needed
key_files:
  created:
    - src/components/BottomNav.tsx
    - src/components/FAB.tsx
  modified:
    - src/components/AppShell.tsx (replaces Plan 04 stub)
    - src/pages/InicioTab.tsx (replaces Plan 04 stub)
    - src/pages/FinancasTab.tsx (replaces Plan 04 stub)
    - src/pages/AgendaTab.tsx (replaces Plan 04 stub)
    - src/pages/CobrarTab.tsx (replaces Plan 04 stub)
    - src/pages/ContaTab.tsx (replaces Plan 04 stub with full implementation)
decisions:
  - "AlertDialogTrigger uses @base-ui/react API (no asChild) — styling applied directly via className"
  - "BottomNav Início active check is exact (/app or /app/) to avoid false positives on /app/*"
  - "ContaTab handleDeleteAccount wraps authService.deleteAccount() in try/catch for error state display"
metrics:
  duration: "~3 minutes"
  completed_date: "2026-06-29"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 6
---

# Phase 01 Plan 05: App Shell + Tab Pages Summary

**One-liner:** Authenticated app shell with 5-tab BottomNav (active state green-600, ARIA), no-op FAB scaffold, "Em breve" placeholder tabs, and fully functional ContaTab (logout + AlertDialog delete account + LGPD /privacidade link) — build clean, 16 tests passing.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | AppShell, BottomNav, FAB scaffold | 997427a | src/components/AppShell.tsx, src/components/BottomNav.tsx, src/components/FAB.tsx |
| 2 | Placeholder tabs + ContaTab (logout + delete + privacy link) | 3def510 | src/pages/InicioTab.tsx, src/pages/FinancasTab.tsx, src/pages/AgendaTab.tsx, src/pages/CobrarTab.tsx, src/pages/ContaTab.tsx |

## Verification Results

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| npm run build | exits 0 | exits 0 | PASS |
| npm run test -- --run | 16 passed | 16 passed (4 files) | PASS |
| BottomNav has 5 tabs | Início/Finanças/Agenda/Cobrar/Conta | present | PASS |
| BottomNav aria-label | "Navegação principal" | present on nav element | PASS |
| BottomNav aria-current | "page" on active tab | present | PASS |
| FAB onClick no-op | console.log with 'TransactionForm deferred' | confirmed (D-02) | PASS |
| AppShell renders Outlet | yes | present | PASS |
| InicioTab/FinancasTab/AgendaTab/CobrarTab contain "Em breve" | present | present | PASS |
| ContaTab imports authService (not supabase) | @/services/auth.service | confirmed, no @supabase imports | PASS |
| ContaTab calls authService.signOut() | yes | confirmed | PASS |
| ContaTab calls authService.deleteAccount() | yes | confirmed | PASS |
| ContaTab AlertDialog title "Excluir conta?" | present | present | PASS |
| ContaTab confirm button "Sim, excluir minha conta" | present | present | PASS |
| ContaTab /privacidade link | present (D-03) | present | PASS |
| ContaTab logout button "Sair" | present | present | PASS |
| BottomNav only visible inside AppShell | yes (AppShell inside ProtectedRoute) | confirmed by App.tsx router tree | PASS |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] AlertDialogTrigger does not support asChild prop**
- **Found during:** Task 2 build verification (TS2322 type error)
- **Issue:** Plan action said `<AlertDialogTrigger asChild><Button>...</Button></AlertDialogTrigger>` — but the installed AlertDialog uses `@base-ui/react/alert-dialog` (not Radix), and the `Trigger` component's Props type does not include `asChild`
- **Fix:** Replaced `asChild` pattern with direct styling on `AlertDialogTrigger` via `className` prop (equivalent visual result — outline button style with red-300 border and red-600 text)
- **Files modified:** src/pages/ContaTab.tsx
- **Commit:** 3def510

## Known Stubs

None. All components in this plan are fully implemented. The only intentional placeholder behavior is:
- FAB onClick: `console.log('FAB: TransactionForm deferred to Phase 3')` — per D-02, this is correct Phase 1 behavior
- InicioTab, FinancasTab, AgendaTab, CobrarTab: "Em breve" placeholder — per plan spec, data content deferred to later phases

## Threat Surface Scan

No new threat surface beyond the plan's threat model:
- T-1-04 mitigated: AlertDialog gates account deletion with explicit "Sim, excluir minha conta" confirm; AlertDialogCancel receives default focus (base-ui default); only authService.deleteAccount() called on confirm (which calls SECURITY DEFINER delete_user() — deletes only auth.uid() row).
- T-1-03 mitigated: AppShell is only rendered as child of ProtectedRoute in App.tsx. BottomNav is inside AppShell — structurally impossible to render BottomNav without auth.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| src/components/AppShell.tsx | FOUND |
| src/components/BottomNav.tsx | FOUND |
| src/components/FAB.tsx | FOUND |
| src/pages/InicioTab.tsx | FOUND |
| src/pages/FinancasTab.tsx | FOUND |
| src/pages/AgendaTab.tsx | FOUND |
| src/pages/CobrarTab.tsx | FOUND |
| src/pages/ContaTab.tsx | FOUND |
| commit 997427a (Task 1) | FOUND |
| commit 3def510 (Task 2) | FOUND |
