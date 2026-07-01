import { describe, it, expect } from 'vitest'
import { isValidStellarAddress, truncateAddress, xlmToStroops, stroopsToXlm } from './stellar'

const VALID = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'

describe('isValidStellarAddress', () => {
  it('accepts valid G address', () => expect(isValidStellarAddress(VALID)).toBe(true))
  it('rejects short address', () => expect(isValidStellarAddress('GABCD')).toBe(false))
  it('rejects empty string', () => expect(isValidStellarAddress('')).toBe(false))
})

describe('truncateAddress', () => {
  it('truncates long address', () => {
    expect(truncateAddress(VALID)).toMatch(/^GBBD47…/)
  })
})

describe('xlmToStroops', () => {
  it('converts 1 XLM to 10M stroops', () => expect(xlmToStroops(1)).toBe(10_000_000n))
})

describe('stroopsToXlm', () => {
  it('converts 10M stroops to 1 XLM', () => expect(stroopsToXlm(10_000_000n)).toBe(1))
})
