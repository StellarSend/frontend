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

  it('throws a clear "not found" error on a 404, instead of the raw status', async () => {
    mockFetchOnce({}, 404)

    await expect(fetchAccountFromHorizon(PUBLIC_KEY, 'testnet')).rejects.toThrow(
      'Account not found on Stellar network',
    )
  })

  it('throws a Horizon-error message on other non-ok statuses', async () => {
    mockFetchOnce({}, 503)

    await expect(fetchAccountFromHorizon(PUBLIC_KEY, 'testnet')).rejects.toThrow(
      'Horizon error: 503',
    )
  })

  it('maps thresholds, flags, and every balance — not just the native XLM one', async () => {
    mockFetchOnce({
      account_id: PUBLIC_KEY,
      sequence: '42',
      subentry_count: 2,
      last_modified_ledger: 100,
      thresholds: { low_threshold: 1, med_threshold: 2, high_threshold: 3 },
      flags: { auth_required: true, auth_revocable: false, auth_immutable: false },
      balances: [
        { asset_type: 'native', balance: '100.5000000' },
        {
          asset_type: 'credit_alphanum4',
          asset_code: 'USDC',
          asset_issuer: 'GISSUER',
          balance: '10.0000000',
          buying_liabilities: '0',
          selling_liabilities: '0',
        },
      ],
    })

    const account = await fetchAccountFromHorizon(PUBLIC_KEY, 'testnet')

    expect(account.sequence).toBe('42')
    expect(account.subentryCount).toBe(2)
    expect(account.thresholds).toEqual({ lowThreshold: 1, medThreshold: 2, highThreshold: 3 })
    expect(account.flags).toEqual({
      authRequired: true,
      authRevocable: false,
      authImmutable: false,
    })
    expect(account.balances).toHaveLength(2)
    expect(account.balances[0].asset.code).toBe('XLM')
    expect(account.balances[1].asset.code).toBe('USDC')
    expect(account.balances[1].asset.issuer).toBe('GISSUER')
  })
})
