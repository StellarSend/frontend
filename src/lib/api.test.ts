import { describe, it, expect } from 'vitest'
import { horizonUrl } from './api'

describe('horizonUrl', () => {
  it('returns the testnet Horizon host for network "testnet"', () => {
    expect(horizonUrl('testnet')).toBe('https://horizon-testnet.stellar.org')
  })

  it('returns the mainnet Horizon host for network "mainnet"', () => {
    expect(horizonUrl('mainnet')).toBe('https://horizon.stellar.org')
  })
})
