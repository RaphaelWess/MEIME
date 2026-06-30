import { Outlet } from 'react-router'
import BottomNav from '@/components/BottomNav'
import FAB from '@/components/FAB'
import { useFinancasStore } from '@/stores/financas.store'
import { TransactionSheet } from '@/components/TransactionSheet'

/**
 * AppShell — layout wrapper for authenticated routes.
 *
 * Renders:
 * - Main content area with Outlet (active child route / tab page)
 * - BottomNav (fixed bottom, 5-tab navigation)
 * - FAB (floating action button, wired to openSheet — D-01)
 * - TransactionSheet (bottom-sheet form, mounted OUTSIDE Outlet — Pitfall 4)
 *
 * TransactionSheet is a sibling of BottomNav/FAB, NOT inside <main>.
 * This prevents the sheet from unmounting on tab navigation (Pitfall 4).
 *
 * Only rendered inside ProtectedRoute — BottomNav is never visible before login (T-1-03).
 */
export default function AppShell() {
  const { sheetOpen, editingTransaction, openSheet, closeSheet, selectedYear, selectedMonth } = useFinancasStore()

  // Build default date for create mode: same day-of-month as today, but in the selected month/year.
  // Clamps to last day of month (e.g. Feb 30 → Feb 28).
  const defaultDate = (() => {
    const todayDay = new Date().getDate()
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate()
    const day = Math.min(todayDay, lastDay)
    const mm = String(selectedMonth).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    return `${selectedYear}-${mm}-${dd}`
  })()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Tab content — pb-16 prevents content from hiding behind fixed BottomNav */}
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>

      {/* Fixed navigation — only visible inside authenticated shell */}
      <BottomNav />
      <FAB onClick={() => openSheet()} />
      <TransactionSheet
        open={sheetOpen}
        onOpenChange={(open) => { if (!open) closeSheet() }}
        transaction={editingTransaction ?? undefined}
        defaultDate={defaultDate}
      />
    </div>
  )
}
