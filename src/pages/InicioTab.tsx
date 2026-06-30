import { useFinancasStore } from '@/stores/financas.store'
import { useTransacoesSummary } from '@/hooks/useTransacoesSummary'
import { Skeleton } from '@/components/ui/skeleton'
import { centsToBRL } from '@/utils/currency'
import { useFaturamento } from '@/hooks/useFaturamento'
import FaturamentoGauge from '@/components/FaturamentoGauge'
import FaturamentoAlert from '@/components/FaturamentoAlert'

/**
 * InicioTab — dashboard with FaturamentoGauge (annual billing intelligence)
 * above 4 metric cards for the current month (FIN-05, D-10, D-11, D-01).
 *
 * Shows Skeleton placeholders while data is loading (D-11) — never shows false zero values.
 * All values rendered as JSX text nodes via centsToBRL() — no dangerouslySetInnerHTML (T-04).
 * fatLoading and isLoading are independent — gauge and monthly cards have separate loading states.
 */
export default function InicioTab() {
  const { selectedYear, selectedMonth } = useFinancasStore()
  const { summary, isLoading } = useTransacoesSummary(selectedYear, selectedMonth)
  // Independent loading state — gauge and monthly cards load separately (RESEARCH.md Pitfall 6).
  const { isLoading: fatLoading, totalFaturado, limiteAnual, percentual, projecao, alertaAtivo, empresa } = useFaturamento(selectedYear)

  return (
    <div className="mx-auto max-w-md px-4 py-8 flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-zinc-900">Início</h1>

      <FaturamentoGauge
        totalFaturado={totalFaturado}
        limiteAnual={limiteAnual}
        percentual={percentual}
        projecao={projecao}
        isCaminhoneiro={empresa?.is_caminhoneiro ?? false}
        isLoading={fatLoading}
      />

      {alertaAtivo !== null && (
        <FaturamentoAlert nivel={alertaAtivo} limiteAnual={limiteAnual} />
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border p-4">
            <p className="text-sm text-zinc-500">Saldo</p>
            <p className="text-lg font-semibold text-zinc-900">{centsToBRL(summary.saldo)}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-sm text-zinc-500">Entradas</p>
            <p className="text-lg font-semibold text-green-600">{centsToBRL(summary.entradas)}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-sm text-zinc-500">Saídas</p>
            <p className="text-lg font-semibold text-red-600">{centsToBRL(summary.saidas)}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-sm text-zinc-500">Lucro</p>
            <p className="text-lg font-semibold text-zinc-900">{centsToBRL(summary.lucro)}</p>
          </div>
        </div>
      )}
    </div>
  )
}
