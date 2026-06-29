import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the supabase module BEFORE importing the service
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import { empresaService } from './empresa.service'

// Typed mock helper
const mockSupabase = supabase as { from: ReturnType<typeof vi.fn> }

// Builder for fluent Supabase mock chains
function buildChain(overrides: Partial<Record<string, ReturnType<typeof vi.fn>>> = {}) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    maybeSingle: vi.fn(),
    upsert: vi.fn(),
    single: vi.fn(),
  }
  Object.assign(chain, overrides)

  // Wire the chain: select().maybeSingle() and upsert().select().single()
  chain.select.mockReturnValue(chain)
  chain.maybeSingle.mockReturnValue(chain)
  chain.upsert.mockReturnValue(chain)
  chain.single.mockReturnValue(chain)

  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('empresaService.getForCurrentUser', () => {
  it('returns null when supabase returns no rows (maybeSingle)', async () => {
    const chain = buildChain()
    chain.maybeSingle.mockResolvedValue({ data: null, error: null })
    mockSupabase.from.mockReturnValue(chain)

    const result = await empresaService.getForCurrentUser()

    expect(result).toBeNull()
    expect(mockSupabase.from).toHaveBeenCalledWith('empresa_mei')
    expect(chain.select).toHaveBeenCalledWith('*')
    expect(chain.maybeSingle).toHaveBeenCalled()
  })

  it('returns the empresa_mei row when one exists', async () => {
    const fakeRow = {
      id: 'uuid-1',
      user_id: 'user-uuid',
      cnpj: '12345678000195',
      razao_social: 'JOAO DA SILVA MEI',
      nome_fantasia: null,
      cnae_fiscal: 7311400,
      cnae_fiscal_descricao: 'Agencias de publicidade',
      situacao_cadastral: 'ATIVA',
      data_inicio_atividade: '2022-01-01',
      atividade_principal: 'Publicidade',
      data_abertura_mei: '2022-01-01',
      is_caminhoneiro: false,
      created_at: '2026-06-28T00:00:00Z',
    }
    const chain = buildChain()
    chain.maybeSingle.mockResolvedValue({ data: fakeRow, error: null })
    mockSupabase.from.mockReturnValue(chain)

    const result = await empresaService.getForCurrentUser()

    expect(result).toEqual(fakeRow)
  })

  it('throws when supabase returns an error', async () => {
    const chain = buildChain()
    chain.maybeSingle.mockResolvedValue({ data: null, error: new Error('DB error') })
    mockSupabase.from.mockReturnValue(chain)

    await expect(empresaService.getForCurrentUser()).rejects.toThrow('DB error')
  })
})

describe('empresaService.save', () => {
  const input = {
    user_id: 'user-uuid',
    cnpj: '12345678000195',
    razao_social: 'JOAO DA SILVA MEI',
    nome_fantasia: null,
    cnae_fiscal: 7311400,
    cnae_fiscal_descricao: 'Agencias de publicidade',
    situacao_cadastral: 'ATIVA',
    data_inicio_atividade: '2022-01-01',
    atividade_principal: 'Publicidade',
    data_abertura_mei: '2022-01-01',
    is_caminhoneiro: false,
  }

  it('calls supabase.upsert with onConflict user_id and returns saved row', async () => {
    const savedRow = { ...input, id: 'uuid-1', created_at: '2026-06-28T00:00:00Z' }
    const chain = buildChain()
    // upsert().select().single() chain
    chain.single.mockResolvedValue({ data: savedRow, error: null })
    mockSupabase.from.mockReturnValue(chain)

    const result = await empresaService.save(input)

    expect(result).toEqual(savedRow)
    expect(mockSupabase.from).toHaveBeenCalledWith('empresa_mei')
    expect(chain.upsert).toHaveBeenCalledWith(input, { onConflict: 'user_id' })
    expect(chain.select).toHaveBeenCalled()
    expect(chain.single).toHaveBeenCalled()
  })

  it('throws when supabase returns an error on save', async () => {
    const chain = buildChain()
    chain.single.mockResolvedValue({ data: null, error: new Error('Upsert failed') })
    mockSupabase.from.mockReturnValue(chain)

    await expect(empresaService.save(input)).rejects.toThrow('Upsert failed')
  })
})
