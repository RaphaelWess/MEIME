import { useEffect, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

interface AuthProviderProps {
  children: ReactNode
}

/**
 * AuthProvider — subscribes to Supabase auth state changes and updates useAuthStore.
 * T-1-03: Sets loading=false after initial session resolves to prevent auth flash.
 *
 * Place this near the root of the component tree, wrapping the entire app.
 * ProtectedRoute (Plan 04) reads loading state to avoid redirect flash.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const setUser = useAuthStore((state) => state.setUser)
  const setLoading = useAuthStore((state) => state.setLoading)

  useEffect(() => {
    // Fetch initial session synchronously — prevents loading flash on page refresh
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Subscribe to future auth state changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setLoading])

  // No conditional rendering — loading state is handled by ProtectedRoute (Plan 04)
  return <>{children}</>
}
