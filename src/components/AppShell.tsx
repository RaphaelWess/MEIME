import { Outlet } from 'react-router'
import BottomNav from '@/components/BottomNav'
import FAB from '@/components/FAB'

/**
 * AppShell — layout wrapper for authenticated routes.
 *
 * Renders:
 * - Main content area with Outlet (active child route / tab page)
 * - BottomNav (fixed bottom, 5-tab navigation)
 * - FAB (floating action button, fixed position)
 *
 * Only rendered inside ProtectedRoute — BottomNav is never visible before login (T-1-03).
 */
export default function AppShell() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Tab content — pb-16 prevents content from hiding behind fixed BottomNav */}
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>

      {/* Fixed navigation — only visible inside authenticated shell */}
      <BottomNav />
      <FAB />
    </div>
  )
}
