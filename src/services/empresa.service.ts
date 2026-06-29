import { supabase } from '@/lib/supabase'

/**
 * Empresa MEI entity — mirrors the empresa_mei table schema (0001 + 0002 migrations).
 */
export interface EmpresaMei {
  id: string
  user_id: string
  cnpj: string | null
  razao_social: string | null
  nome_fantasia: string | null
  cnae_fiscal: number | null
  cnae_fiscal_descricao: string | null
  situacao_cadastral: string | null
  data_inicio_atividade: string | null
  atividade_principal: string | null
  data_abertura_mei: string | null
  is_caminhoneiro: boolean
  created_at: string
}

/**
 * Input type for upsert — omits server-generated fields (id, created_at).
 */
export type SaveEmpresaInput = Omit<EmpresaMei, 'id' | 'created_at'>

/**
 * Empresa service layer — D-11.
 * This is the ONLY file that calls Supabase on the empresa_mei table.
 * Components and stores import empresaService, never @supabase/supabase-js directly.
 */
export const empresaService = {
  /**
   * Returns the current authenticated user's empresa_mei row, or null if none exists.
   * Uses .maybeSingle() — does NOT throw on zero rows (unlike .single()).
   * Throws on Supabase error.
   */
  getForCurrentUser: async (): Promise<EmpresaMei | null> => {
    const { data, error } = await supabase
      .from('empresa_mei')
      .select('*')
      .maybeSingle()

    if (error) throw error
    return data
  },

  /**
   * Upserts the empresa_mei row for the current user.
   * onConflict: 'user_id' ensures safe re-runs (create on first call, update on subsequent).
   * UNIQUE constraint on user_id (migration 0002) is required for this to work.
   * Returns the persisted row. Throws on Supabase error.
   */
  save: async (input: SaveEmpresaInput): Promise<EmpresaMei> => {
    const { data, error } = await supabase
      .from('empresa_mei')
      .upsert(input, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw error
    return data
  },
}
