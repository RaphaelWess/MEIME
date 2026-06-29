import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { isValidCnpj } from '../utils/cnpj'

/**
 * Data shape returned from BrasilAPI CNPJ endpoint.
 * Normalized to this shape from OpenCNPJ fallback as well.
 */
export type CnpjData = {
  cnpj: string
  razao_social: string
  nome_fantasia: string
  cnae_fiscal: number
  cnae_fiscal_descricao: string
  situacao_cadastral: number              // integer (e.g. 2)
  descricao_situacao_cadastral: string    // string (e.g. "ATIVA")
  data_inicio_atividade: string
}

/**
 * Internal hook: debounces a CNPJ string by 500ms.
 * Prevents API calls on every keystroke.
 */
function useDebouncedCnpj(rawCnpj: string): string {
  const [debouncedCnpj, setDebouncedCnpj] = useState(rawCnpj)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCnpj(rawCnpj)
    }, 500)

    return () => clearTimeout(timer)
  }, [rawCnpj])

  return debouncedCnpj
}

/**
 * Fetch CNPJ data from BrasilAPI, with OpenCNPJ as fallback.
 * Throws 'CNPJ_NOT_FOUND' for 404 responses, 'API_ERROR' for other failures.
 */
async function fetchCnpjWithFallback(cnpj: string): Promise<CnpjData> {
  const brasilRes = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)

  if (brasilRes.ok) {
    return brasilRes.json() as Promise<CnpjData>
  }

  // Fallback to OpenCNPJ
  const openRes = await fetch(`https://api.opencnpj.org/cnpj/${cnpj}`)

  if (openRes.ok) {
    // Normalize OpenCNPJ response to BrasilAPI shape
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = await openRes.json() as any
    return {
      cnpj: raw.cnpj ?? cnpj,
      razao_social: raw.razao_social ?? raw.nome ?? '',
      nome_fantasia: raw.nome_fantasia ?? raw.fantasia ?? '',
      cnae_fiscal: raw.cnae_fiscal ?? raw.atividade_principal?.[0]?.code ?? 0,
      cnae_fiscal_descricao: raw.cnae_fiscal_descricao ?? raw.atividade_principal?.[0]?.text ?? '',
      situacao_cadastral: raw.situacao_cadastral ?? 0,
      descricao_situacao_cadastral: raw.descricao_situacao_cadastral ?? raw.situacao ?? '',
      data_inicio_atividade: raw.data_inicio_atividade ?? raw.abertura ?? '',
    }
  }

  // Both APIs failed
  throw new Error(brasilRes.status === 404 ? 'CNPJ_NOT_FOUND' : 'API_ERROR')
}

/**
 * Hook that looks up CNPJ data from BrasilAPI (with OpenCNPJ fallback).
 * - Debounces rawCnpj by 500ms before triggering the query
 * - Only enabled when rawCnpj is 14 chars AND passes isValidCnpj
 * - Results cached for 1 hour (staleTime)
 *
 * @param rawCnpj - Stripped (unformatted) CNPJ string from useCnpjMask
 */
export function useOnboardingCnpj(rawCnpj: string) {
  const debouncedCnpj = useDebouncedCnpj(rawCnpj)
  const isReady = debouncedCnpj.length === 14 && isValidCnpj(debouncedCnpj)

  return useQuery<CnpjData, Error>({
    queryKey: ['cnpj', debouncedCnpj],
    queryFn: () => fetchCnpjWithFallback(debouncedCnpj),
    enabled: isReady,
    retry: false,
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}
