import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchExchangeRate, DEFAULT_FALLBACK_XLM_USD } from './exchangeRate'

describe('fetchExchangeRate', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('fetches price from CoinGecko when available', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('coingecko.com')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ stellar: { usd: 0.1542 } }),
        })
      }
      return Promise.reject(new Error('Unknown url'))
    })

    const res = await fetchExchangeRate('mainnet')
    expect(res.xlmUsd).toBe(0.1542)
    expect(res.source).toBe('coingecko')
  })

  it('falls back to Horizon DEX on mainnet when CoinGecko fails', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('coingecko.com')) {
        return Promise.resolve({
          ok: false,
          status: 429,
        })
      }
      if (url.includes('horizon.stellar.org/order_book')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ bids: [{ price: '0.1480' }] }),
        })
      }
      return Promise.reject(new Error('Unknown url'))
    })

    const res = await fetchExchangeRate('mainnet')
    expect(res.xlmUsd).toBe(0.148)
    expect(res.source).toBe('horizon')
  })

  it('returns default fallback when all sources fail', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network offline'))

    const res = await fetchExchangeRate('testnet')
    expect(res.xlmUsd).toBe(DEFAULT_FALLBACK_XLM_USD)
    expect(res.source).toBe('fallback')
  })
})
