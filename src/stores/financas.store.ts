import { create } from 'zustand'
import type { Transacao } from '@/services/transacao.service'

/**
 * Pitfall 6 prevention: new Date() is called ONCE at module load time (outside create()).
 * This prevents stale-date issues during hydration and ensures the store always
 * initializes to the month at import time — not at first render.
 */
const now = new Date()

/**
 * Portuguese month names (1-indexed via month - 1).
 * Usage: MONTHS_PT[selectedMonth - 1]  → 'Janeiro', 'Fevereiro', etc.
 */
export const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Marco',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

/**
 * Returns the year/month before the given month.
 * Wraps: month 1 → December of the previous year.
 */
export function prevMonth(
  year: number,
  month: number,
): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 }
  return { year, month: month - 1 }
}

/**
 * Returns the year/month after the given month.
 * Wraps: month 12 → January of the next year.
 */
export function nextMonth(
  year: number,
  month: number,
): { year: number; month: number } {
  if (month === 12) return { year: year + 1, month: 1 }
  return { year, month: month + 1 }
}

interface FinancasStore {
  /** The calendar year currently shown in the month navigator (D-16). */
  selectedYear: number
  /** The month (1-12, NOT 0-indexed) currently shown in the month navigator (D-16). */
  selectedMonth: number
  /** True when the TransactionSheet bottom-sheet is open (D-01). */
  sheetOpen: boolean
  /**
   * null  = create mode (FAB tap or "Adicionar primeiro lançamento").
   * non-null = edit mode (list item tap) — TransactionSheet pre-fills from this (D-05).
   */
  editingTransaction: Transacao | null

  /** Update both year and month together (month navigator prev/next buttons). */
  setSelectedMonth: (year: number, month: number) => void
  /**
   * Open the TransactionSheet.
   * Pass a Transacao to open in edit mode; omit for create mode.
   */
  openSheet: (transaction?: Transacao) => void
  /** Close the TransactionSheet and clear editingTransaction. */
  closeSheet: () => void
}

/**
 * Zustand UI state store for the Finanças feature (D-01, D-05, D-16).
 *
 * Provides:
 * - selectedYear / selectedMonth: current month navigator position (opens at today).
 * - sheetOpen / editingTransaction: TransactionSheet open/close + edit context.
 * - setSelectedMonth, openSheet, closeSheet: event-driven setters.
 *
 * Consumed by: AppShell (FAB + TransactionSheet), FinancasTab (month nav + list).
 * Pattern mirrors empresa.store.ts exactly.
 */
export const useFinancasStore = create<FinancasStore>((set) => ({
  selectedYear: now.getFullYear(),
  selectedMonth: now.getMonth() + 1, // getMonth() is 0-indexed; store is 1-indexed

  sheetOpen: false,
  editingTransaction: null,

  setSelectedMonth: (year, month) => set({ selectedYear: year, selectedMonth: month }),

  openSheet: (transaction) =>
    set({
      sheetOpen: true,
      editingTransaction: transaction ?? null,
    }),

  closeSheet: () => set({ sheetOpen: false, editingTransaction: null }),
}))
