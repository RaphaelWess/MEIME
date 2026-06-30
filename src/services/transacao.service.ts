import { supabase } from '@/lib/supabase'

/**
 * Transacao entity — mirrors the transacoes table schema (0001 migration).
 * valor is stored as INTEGER centavos — NEVER float (D-09).
 * RLS policy `using ((select auth.uid()) = user_id)` enforces user isolation
 * server-side — no explicit user_id filter needed in queries (T-03-01).
 */
export interface Transacao {
  id: string
  user_id: string
  tipo: 'entrada' | 'saida'
  valor: number        // INTEGER centavos — never float (D-09)
  categoria: string | null
  descricao: string | null
  tipo_pessoa: 'PF' | 'PJ' | null
  data: string         // 'YYYY-MM-DD'
  created_at: string
}

/**
 * Input type for insert — omits server-generated fields (id, user_id, created_at).
 */
export type CreateTransacaoInput = Omit<Transacao, 'id' | 'user_id' | 'created_at'>

/**
 * Input type for partial update.
 */
export type UpdateTransacaoInput = Partial<CreateTransacaoInput>

/**
 * Transacao service layer — D-08 (service layer purity).
 * This is the ONLY file that calls Supabase on the transacoes table.
 * Components never import @supabase/supabase-js directly.
 *
 * Security validations (T-02, T-03, T-05):
 * - valor: must be integer centavos > 0 and <= 999_999_999 (< R$ 10M)
 * - tipo: must be 'entrada' or 'saida'
 * - tipo_pessoa: must be 'PF', 'PJ', null, or undefined
 * - data: must match /^\d{4}-\d{2}-\d{2}$/
 *
 * Error handling: `if (error) throw error` — NEVER try/catch in service layer.
 * Let TanStack Query handle error state at the hook layer.
 */
export const transacaoService = {
  /**
   * Returns all transactions for the given month, ordered by date descending.
   * RLS ensures only the authenticated user's rows are returned.
   * Returns empty array if no rows exist (never null).
   */
  getByMonth: async (year: number, month: number): Promise<Transacao[]> => {
    const mm = String(month).padStart(2, '0')
    const from = `${year}-${mm}-01`
    // Last day: use first day of next month minus 1 day via date math
    const lastDay = new Date(year, month, 0).getDate()
    const to = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`

    const { data, error } = await supabase
      .from('transacoes')
      .select('*')
      .gte('data', from)
      .lte('data', to)
      .order('data', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  /**
   * Inserts a new transaction after validating all security constraints.
   * Throws typed errors for invalid input (T-02, T-03, T-05).
   * Returns the persisted row including server-generated id.
   */
  create: async (input: CreateTransacaoInput): Promise<Transacao> => {
    // T-02: validate centavos range
    if (input.valor <= 0 || input.valor > 999_999_999) {
      throw new Error('Valor invalido')
    }

    // T-03: validate tipo
    if (input.tipo !== 'entrada' && input.tipo !== 'saida') {
      throw new Error('Tipo invalido')
    }

    // T-03: validate tipo_pessoa
    if (
      input.tipo_pessoa !== 'PF' &&
      input.tipo_pessoa !== 'PJ' &&
      input.tipo_pessoa !== null &&
      input.tipo_pessoa !== undefined
    ) {
      throw new Error('Tipo de pessoa invalido')
    }

    // T-05: validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.data)) {
      throw new Error('Data invalida')
    }

    const { data, error } = await supabase
      .from('transacoes')
      .insert(input)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Updates an existing transaction by id.
   * Validates valor if provided in patch (T-02).
   * Returns the updated row.
   */
  update: async (id: string, patch: UpdateTransacaoInput): Promise<Transacao> => {
    // T-02: validate centavos range if valor is being updated
    if (patch.valor !== undefined) {
      if (patch.valor <= 0 || patch.valor > 999_999_999) {
        throw new Error('Valor invalido')
      }
    }

    const { data, error } = await supabase
      .from('transacoes')
      .update(patch)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Deletes a transaction by id.
   * RLS ensures only the owner can delete their own rows.
   * Returns void.
   */
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('transacoes')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
