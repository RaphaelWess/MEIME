import React from 'react'
import { Navigate } from 'react-router'
import { useAuthStore } from '@/stores/auth.store'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * ProtectedRoute — guards child routes behind auth check.
 *
 * Three cases:
 * 1. loading === true → show loading indicator (prevents auth flash — T-1-03 / Pitfall 6)
 * 2. loading === false && user === null → redirect to /welcome
 * 3. loading === false && user !== null → render children
 *
 * AuthProvider sets loading=true initially, loading=false after getSession() resolves,
 * so no redirect fires until the session is confirmed (no "flash" to /welcome).
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuthStore()

  if (loading) {
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

  return <React.Fragment>{children}</React.Fragment>
}
