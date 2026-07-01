import { describe, it, expect } from 'vitest'
import { formatAmount, formatDate, formatCurrency } from './format'

describe('formatAmount', () => {
  it('formats with 2 decimal places', () => expect(formatAmount(1234.5)).toBe('1,234.50'))
  it('formats with 4 decimal places', () => expect(formatAmount(1.5, 4)).toBe('1.5000'))
})

describe('formatCurrency', () => {
  it('formats USD', () => expect(formatCurrency(10)).toContain('10.00'))
})
