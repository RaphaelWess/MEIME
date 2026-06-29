import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'

interface AuthStore {
  /** The currently authenticated Supabase user, or null if not authenticated. */
  user: User | null
  /** True while the initial session is being fetched (prevents auth flash). */
  loading: boolean
  /** Set the authenticated user (called by AuthProvider on auth state changes). */
  setUser: (user: User | null) => void
  /** Set the loading state (called by AuthProvider after initial session resolves). */
  setLoading: (loading: boolean) => void
}

/**
 * Zustand auth store — single source of truth for authenticated user state.
 * AuthProvider feeds this store via onAuthStateChange.
 * Components read user/loading; they do NOT call Supabase directly.
 */
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}))
