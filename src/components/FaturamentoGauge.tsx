import { Skeleton } from '@/components/ui/skeleton'
import { centsToBRL } from '@/utils/currency'
import { MONTHS_PT } from '@/stores/financas.store'
import type { ProjecaoResult } from '@/utils/faturamento'
import { THRESHOLD_DESENQUADRAMENTO } from '@/utils/faturamento'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FaturamentoGaugeProps {
  totalFaturado: number
  limiteAnual: number
  percentual: number
  projecao: ProjecaoResult
  isCaminhoneiro: boolean
  isLoading: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the fill color for the gauge bar based on severity.
 * Checks desenquadramento threshold first (most severe), then percentage thresholds.
 */
function getGaugeColor(percentual: number, totalFaturado: number): string {
  if (totalFaturado >= THRESHOLD_DESENQUADRAMENTO) return '#991B1B'
  if (percentual >= 100) return '#DC2626'
  if (percentual >= 90) return '#F97316'
  if (percentual >= 70) return '#EAB308'
  return '#16A34A'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FaturamentoGauge({
  totalFaturado,
  limiteAnual,
  percentual,
  projecao,
  isCaminhoneiro,
  isLoading,
}: FaturamentoGaugeProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border p-4 flex flex-col gap-3">
        <Skeleton className="h-5 rounded" />
        <Skeleton className="h-4 rounded w-3/4" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border p-4 flex flex-col gap-3">
      {/* Heading row */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-zinc-700">Limite Anual</span>
        {isCaminhoneiro && (
          <span className="text-xs font-medium bg-blue-100 text-blue-700 rounded px-2 py-0.5">
            Caminhoneiro
          </span>
        )}
      </div>

      {/* Bar row */}
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-valuenow={Math.min(percentual, 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Faturamento anual consumido"
          className="flex-1 bg-zinc-100 rounded-full h-3 overflow-hidden"
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-in-out"
            style={{
              width: Math.min(percentual, 100) + '%',
              backgroundColor: getGaugeColor(percentual, totalFaturado),
            }}
          />
        </div>
        <span className="text-lg font-semibold text-zinc-900 shrink-0">
          {Math.round(percentual)}%
        </span>
      </div>

      {/* Consumed line */}
      <p className="text-sm text-zinc-500">
        {centsToBRL(totalFaturado)} de {centsToBRL(limiteAnual)} consumidos
      </p>

      {/* Projection line */}
      {projecao.tipo === 'dentro_do_limite' && (
        <p className="text-sm text-zinc-500">
          Na projeção atual, você termina o ano dentro do limite.
        </p>
      )}
      {projecao.tipo === 'mes_ano' && (
        <p className="text-sm text-zinc-500">
          Projeção: você atinge o limite em {MONTHS_PT[projecao.mes - 1]}/{projecao.ano}
        </p>
      )}
    </div>
  )
}
