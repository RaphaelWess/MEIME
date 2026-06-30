import { useFinancasStore } from '@/stores/financas.store'
import { useTransacoesSummary } from '@/hooks/useTransacoesSummary'
import { Skeleton } from '@/components/ui/skeleton'
import { centsToBRL } from '@/utils/currency'

/**
 * InicioTab — dashboard with 4 metric cards for the current month (FIN-05, D-10, D-11).
 *
 * Shows Skeleton placeholders while data is loading (D-11) — never shows false zero values.
 * All values rendered as JSX text nodes via centsToBRL() — no dangerouslySetInnerHTML (T-04).
 */
export default function InicioTab() {
  const { selectedYear, selectedMonth } = useFinancasStore()
  const { summary, isLoading } = useTransacoesSummary(selectedYear, selectedMonth)

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900 mb-6">Início</h1>

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
