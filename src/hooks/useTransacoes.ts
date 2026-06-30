import { useQuery } from '@tanstack/react-query'
import { transacaoService, type Transacao } from '@/services/transacao.service'

/**
 * TanStack Query hook for fetching transactions by month.
 *
 * D-20: staleTime is 0 — always refetch on mount to guarantee fresh data.
 * queryKey ['transacoes', year, month] — 'transacoes' namespace matches
 * invalidateQueries(['transacoes']) used after mutations (D-21).
 * retry: false — project-wide standard (same as useOnboardingCnpj).
 *
 * Security: RLS on transacoes table (`using ((select auth.uid()) = user_id)`)
 * enforces user isolation server-side — no explicit user_id filter needed (T-03-01).
 */
export function useTransacoes(year: number, month: number) {
  return useQuery<Transacao[], Error>({
    queryKey: ['transacoes', year, month],
    queryFn: () => transacaoService.getByMonth(year, month),
    staleTime: 0,
    retry: false,
  })
}
