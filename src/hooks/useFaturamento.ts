import { useQuery } from '@tanstack/react-query'
import { transacaoService, type Transacao } from '@/services/transacao.service'
import { useEmpresaStore } from '@/stores/empresa.store'
import {
  calcLimiteAnual,
  calcTotalFaturado,
  calcPercentual,
  calcProjecao,
  calcAlertaAtivo,
  type ProjecaoResult,
  type AlertaNivel,
} from '@/utils/faturamento'

/**
 * TanStack Query hook for annual billing intelligence.
 *
 * D-21: queryKey starts with 'transacoes' — invalidateQueries(['transacoes'])
 *       called after mutations will auto-invalidate this hook's cache.
 * D-20: staleTime is 0 — always refetch on mount to guarantee fresh gauge data.
 * Pitfall 4: isLoading is `isLoading || empresa === null` — ensures the gauge
 *            shows skeleton while EmpresaProvider is still booting, even if
 *            useQuery has technically resolved with empty data (enabled was false).
 * Pitfall 2: queryKey must start with 'transacoes' for auto-invalidation after
 *            mutations (add/edit/delete transaction).
 *
 * Security: enabled: !!empresa prevents the Supabase query from running when
 *           empresa has not yet been loaded, avoiding accidental empty-result
 *           data leakage during boot (T-04-04).
 */
export function useFaturamento(year: number) {
  const { empresa } = useEmpresaStore()

  const { data: transacoes = [], isLoading, error } = useQuery<Transacao[], Error>({
    queryKey: ['transacoes', year, 'faturamento'],
    queryFn: () => transacaoService.getByYear(year),
    staleTime: 0,
    retry: false,
    enabled: !!empresa,
  })

  const limiteAnual = calcLimiteAnual(empresa, year)
  const totalFaturado = calcTotalFaturado(transacoes)
  const percentual = calcPercentual(totalFaturado, limiteAnual)
  const projecao: ProjecaoResult = calcProjecao(totalFaturado, limiteAnual, year)
  const alertaAtivo: AlertaNivel | null = calcAlertaAtivo(totalFaturado, limiteAnual, percentual)

  return {
    isLoading: isLoading || empresa === null,
    error,
    empresa,
    limiteAnual,
    totalFaturado,
    percentual,
    projecao,
    alertaAtivo,
  }
}
