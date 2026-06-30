import { useState, useCallback } from 'react'
import { centsToBRL } from '@/utils/currency'

/**
 * Push-right currency input hook (D-06, D-07, D-08).
 * Stores value as integer centavos — never float (D-09).
 * Each digit typed shifts digits left (like a cash register).
 *
 * Fixes iOS Safari decimal comma bug: user types only digits via inputMode="numeric".
 * The /\D/g strip on handleChange makes backspace naturally safe:
 * "R$ 12,34" → strip → "1234" → parseInt → 1234 (idempotent).
 *
 * Security: guards against values > 999_999_999 centavos (< R$ 10M) — T-03-02.
 *
 * Usage:
 *   const { cents, displayValue, handleChange, reset, setCents } = useCurrencyInput()
 *
 *   <input
 *     type="text"
 *     inputMode="numeric"
 *     value={displayValue}
 *     onChange={handleChange}
 *   />
 */
export function useCurrencyInput(initialCents = 0) {
  const [cents, setCents] = useState<number>(initialCents)

  // Derived synchronously — no extra state needed
  const displayValue = centsToBRL(cents)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip everything except digits — handles iOS Safari backspace naturally
    const digits = e.target.value.replace(/\D/g, '')

    if (digits === '') {
      setCents(0)
      return
    }

    const newCents = parseInt(digits, 10)

    // T-03-02: guard against absurd values (> R$ 9.999.999,99)
    if (newCents > 999_999_999) return

    setCents(newCents)
  }, [])

  const reset = useCallback(() => setCents(0), [])

  return { cents, displayValue, handleChange, reset, setCents }
}
