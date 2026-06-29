import React from 'react'
import { Navigate } from 'react-router'
import { useAuthStore } from '@/stores/auth.store'
import { useEmpresaStore } from '@/stores/empresa.store'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * ProtectedRoute — guards child routes behind auth + empresa check.
 *
 * Four-state logic:
 * 1. authLoading OR empresaLoading → show loading indicator (prevents flash — T-1-03 / T-02-03)
 * 2. user === null → Navigate to="/welcome" replace
 * 3. user !== null AND empresa === null → Navigate to="/onboarding" replace (D-01: forced after first login)
 * 4. user !== null AND empresa !== null → render children
 *
 * AuthProvider sets authLoading=false after getSession() resolves.
 * EmpresaProvider sets empresaLoading=false after getForCurrentUser() resolves.
 * No redirect fires until BOTH resolve — prevents premature navigation (Pitfall 6).
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
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

  if (empresa === null) {
    return <Navigate to="/onboarding" replace />
  }

  return <React.Fragment>{children}</React.Fragment>
}
