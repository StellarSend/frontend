import { describe, it, expect, vi, afterEach } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { horizonUrl, fetchAccountFromHorizon, normalizeApiError, ApiRequestError } from './api'
import type { ApiError } from '@/types'

function makeAxiosError(status: number | undefined, data?: ApiError, message = 'Request failed') {
  return new AxiosError<ApiError>(
    message,
    undefined,
    { headers: new AxiosHeaders() },
    undefined,
    status === undefined
      ? undefined
      : {
          status,
          statusText: '',
          headers: {},
          config: { headers: new AxiosHeaders() },
          data: data as ApiError,
        },
  )
}

describe('normalizeApiError', () => {
  it('produces a real Error instance, not a plain object (#60)', () => {
    const result = normalizeApiError(makeAxiosError(404, undefined))

    expect(result).toBeInstanceOf(Error)
    expect(result).toBeInstanceOf(ApiRequestError)
  })

  it('carries the backend-provided code, message, and details through unchanged', () => {
    const result = normalizeApiError(
      makeAxiosError(400, {
        code: 'VALIDATION_ERROR',
        message: 'Amount must be positive',
        details: { amount: ['must be greater than 0'] },
      }),
    )

    expect(result.code).toBe('VALIDATION_ERROR')
    expect(result.message).toBe('Amount must be positive')
    expect(result.details).toEqual({ amount: ['must be greater than 0'] })
  })

  it("derives code 'NOT_FOUND' from a 404 status when the backend sends no code", () => {
    const result = normalizeApiError(makeAxiosError(404, undefined, 'Request failed with status code 404'))

    expect(result.code).toBe('NOT_FOUND')
  })

  it('prefers a backend-supplied code over the derived NOT_FOUND for a 404', () => {
    const result = normalizeApiError(
      makeAxiosError(404, { code: 'PAYMENT_REQUEST_NOT_FOUND', message: 'Payment request not found' }),
    )

    expect(result.code).toBe('PAYMENT_REQUEST_NOT_FOUND')
  })

  it("falls back to 'UNKNOWN_ERROR' for a non-404 failure with no backend code", () => {
    const result = normalizeApiError(makeAxiosError(500, undefined, 'Request failed with status code 500'))

    expect(result.code).toBe('UNKNOWN_ERROR')
  })

  it('falls back to a generic message when neither the backend nor axios supplies one', () => {
    const result = normalizeApiError(makeAxiosError(undefined, undefined, ''))

    expect(result.message).toBe('An unexpected error occurred')
  })
})

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
