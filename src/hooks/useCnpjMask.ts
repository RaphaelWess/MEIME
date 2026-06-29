import { useState } from 'react'
import { stripCnpj, formatCnpj } from '../utils/cnpj'

/**
 * Controlled CNPJ input hook.
 * Maintains both a raw (stripped) value and a formatted (masked) value.
 * Use `raw` for API calls and validation, `masked` for the input display value.
 */
export function useCnpjMask() {
  const [raw, setRaw] = useState('')
  const [masked, setMasked] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const stripped = stripCnpj(e.target.value).slice(0, 14)
    setRaw(stripped)
    setMasked(formatCnpj(stripped))
  }

  return { raw, masked, handleChange }
}
