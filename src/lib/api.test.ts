import { describe, it, expect, vi, afterEach } from 'vitest'
import { horizonUrl, fetchAccountFromHorizon } from './api'

describe('horizonUrl', () => {
  it('returns the testnet Horizon host for network "testnet"', () => {
    expect(horizonUrl('testnet')).toBe('https://horizon-testnet.stellar.org')
  })

  it('returns the mainnet Horizon host for network "mainnet"', () => {
    expect(horizonUrl('mainnet')).toBe('https://horizon.stellar.org')
  })
})

const PUBLIC_KEY = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'

function mockFetchOnce(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const minimalHorizonAccount = {
  account_id: PUBLIC_KEY,
  sequence: '1',
  subentry_count: 0,
  last_modified_ledger: 1,
  thresholds: { low_threshold: 0, med_threshold: 0, high_threshold: 0 },
  flags: { auth_required: false, auth_revocable: false, auth_immutable: false },
  balances: [],
}

describe('fetchAccountFromHorizon', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requests the testnet host when network is "testnet"', async () => {
    const fetchMock = mockFetchOnce(minimalHorizonAccount)
    await fetchAccountFromHorizon(PUBLIC_KEY, 'testnet')

    expect(fetchMock).toHaveBeenCalledWith(
      `https://horizon-testnet.stellar.org/accounts/${PUBLIC_KEY}`,
    )
  })

  it('requests the mainnet host when network is "mainnet"', async () => {
    const fetchMock = mockFetchOnce(minimalHorizonAccount)
    await fetchAccountFromHorizon(PUBLIC_KEY, 'mainnet')

    expect(fetchMock).toHaveBeenCalledWith(
      `https://horizon.stellar.org/accounts/${PUBLIC_KEY}`,
    )
  })
})
