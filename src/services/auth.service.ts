import { supabase } from '@/lib/supabase'

/**
 * Auth service layer — D-11.
 * This is the ONLY file that calls Supabase auth methods.
 * Components and stores import authService, never @supabase/supabase-js directly.
 */
export const authService = {
  signUp: (email: string, password: string) =>
    supabase.auth.signUp({ email, password }),

  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  signOut: () => supabase.auth.signOut(),

  /**
   * Deletes the current user's account via SECURITY DEFINER function (D-03).
   * The DB function deletes WHERE id = auth.uid() — only the caller's own account.
   * SignOut is attempted after deletion; if it fails (network/session already gone), it is
   * silently ignored — the user is already deleted from the database (T-1-04).
   */
  deleteAccount: async () => {
    const { error } = await supabase.rpc('delete_user')
    if (error) throw error
    try {
      await supabase.auth.signOut()
    } catch {
      // Ignore — user already deleted from DB; session cleanup is best-effort
    }
  },
}
