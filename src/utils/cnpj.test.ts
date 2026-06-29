import { describe, it, expect } from 'vitest'
import { stripCnpj, formatCnpj, isValidCnpj } from './cnpj'

describe('stripCnpj', () => {
  it('strips punctuation from a formatted numeric CNPJ', () => {
    expect(stripCnpj('12.345.678/0001-95')).toBe('12345678000195')
  })

  it('strips punctuation from an alphanumeric CNPJ and uppercases letters', () => {
    expect(stripCnpj('AB.CDE.FGH/0001-00')).toBe('ABCDEFGH000100')
  })

  it('returns empty string for empty input', () => {
    expect(stripCnpj('')).toBe('')
  })

  it('preserves already-stripped CNPJ', () => {
    expect(stripCnpj('11222333000181')).toBe('11222333000181')
  })
})

describe('formatCnpj', () => {
  it('returns empty string for empty input', () => {
    expect(formatCnpj('')).toBe('')
  })

  it('returns raw for 2 chars (no separator yet)', () => {
    expect(formatCnpj('12')).toBe('12')
  })

  it('formats 5 chars as XX.XXX', () => {
    expect(formatCnpj('12345')).toBe('12.345')
  })

  it('formats 8 chars as XX.XXX.XXX', () => {
    expect(formatCnpj('12345678')).toBe('12.345.678')
  })

  it('formats 12 chars as XX.XXX.XXX/XXXX', () => {
    expect(formatCnpj('123456780001')).toBe('12.345.678/0001')
  })

  it('formats 14 chars as XX.XXX.XXX/XXXX-XX', () => {
    expect(formatCnpj('12345678000195')).toBe('12.345.678/0001-95')
  })

  it('slices to 14 chars before formatting if input is longer', () => {
    expect(formatCnpj('123456780001950000')).toBe('12.345.678/0001-95')
  })
})

describe('isValidCnpj', () => {
  it('rejects all-same character sequences', () => {
    expect(isValidCnpj('00000000000000')).toBe(false)
    expect(isValidCnpj('11111111111111')).toBe(false)
  })

  it('accepts a known valid CNPJ (11222333000181)', () => {
    expect(isValidCnpj('11222333000181')).toBe(true)
  })

  it('rejects a CNPJ with a bad checksum digit', () => {
    expect(isValidCnpj('11222333000182')).toBe(false)
  })

  it('rejects CNPJ with wrong length (too short)', () => {
    expect(isValidCnpj('1234')).toBe(false)
  })

  it('rejects CNPJ with wrong length (13 chars)', () => {
    expect(isValidCnpj('1122233300018')).toBe(false)
  })

  it('strips formatting before validation', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true)
  })
})
