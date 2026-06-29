import { describe, it, expect } from 'vitest'
import { centsToBRL, BRLtoCents } from './currency'

describe('centsToBRL', () => {
  it('converts 1234 cents to formatted BRL string containing 12,34 and R$', () => {
    const result = centsToBRL(1234)
    expect(result).toContain('12,34')
    expect(result).toContain('R$')
  })

  it('converts 0 cents to formatted BRL string containing 0,00', () => {
    const result = centsToBRL(0)
    expect(result).toContain('0,00')
  })

  it('converts 100 cents to formatted BRL string containing 1,00', () => {
    const result = centsToBRL(100)
    expect(result).toContain('1,00')
  })
})

describe('BRLtoCents', () => {
  it('converts "12,34" string to 1234 cents', () => {
    expect(BRLtoCents('12,34')).toBe(1234)
  })

  it('converts "0,00" string to 0 cents', () => {
    expect(BRLtoCents('0,00')).toBe(0)
  })

  it('converts "1.234,56" string (with thousand separator) to 123456 cents', () => {
    expect(BRLtoCents('1.234,56')).toBe(123456)
  })

  it('converts number 12.34 to 1234 cents', () => {
    expect(BRLtoCents(12.34)).toBe(1234)
  })
})
