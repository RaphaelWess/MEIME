import { useNavigate, Link } from 'react-router'
import { Button } from '@/components/ui/button'

/**
 * WelcomePage — app entry point for unauthenticated users.
 *
 * Layout: mobile-first full screen, vertically distributed.
 * - Center: app name (Display 28px) + subheadline (Body 16px) + CTA
 * - Footer: privacy link (D-03 — first location of /privacidade link)
 *
 * No BottomNav — this is a public page.
 */
export default function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Top spacer */}
      <div className="flex-1" />

      {/* Center content */}
      <main className="flex flex-col items-center gap-4 px-6 py-8">
        {/* App name — Display size: 28px semibold */}
        <h1 className="text-[28px] font-semibold leading-[1.15] text-zinc-900 text-center">
          MEIME
        </h1>

        {/* Subheadline — Body size: 16px regular */}
        <p className="text-base font-normal leading-relaxed text-zinc-600 text-center">
          Gestão gratuita para MEI
        </p>

        {/* CTA — accent green per UI-SPEC */}
        <Button
          onClick={() => navigate('/auth')}
          className="mt-4 w-full max-w-xs bg-green-600 hover:bg-green-700 text-white font-semibold min-h-[44px]"
        >
          Começar agora
        </Button>
      </main>

      {/* Bottom spacer */}
      <div className="flex-1" />

      {/* Footer — privacy link (D-03, first location) */}
      <footer className="flex justify-center py-6 px-6">
        <Link
          to="/privacidade"
          className="text-sm text-zinc-500 underline underline-offset-2 hover:text-zinc-700"
        >
          Privacidade
        </Link>
      </footer>
    </div>
  )
}
