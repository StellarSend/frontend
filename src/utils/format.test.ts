import { describe, it, expect } from 'vitest'
import { formatAmount, formatCurrency, formatDate, formatDateTime } from './format'

describe('formatAmount', () => {
  it('formats with 2 decimal places', () => expect(formatAmount(1234.5)).toBe('1,234.50'))
  it('formats with 4 decimal places', () => expect(formatAmount(1.5, 4)).toBe('1.5000'))
})

describe('formatCurrency', () => {
  it('formats USD', () => expect(formatCurrency(10)).toContain('10.00'))
})

describe('formatDate and formatDateTime consolidation (#28)', () => {
  it('formats valid ISO date string without time', () => {
    const res = formatDate('2026-07-15T12:00:00Z')
    expect(res).toContain('Jul')
    expect(res).toContain('15')
    expect(res).toContain('2026')
  })

  it('formats Date instance', () => {
    const d = new Date('2026-07-15T12:00:00Z')
    const res = formatDate(d)
    expect(res).toContain('Jul')
    expect(res).toContain('15')
    expect(res).toContain('2026')
  })

  it('formats valid ISO date string with time using formatDateTime', () => {
    const res = formatDateTime('2026-07-15T12:00:00Z')
    expect(res).toContain('Jul')
    expect(res).toContain('15')
    expect(res).toContain('2026')
  })

  it('gracefully returns unparseable string on invalid date input', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
    expect(formatDateTime('invalid-date')).toBe('invalid-date')
  })
})
