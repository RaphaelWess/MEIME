import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useOnboardingCnpj } from './useOnboardingCnpj'

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  mockFetch.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useOnboardingCnpj', () => {
  it('does NOT trigger query when rawCnpj has fewer than 14 chars', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useOnboardingCnpj('123456'), { wrapper })

    // Advance past debounce
    act(() => {
      vi.advanceTimersByTime(600)
    })

    await waitFor(() => {
      // Query should not be enabled — fetchStatus should be 'idle'
      expect(result.current.fetchStatus).toBe('idle')
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('does NOT trigger query when rawCnpj is 14 chars but fails isValidCnpj (all zeros)', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useOnboardingCnpj('00000000000000'), { wrapper })

    act(() => {
      vi.advanceTimersByTime(600)
    })

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe('idle')
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('triggers query (and calls fetch) when given a valid 14-char CNPJ after 500ms debounce', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cnpj: '11222333000181',
        razao_social: 'TEST EMPRESA MEI',
        nome_fantasia: 'TEST',
        cnae_fiscal: 7311400,
        cnae_fiscal_descricao: 'Agências de publicidade',
        situacao_cadastral: 2,
        descricao_situacao_cadastral: 'ATIVA',
        data_inicio_atividade: '2020-01-01',
      }),
    })

    const wrapper = createWrapper()
    const { result } = renderHook(() => useOnboardingCnpj('11222333000181'), { wrapper })

    // Before debounce fires — should not have called fetch
    expect(mockFetch).not.toHaveBeenCalled()

    // Advance past 500ms debounce
    act(() => {
      vi.advanceTimersByTime(600)
    })

    // Query should now be enabled and fetch triggered
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('11222333000181'),
    )
  })
})
