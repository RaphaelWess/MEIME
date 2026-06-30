import { Plus } from 'lucide-react'

/**
 * FAB — Floating Action Button.
 *
 * Phase 3: onClick prop wired to openSheet() from AppShell (D-01).
 *
 * Position: fixed, bottom-20 (80px from bottom — clears BottomNav h-16 + 16px gap), right-4.
 * Size: 56px x 56px, border-radius: 50%.
 * Background: green-600. Icon: Plus 24px white.
 */

interface FABProps {
  onClick: () => void
}

export default function FAB({ onClick }: FABProps) {
  return (
    <button
      type="button"
      aria-label="Adicionar lançamento"
      className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 shadow-lg text-white"
      onClick={onClick}
    >
      <Plus size={24} color="white" />
    </button>
  )
}
