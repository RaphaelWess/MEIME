import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the supabase module BEFORE importing the service
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import { transacaoService } from './transacao.service'

// Typed mock helper
const mockSupabase = supabase as { from: ReturnType<typeof vi.fn> }

// Builder for fluent Supabase mock chains
// Extends the empresa.service.test.ts pattern with insert, update, delete, eq, gte, lte, order, single
function buildChain(overrides: Partial<Record<string, ReturnType<typeof vi.fn>>> = {}) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    order: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    upsert: vi.fn(),
  }
  Object.assign(chain, overrides)

  // Wire every method to return the chain (fluent builder)
  Object.keys(chain).forEach(key => {
    if (!overrides[key]) {
      chain[key].mockReturnValue(chain)
    }
  })

  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('transacaoService.getByMonth', () => {
  // Helper: build a chain where the SECOND .order() call resolves with the given result.
  // Service call chain: select('*').gte(from).lte(to).order(date).order(created_at)
  // First .order() returns an intermediate chain; second .order() resolves the promise.
  function buildGetByMonthChain(resolvedValue: { data: unknown; error: unknown }) {
    // Innermost chain: second .order() call resolves
    const innerChain = buildChain()
    innerChain.order.mockResolvedValue(resolvedValue)

    // Middle chain: first .order() returns innerChain
    const middleChain = buildChain()
    middleChain.order.mockReturnValue(innerChain)

    // Outer chain: .lte() returns middleChain; .gte() returns itself for select chain
    const outerChain = buildChain()
    outerChain.lte.mockReturnValue(middleChain)
    outerChain.gte.mockReturnValue(outerChain)

    return { outerChain, middleChain, innerChain }
  }

  it('calls supabase.from("transacoes").select("*").gte.lte and returns array', async () => {
    const fakeRows = [
      {
        id: 'uuid-1',
        user_id: 'user-uuid',
        tipo: 'entrada' as const,
        valor: 50000,
        categoria: 'Serviços Prestados',
        descricao: null,
        tipo_pessoa: 'PJ' as const,
        data: '2026-06-15',
        created_at: '2026-06-15T10:00:00Z',
      },
    ]
    const { outerChain } = buildGetByMonthChain({ data: fakeRows, error: null })
    mockSupabase.from.mockReturnValue(outerChain)

    const result = await transacaoService.getByMonth(2026, 6)

    expect(mockSupabase.from).toHaveBeenCalledWith('transacoes')
    expect(outerChain.select).toHaveBeenCalledWith('*')
    expect(Array.isArray(result)).toBe(true)
    expect(result).toEqual(fakeRows)
  })

  it('returns [] when supabase returns null data', async () => {
    const { outerChain } = buildGetByMonthChain({ data: null, error: null })
    mockSupabase.from.mockReturnValue(outerChain)

    const result = await transacaoService.getByMonth(2026, 6)

    expect(result).toEqual([])
  })

  it('throws when supabase returns error', async () => {
    const { outerChain } = buildGetByMonthChain({ data: null, error: new Error('DB error') })
    mockSupabase.from.mockReturnValue(outerChain)

    await expect(transacaoService.getByMonth(2026, 6)).rejects.toThrow('DB error')
  })
})

describe('transacaoService.create', () => {
  const validInput = {
    tipo: 'entrada' as const,
    valor: 30000,
    categoria: 'Serviços Prestados',
    descricao: null,
    tipo_pessoa: 'PJ' as const,
    data: '2026-06-20',
  }

  it('calls supabase.from("transacoes").insert(input).select().single() and returns row', async () => {
    const savedRow = { ...validInput, id: 'uuid-new', user_id: 'user-uuid', created_at: '2026-06-20T10:00:00Z' }
    const chain = buildChain()
    chain.single.mockResolvedValue({ data: savedRow, error: null })
    mockSupabase.from.mockReturnValue(chain)

    const result = await transacaoService.create(validInput)

    expect(result).toEqual(savedRow)
    expect(mockSupabase.from).toHaveBeenCalledWith('transacoes')
    expect(chain.insert).toHaveBeenCalledWith(validInput)
    expect(chain.select).toHaveBeenCalled()
    expect(chain.single).toHaveBeenCalled()
  })

  it('create with tipo_pessoa="PF" is accepted (no type error)', async () => {
    const pfInput = { ...validInput, tipo_pessoa: 'PF' as const }
    const savedRow = { ...pfInput, id: 'uuid-pf', user_id: 'user-uuid', created_at: '2026-06-20T10:00:00Z' }
    const chain = buildChain()
    chain.single.mockResolvedValue({ data: savedRow, error: null })
    mockSupabase.from.mockReturnValue(chain)

    const result = await transacaoService.create(pfInput)

    expect(result.tipo_pessoa).toBe('PF')
  })

  it('create with tipo_pessoa="PJ" is accepted (no type error)', async () => {
    const pjInput = { ...validInput, tipo_pessoa: 'PJ' as const }
    const savedRow = { ...pjInput, id: 'uuid-pj', user_id: 'user-uuid', created_at: '2026-06-20T10:00:00Z' }
    const chain = buildChain()
    chain.single.mockResolvedValue({ data: savedRow, error: null })
    mockSupabase.from.mockReturnValue(chain)

    const result = await transacaoService.create(pjInput)

    expect(result.tipo_pessoa).toBe('PJ')
  })
})

describe('transacaoService.update', () => {
  it('calls supabase.from("transacoes").update(patch).eq("id", id).select().single()', async () => {
    const id = 'uuid-existing'
    const patch = { valor: 99900, descricao: 'Atualizado' }
    const updatedRow = {
      id,
      user_id: 'user-uuid',
      tipo: 'entrada' as const,
      valor: 99900,
      categoria: 'Serviços Prestados',
      descricao: 'Atualizado',
      tipo_pessoa: 'PJ' as const,
      data: '2026-06-20',
      created_at: '2026-06-20T10:00:00Z',
    }
    const chain = buildChain()
    chain.single.mockResolvedValue({ data: updatedRow, error: null })
    mockSupabase.from.mockReturnValue(chain)

    const result = await transacaoService.update(id, patch)

    expect(result).toEqual(updatedRow)
    expect(mockSupabase.from).toHaveBeenCalledWith('transacoes')
    expect(chain.update).toHaveBeenCalledWith(patch)
    expect(chain.eq).toHaveBeenCalledWith('id', id)
    expect(chain.select).toHaveBeenCalled()
    expect(chain.single).toHaveBeenCalled()
  })
})

describe('transacaoService.delete', () => {
  it('calls supabase.from("transacoes").delete().eq("id", id)', async () => {
    const id = 'uuid-to-delete'
    const chain = buildChain()
    chain.eq.mockResolvedValue({ error: null })
    mockSupabase.from.mockReturnValue(chain)

    await transacaoService.delete(id)

    expect(mockSupabase.from).toHaveBeenCalledWith('transacoes')
    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', id)
  })
})
