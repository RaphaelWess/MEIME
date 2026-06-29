import { useLocation, Link } from 'react-router'
import { Home, Wallet, CalendarDays, QrCode, User } from 'lucide-react'

const tabs = [
  { to: '/app', label: 'Início', Icon: Home },
  { to: '/app/financas', label: 'Finanças', Icon: Wallet },
  { to: '/app/agenda', label: 'Agenda', Icon: CalendarDays },
  { to: '/app/cobrar', label: 'Cobrar', Icon: QrCode },
  { to: '/app/conta', label: 'Conta', Icon: User },
] as const

/**
 * BottomNav — 5-tab authenticated navigation bar.
 *
 * Active tab: icon + label in green-600 (accent per UI-SPEC).
 * Inactive tabs: icon + label in zinc-400.
 * Only rendered inside AppShell (protected route) — never visible before login.
 *
 * Accessibility: aria-label on nav, aria-current="page" on active tab.
 * Touch targets: min 44px height (iOS HIG).
 */
export default function BottomNav() {
  const location = useLocation()

  function isActive(to: string) {
    if (to === '/app') {
      // Início: only active on /app or /app/ — not for all /app/* paths
      return location.pathname === '/app' || location.pathname === '/app/'
    }
    return (
      location.pathname === to || location.pathname.startsWith(to + '/')
    )
  }

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-zinc-200 bg-zinc-100"
    >
      <div className="flex h-full w-full items-stretch">
        {tabs.map(({ to, label, Icon }) => {
          const active = isActive(to)
          return (
            <Link
              key={to}
              to={to}
              role="tab"
              aria-current={active ? 'page' : undefined}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[44px]"
            >
              <Icon
                size={24}
                className={active ? 'text-green-600' : 'text-zinc-400'}
              />
              <span
                className={`text-xs leading-tight ${
                  active ? 'text-green-600' : 'text-zinc-400'
                }`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
