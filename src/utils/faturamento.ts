/**
 * Faturamento calculation utilities for MEIME.
 * D-09: All monetary values are INTEGER centavos — never float.
 * D-10: Alert hierarchy — desenquadramento (97200) > 100% > 90% > 70%.
 * D-15: Projection is hidden in January (0 complete months) or when monthly average is zero.
 * D-16: Projection returns 'dentro_do_limite' when extrapolated breach date exceeds currentYear.
 */

import type { EmpresaMei } from '@/services/empresa.service'
import type { Transacao } from '@/services/transacao.service'

// ---------------------------------------------------------------------------
// Constants — all monetary values as INTEGER centavos (never float)
// ---------------------------------------------------------------------------

/** R$ 81.000,00 — annual MEI revenue limit (standard) */
export const LIMITE_MEI_PADRAO = 8_100_000

/** R$ 251.600,00 — annual MEI revenue limit for MEI Caminhoneiro */
export const LIMITE_CAMINHONEIRO = 25_160_000

/**
 * R$ 97.200,00 — mandatory desenquadramento threshold.
 * Exceeding this triggers the most severe alert (D-10).
 */
export const THRESHOLD_DESENQUADRAMENTO = 9_720_000

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Discriminated union result from calcProjecao.
 * - 'hidden'          — not enough data to project (Jan, or zero revenue)
 * - 'dentro_do_limite' — projected to stay within limit through year end
 * - 'mes_ano'         — projected breach month/year (or already exceeded)
 */
export type ProjecaoResult =
  | { tipo: 'hidden' }
  | { tipo: 'dentro_do_limite' }
  | { tipo: 'mes_ano'; mes: number; ano: number }

/**
 * Active alert threshold level.
 * Values correspond to the percentage thresholds (70, 90, 100) and
 * the desenquadramento centavo threshold (97200 = R$ 97.200).
 */
export type AlertaNivel = 70 | 90 | 100 | 97200

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------

/**
 * Calculates the applicable annual MEI revenue limit for the given company and year.
 *
 * - empresa null → full LIMITE_MEI_PADRAO
 * - is_caminhoneiro → uses LIMITE_CAMINHONEIRO as base
 * - data_abertura_mei null → full base limit (no proration)
 * - data_abertura_mei.year < currentYear → full base limit (company existed all year)
 * - data_abertura_mei.year === currentYear → proportional limit: mesesRestantes/12 × base
 *
 * Uses getUTCFullYear()/getUTCMonth() to avoid timezone offset bugs (Pitfall 1).
 * Uses Math.round() to avoid float precision issues (Pitfall 3, T-04-03).
 */
export function calcLimiteAnual(empresa: EmpresaMei | null, currentYear: number): number {
  const limiteBase = empresa?.is_caminhoneiro ? LIMITE_CAMINHONEIRO : LIMITE_MEI_PADRAO

  if (empresa === null || empresa.data_abertura_mei === null) {
    return limiteBase
  }

  const abertura = new Date(empresa.data_abertura_mei)
  const aberturaYear = abertura.getUTCFullYear()

  if (aberturaYear < currentYear) {
    return limiteBase
  }

  // aberturaYear === currentYear: prorate from opening month through December
  const mesAbertura = abertura.getUTCMonth() + 1 // 1-indexed (January = 1)
  const mesesRestantes = 12 - (mesAbertura - 1)

  return Math.round((mesesRestantes / 12) * limiteBase)
}

/**
 * Sums the valor of all transactions in the array.
 * Input should be pre-filtered to tipo='entrada' by getByYear (D-04).
 * Returns 0 for an empty array.
 */
export function calcTotalFaturado(transacoes: Transacao[]): number {
  return transacoes.reduce((acc, t) => acc + t.valor, 0)
}

/**
 * Returns the percentage of the annual limit consumed.
 * Result can exceed 100 if the limit has been surpassed.
 * Returns 0 when limiteAnual is 0 to avoid division by zero.
 */
export function calcPercentual(totalFaturado: number, limiteAnual: number): number {
  if (limiteAnual === 0) return 0
  return (totalFaturado / limiteAnual) * 100
}

/**
 * Projects whether the annual limit will be breached this year based on monthly average.
 *
 * @param totalFaturado  - Sum of entradas so far this year (centavos)
 * @param limiteAnual    - Applicable annual limit (centavos)
 * @param currentYear    - The year being analyzed
 * @param today          - Injectable for tests; defaults to new Date()
 *
 * Logic:
 * - mesesDecorridos = today.getMonth() (0-indexed = count of complete months elapsed since Jan 1)
 * - mesesDecorridos < 1 → 'hidden' (in January — no complete month to average)
 * - mediaFaturamentoMensal = totalFaturado / mesesDecorridos
 * - media === 0 → 'hidden' (no revenue yet)
 * - limiteRestante <= 0 → already exceeded → 'mes_ano' with current month/year
 * - mesesParaEstourar = ceil(limiteRestante / media)
 * - if projected breach is after currentYear → 'dentro_do_limite'
 * - else → 'mes_ano' with projected month/year
 */
export function calcProjecao(
  totalFaturado: number,
  limiteAnual: number,
  currentYear: number,
  today: Date = new Date(),
): ProjecaoResult {
  const mesesDecorridos = today.getMonth() // 0-indexed: Jan=0 (0 complete months elapsed)

  if (mesesDecorridos < 1) {
    return { tipo: 'hidden' }
  }

  const mediaFaturamentoMensal = Math.round(totalFaturado / mesesDecorridos)

  if (mediaFaturamentoMensal === 0) {
    return { tipo: 'hidden' }
  }

  const limiteRestante = limiteAnual - totalFaturado

  if (limiteRestante <= 0) {
    return { tipo: 'mes_ano', mes: today.getMonth() + 1, ano: currentYear }
  }

  const mesesParaEstourar = Math.ceil(limiteRestante / mediaFaturamentoMensal)

  // Calculate target month using pure arithmetic (avoids Date rollover issues)
  const targetMonth0 = today.getMonth() + mesesParaEstourar // 0-indexed offset
  const targetYear = currentYear + Math.floor(targetMonth0 / 12)
  const targetMonth = (targetMonth0 % 12) + 1 // back to 1-indexed

  if (targetYear > currentYear) {
    return { tipo: 'dentro_do_limite' }
  }

  return { tipo: 'mes_ano', mes: targetMonth, ano: targetYear }
}

/**
 * Returns the active alert level based on D-10 severity hierarchy.
 * Checks in order from most severe to least severe:
 * 1. totalFaturado >= THRESHOLD_DESENQUADRAMENTO (R$ 97.200) → 97200
 * 2. percentual >= 100% → 100
 * 3. percentual >= 90% → 90
 * 4. percentual >= 70% → 70
 * 5. None of the above → null
 */
export function calcAlertaAtivo(
  totalFaturado: number,
  limiteAnual: number,
  percentual: number,
): AlertaNivel | null {
  if (totalFaturado >= THRESHOLD_DESENQUADRAMENTO) return 97200
  if (percentual >= 100) return 100
  if (percentual >= 90) return 90
  if (percentual >= 70) return 70
  return null
}
