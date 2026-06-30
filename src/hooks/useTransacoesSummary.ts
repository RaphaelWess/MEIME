import { useTransacoes } from './useTransacoes'

/**
 * Summary of a month's transactions — all values are centavos integers (D-09).
 *
 * D-10: InicioTab displays these 4 metric cards for the current month.
 * entradas: sum of tipo='entrada' transactions (centavos)
 * saidas: sum of tipo='saida' transactions (centavos)
 * saldo: entradas - saidas (can be negative)
 * lucro: alias of saldo — MEI terminology (D-10)
 */
export interface TransacoesSummary {
  entradas: number   // centavos
  saidas: number     // centavos
  saldo: number      // entradas - saidas (can be negative)
  lucro: number      // alias of saldo — same value
}

/**
 * Derives aggregated monthly metrics from cached useTransacoes data.
 *
 * Calls useTransacoes internally — no separate Supabase query.
 * isLoading and error are forwarded from the underlying query.
 *
 * T-03-W4-01: Summary is pure arithmetic on server-returned integers —
 * no external input, no injection surface.
 */
export function useTransacoesSummary(year: number, month: number) {
  const { data: transacoes = [], isLoading, error } = useTransacoes(year, month)

  const summary = transacoes.reduce<TransacoesSummary>(
    (acc, t) => {
      if (t.tipo === 'entrada') acc.entradas += t.valor
      else acc.saidas += t.valor
      return acc
    },
    { entradas: 0, saidas: 0, saldo: 0, lucro: 0 }
  )

  summary.saldo = summary.entradas - summary.saidas
  summary.lucro = summary.saldo

  return { summary, isLoading, error }
}
