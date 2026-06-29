/**
 * CNPJ utilities — supports both numeric and alphanumeric CNPJ
 * (alphanumeric CNPJ live since July 6, 2026 per Receita Federal spec).
 */

/**
 * Strip all non-alphanumeric characters from a CNPJ string and uppercase letters.
 * Accepts A-Z in addition to 0-9 for alphanumeric CNPJ support.
 */
export function stripCnpj(value: string): string {
  return value.replace(/[^A-Z0-9]/gi, '').toUpperCase()
}

/**
 * Apply progressive CNPJ mask to a raw (already stripped) string.
 * Input is sliced to 14 chars max before applying the mask.
 *
 * Progressive masks:
 *   0-2  chars: raw
 *   3-5  chars: XX.XXX
 *   6-8  chars: XX.XXX.XXX
 *   9-12 chars: XX.XXX.XXX/XXXX
 *  13-14 chars: XX.XXX.XXX/XXXX-XX
 */
export function formatCnpj(raw: string): string {
  const s = raw.slice(0, 14)
  const len = s.length

  if (len === 0) return ''
  if (len <= 2) return s
  if (len <= 5) return `${s.slice(0, 2)}.${s.slice(2)}`
  if (len <= 8) return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5)}`
  if (len <= 12) return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}/${s.slice(8)}`
  return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}/${s.slice(8, 12)}-${s.slice(12)}`
}

/**
 * Validate a CNPJ using the ASCII-minus-48 modulo-11 algorithm.
 * Supports both numeric (0-9) and alphanumeric (A-Z = code 17-42) CNPJs.
 * Strips formatting before validation.
 *
 * Algorithm:
 * - weights1 = [5,4,3,2,9,8,7,6,5,4,3,2] applied to first 12 chars
 * - dv1 = sum1 % 11 < 2 ? 0 : 11 - (sum1 % 11)
 * - weights2 = [6,5,4,3,2,9,8,7,6,5,4,3,2] applied to first 13 chars
 * - dv2 = sum2 % 11 < 2 ? 0 : 11 - (sum2 % 11)
 */
export function isValidCnpj(value: string): boolean {
  const s = stripCnpj(value)

  if (s.length !== 14) return false

  // Reject all-same character sequences
  if (/^(.)\1+$/.test(s)) return false

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  // charCodeAt(i) - 48 handles both '0'-'9' (→0-9) and 'A'-'Z' (→17-42)
  const sum1 = weights1.reduce((acc, w, i) => acc + w * (s.charCodeAt(i) - 48), 0)
  const dv1 = sum1 % 11 < 2 ? 0 : 11 - (sum1 % 11)

  const sum2 = weights2.reduce((acc, w, i) => acc + w * (s.charCodeAt(i) - 48), 0)
  const dv2 = sum2 % 11 < 2 ? 0 : 11 - (sum2 % 11)

  return s[12] === String(dv1) && s[13] === String(dv2)
}
