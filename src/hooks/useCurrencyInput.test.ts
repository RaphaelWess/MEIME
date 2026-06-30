import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCurrencyInput } from './useCurrencyInput'

describe('useCurrencyInput', () => {
  it('initialCents=0 yields displayValue containing "R$" and "0,00"', () => {
    const { result } = renderHook(() => useCurrencyInput(0))
    expect(result.current.displayValue).toContain('R$')
    expect(result.current.displayValue).toContain('0,00')
  })

  it('handleChange with e.target.value="1234" sets cents=1234 and displayValue contains "12,34"', () => {
    const { result } = renderHook(() => useCurrencyInput(0))
    act(() => {
      result.current.handleChange({ target: { value: '1234' } } as React.ChangeEvent<HTMLInputElement>)
    })
    expect(result.current.cents).toBe(1234)
    expect(result.current.displayValue).toContain('12,34')
  })

  it('handleChange with e.target.value="" sets cents=0', () => {
    const { result } = renderHook(() => useCurrencyInput(500))
    act(() => {
      result.current.handleChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)
    })
    expect(result.current.cents).toBe(0)
  })

  it('handleChange with value > 999999999 centavos leaves cents unchanged (guard fires)', () => {
    const { result } = renderHook(() => useCurrencyInput(100))
    act(() => {
      result.current.handleChange({ target: { value: '9999999999' } } as React.ChangeEvent<HTMLInputElement>)
    })
    expect(result.current.cents).toBe(100)
  })

  it('reset() sets cents=0', () => {
    const { result } = renderHook(() => useCurrencyInput(1234))
    act(() => {
      result.current.reset()
    })
    expect(result.current.cents).toBe(0)
  })
})
