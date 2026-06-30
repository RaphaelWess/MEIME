import { useFinancasStore, prevMonth, nextMonth, MONTHS_PT } from '@/stores/financas.store'
import { useTransacoes } from '@/hooks/useTransacoes'
import { useTransacoesSummary } from '@/hooks/useTransacoesSummary'
import { Skeleton } from '@/components/ui/skeleton'
import { centsToBRL } from '@/utils/currency'
import type { Transacao } from '@/services/transacao.service'

/**
 * FinancasTab — month-filtered transaction list with navigator, compact summary, and empty state.
 *
 * D-12: month navigator with back/forward buttons, current month/year label.
 * D-13: transaction list — valor color (green/red), categoria, PF/PJ badge, dd/mm date.
 * D-14: empty state with 'Adicionar primeiro lançamento' CTA when list is empty.
 * D-15: Skeleton rows while list is loading.
 * D-16: opens at current month; no restriction on navigating to future months.
 * D-17: tapping a transaction opens TransactionSheet in edit mode via openSheet(transaction).
 *
 * All values rendered as JSX text nodes — no dangerouslySetInnerHTML (T-04).
 */
export default function FinancasTab() {
  const { selectedYear, selectedMonth, setSelectedMonth, openSheet } = useFinancasStore()
  const { data: transacoes = [], isLoading: listLoading } = useTransacoes(selectedYear, selectedMonth)
  const { summary, isLoading: summaryLoading } = useTransacoesSummary(selectedYear, selectedMonth)

  function handlePrevMonth() {
    const { year, month } = prevMonth(selectedYear, selectedMonth)
    setSelectedMonth(year, month)
  }

  function handleNextMonth() {
    const { year, month } = nextMonth(selectedYear, selectedMonth)
    setSelectedMonth(year, month)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900 mb-4">Finanças</h1>

      {/* Month navigator (D-12, D-16) */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-600"
          aria-label="Mês anterior"
        >
          {'<'}
        </button>
        <span className="text-sm font-medium text-zinc-700">
          {MONTHS_PT[selectedMonth - 1]} {selectedYear}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-600"
          aria-label="Próximo mês"
        >
          {'>'}
        </button>
      </div>

      {/* Compact summary row (D-12) */}
      <div className="flex gap-3 mb-6">
        {summaryLoading ? (
          <>
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 flex-1 rounded-lg" />
          </>
        ) : (
          <>
            <div className="flex-1 rounded-lg border px-3 py-2 text-center">
              <p className="text-xs text-zinc-500">Entradas</p>
              <p className="text-sm font-semibold text-green-600">{centsToBRL(summary.entradas)}</p>
            </div>
            <div className="flex-1 rounded-lg border px-3 py-2 text-center">
              <p className="text-xs text-zinc-500">Saídas</p>
              <p className="text-sm font-semibold text-red-600">{centsToBRL(summary.saidas)}</p>
            </div>
            <div className="flex-1 rounded-lg border px-3 py-2 text-center">
              <p className="text-xs text-zinc-500">Lucro</p>
              <p className="text-sm font-semibold text-zinc-900">{centsToBRL(summary.lucro)}</p>
            </div>
          </>
        )}
      </div>

      {/* Transaction list (D-13, D-14, D-15) */}
      {listLoading ? (
        <div>
          <Skeleton className="h-14 rounded-lg mb-2" />
          <Skeleton className="h-14 rounded-lg mb-2" />
          <Skeleton className="h-14 rounded-lg mb-2" />
        </div>
      ) : transacoes.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <p className="text-zinc-500 mb-4">Nenhum lançamento neste mês.</p>
          <button
            type="button"
            onClick={() => openSheet()}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Adicionar primeiro lançamento
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {transacoes.map((t: Transacao) => (
            <button
              key={t.id}
              type="button"
              onClick={() => openSheet(t)}
              className="w-full flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-zinc-50 text-left"
            >
              <span
                className={`text-base font-semibold ${
                  t.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {centsToBRL(t.valor)}
              </span>
              <span className="flex-1 mx-3 text-sm text-zinc-600 truncate">{t.categoria}</span>
              <div className="flex items-center gap-2 shrink-0">
                {t.tipo_pessoa !== null && (
                  <span className="text-xs rounded px-1.5 py-0.5 bg-zinc-100 text-zinc-600">
                    {t.tipo_pessoa}
                  </span>
                )}
                <span className="text-xs text-zinc-400">
                  {t.data.slice(8, 10)}/{t.data.slice(5, 7)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
