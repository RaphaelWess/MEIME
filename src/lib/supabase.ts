import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
    'Copy .env.example to .env.local and fill in the values from your Supabase project settings.'
  )
}

/**
 * Supabase singleton client.
 * D-11: This is the ONLY place supabase client is instantiated.
 * Components must NOT import @supabase/supabase-js directly.
 * All Supabase calls go through src/services/*.service.ts
 *
 * NOTE: Only VITE_SUPABASE_ANON_KEY is used here.
 * The service_role key must NEVER appear in the browser bundle (T-1-02).
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
