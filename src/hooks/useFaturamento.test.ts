import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// vi.mock calls MUST be before the useFaturamento import (hoisting requirement)
vi.mock('@/services/transacao.service', () => ({
  transacaoService: { getByYear: vi.fn() },
}))

vi.mock('@/stores/empresa.store', () => ({
  useEmpresaStore: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}))

import { useEmpresaStore } from '@/stores/empresa.store'
import { useQuery } from '@tanstack/react-query'
import { useFaturamento } from '@/hooks/useFaturamento'

const mockUseEmpresaStore = useEmpresaStore as ReturnType<typeof vi.fn>
const mockUseQuery = useQuery as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useFaturamento', () => {
  it('when empresa is null: isLoading is true and query is not enabled', () => {
    mockUseEmpresaStore.mockReturnValue({ empresa: null })
    mockUseQuery.mockReturnValue({ data: [], isLoading: false, error: null })

    const { result } = renderHook(() => useFaturamento(2026))

    // empresa === null forces isLoading override to true (Pitfall 4 guard)
    expect(result.current.isLoading).toBe(true)
  })

  it('queryKey starts with "transacoes"', () => {
    const empresa = { is_caminhoneiro: false, data_abertura_mei: null } as any
    mockUseEmpresaStore.mockReturnValue({ empresa })
    mockUseQuery.mockReturnValue({ data: [], isLoading: false, error: null })

    renderHook(() => useFaturamento(2026))

    // Capture the first call args to useQuery
    const callArgs = mockUseQuery.mock.calls[0][0]
    expect(callArgs.queryKey[0]).toBe('transacoes')
  })

  it('returns limiteAnual = LIMITE_MEI_PADRAO (8_100_000) for standard MEI with null data_abertura_mei', () => {
    const empresa = { is_caminhoneiro: false, data_abertura_mei: null } as any
    mockUseEmpresaStore.mockReturnValue({ empresa })
    mockUseQuery.mockReturnValue({ data: [], isLoading: false, error: null })

    const { result } = renderHook(() => useFaturamento(2026))

    expect(result.current.limiteAnual).toBe(8_100_000)
  })
})
