/**
 * Currency utilities for MEIME.
 * D-09: All monetary values are stored as INTEGER centavos.
 * These functions are the ONLY place monetary conversion happens.
 */

/**
 * Converts centavos (integer) to a formatted BRL currency string.
 * Example: centsToBRL(1234) → "R$ 12,34"
 */
export function centsToBRL(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100)
}

/**
 * Converts a BRL-formatted string or number to centavos (integer).
 * Examples:
 *   BRLtoCents("12,34")     → 1234
 *   BRLtoCents("1.234,56")  → 123456
 *   BRLtoCents(12.34)       → 1234
 */
export function BRLtoCents(brl: string | number): number {
  if (typeof brl === 'number') {
    return Math.round(brl * 100)
  }
  // Remove thousand separators (dots), then replace comma decimal separator with dot
  const normalized = brl
    .replace(/\./g, '')   // remove thousand separators
    .replace(',', '.')    // replace decimal comma with dot
    .replace(/[^0-9.]/g, '') // strip any remaining non-numeric chars (R$, spaces, etc.)
  return Math.round(parseFloat(normalized) * 100)
}
