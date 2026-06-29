import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useEmpresaStore } from '@/stores/empresa.store'
import { empresaService } from '@/services/empresa.service'

interface EmpresaProviderProps {
  children: ReactNode
}

/**
 * EmpresaProvider — hydrates the empresa store once at app boot after auth resolves.
 *
 * Depends on AuthProvider being higher in the tree (user/authLoading come from auth store).
 * Never re-fetches on navigation — only re-runs when user or authLoading changes.
 *
 * Boot flow:
 * 1. authLoading === true → wait (auth hasn't resolved yet)
 * 2. user === null → set empresa=null, loading=false (not logged in)
 * 3. user !== null → fetch empresa_mei, set empresa=result (or null on not found)
 */
export function EmpresaProvider({ children }: EmpresaProviderProps) {
  const user = useAuthStore((state) => state.user)
  const authLoading = useAuthStore((state) => state.loading)

  const setEmpresa = useEmpresaStore((state) => state.setEmpresa)
  const setLoading = useEmpresaStore((state) => state.setLoading)

  useEffect(() => {
    // Auth hasn't resolved yet — don't fetch empresa
    if (authLoading) return

    // Not authenticated — clear empresa state immediately
    if (user === null) {
      setEmpresa(null)
      setLoading(false)
      return
    }

    // Authenticated — fetch empresa_mei for this user
    let cancelled = false

    setLoading(true)

    empresaService
      .getForCurrentUser()
      .then((empresa) => {
        if (!cancelled) setEmpresa(empresa)
      })
      .catch(() => {
        if (!cancelled) setEmpresa(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, authLoading, setEmpresa, setLoading])

  // No conditional rendering — loading state is handled by ProtectedRoute / OnboardingGuard
  return <>{children}</>
}
