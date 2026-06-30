import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

// Mock useTransacoes to avoid needing TanStack Query provider
vi.mock('./useTransacoes', () => ({
  useTransacoes: vi.fn(),
}))

import { useTransacoes } from './useTransacoes'
import { useTransacoesSummary } from './useTransacoesSummary'

const mockUseTransacoes = useTransacoes as ReturnType<typeof vi.fn>

describe('useTransacoesSummary', () => {
  it('with 2 entradas (500, 300) and 1 saida (200): entradas=800, saidas=200, saldo=600, lucro=600', () => {
    mockUseTransacoes.mockReturnValue({
      data: [
        { id: '1', tipo: 'entrada', valor: 500, categoria: 'Serviços Prestados', descricao: null, tipo_pessoa: 'PF', data: '2026-06-01', user_id: 'u1', created_at: '' },
        { id: '2', tipo: 'entrada', valor: 300, categoria: 'Venda de Produtos', descricao: null, tipo_pessoa: 'PJ', data: '2026-06-02', user_id: 'u1', created_at: '' },
        { id: '3', tipo: 'saida', valor: 200, categoria: 'Materiais e Suprimentos', descricao: null, tipo_pessoa: 'PF', data: '2026-06-03', user_id: 'u1', created_at: '' },
      ],
      isLoading: false,
      error: null,
    })

    const { result } = renderHook(() => useTransacoesSummary(2026, 6))

    expect(result.current.summary.entradas).toBe(800)
    expect(result.current.summary.saidas).toBe(200)
    expect(result.current.summary.saldo).toBe(600)
    expect(result.current.summary.lucro).toBe(600)
  })

  it('with no transactions: entradas=0, saidas=0, saldo=0', () => {
    mockUseTransacoes.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    })

    const { result } = renderHook(() => useTransacoesSummary(2026, 6))

    expect(result.current.summary.entradas).toBe(0)
    expect(result.current.summary.saidas).toBe(0)
    expect(result.current.summary.saldo).toBe(0)
  })

  it('with saidas > entradas: saldo is negative', () => {
    mockUseTransacoes.mockReturnValue({
      data: [
        { id: '1', tipo: 'entrada', valor: 100, categoria: 'Outros', descricao: null, tipo_pessoa: null, data: '2026-06-01', user_id: 'u1', created_at: '' },
        { id: '2', tipo: 'saida', valor: 500, categoria: 'Impostos e DAS', descricao: null, tipo_pessoa: null, data: '2026-06-02', user_id: 'u1', created_at: '' },
      ],
      isLoading: false,
      error: null,
    })

    const { result } = renderHook(() => useTransacoesSummary(2026, 6))

    expect(result.current.summary.saldo).toBeLessThan(0)
    expect(result.current.summary.saldo).toBe(-400)
  })

  it('isLoading is forwarded from useTransacoes mock', () => {
    mockUseTransacoes.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })

    const { result } = renderHook(() => useTransacoesSummary(2026, 6))

    expect(result.current.isLoading).toBe(true)
  })
})
