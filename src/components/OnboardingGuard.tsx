import React from 'react'
import { Navigate } from 'react-router'
import { useAuthStore } from '@/stores/auth.store'
import { useEmpresaStore } from '@/stores/empresa.store'

interface OnboardingGuardProps {
  children: React.ReactNode
}

/**
 * OnboardingGuard — guards the /onboarding route (D-02, Claude's Discretion).
 *
 * Four-state logic:
 * 1. authLoading OR empresaLoading → show loading indicator (prevents flash — T-02-03)
 * 2. user === null → Navigate to="/welcome" replace  (unauthenticated — T-02-06)
 * 3. empresa !== null → Navigate to="/app" replace   (already onboarded — skip back to app)
 * 4. user !== null AND empresa === null → render children (show onboarding form)
 */
export default function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user, loading: authLoading } = useAuthStore()
  const { empresa, loading: empresaLoading } = useEmpresaStore()

  if (authLoading || empresaLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        aria-live="polite"
        aria-label="Carregando"
      >
        <p className="text-zinc-500 text-base">Carregando...</p>
      </div>
    )
  }

  if (user === null) {
    return <Navigate to="/welcome" replace />
  }

  if (empresa !== null) {
    return <Navigate to="/app" replace />
  }

  return <React.Fragment>{children}</React.Fragment>
}
