import { describe, it, expect, vi, afterEach } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import {
  horizonUrl,
  fetchAccountFromHorizon,
  fetchTransactionsFromHorizon,
  normalizeApiError,
  ApiRequestError,
} from './api'
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

describe('fetchTransactionsFromHorizon', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('queries /payments endpoint on Horizon and maps payment amounts and counterparties', async () => {
    const OTHER_USER = 'GDESTINATION12345678901234567890123456789012345678901234'
    const SENDER_USER = 'GSENDER12345678901234567890123456789012345678901234567890'

    mockFetchOnce({
      _embedded: {
        records: [
          {
            id: 'op-1',
            transaction_hash: 'tx-hash-1',
            created_at: '2026-08-20T10:00:00Z',
            type: 'payment',
            transaction_successful: true,
            from: PUBLIC_KEY,
            to: OTHER_USER,
            amount: '25.5000000',
            asset_type: 'credit_alphanum4',
            asset_code: 'USDC',
            asset_issuer: 'GISSUER',
            fee_charged: '100',
            ledger: 500,
            memo: 'Payment 1',
            paging_token: 'cursor-1',
          },
          {
            id: 'op-2',
            transaction_hash: 'tx-hash-2',
            created_at: '2026-08-20T11:00:00Z',
            type: 'payment',
            transaction_successful: true,
            from: SENDER_USER,
            to: PUBLIC_KEY,
            amount: '100.0000000',
            asset_type: 'native',
            fee_charged: '100',
            ledger: 501,
            paging_token: 'cursor-2',
          },
          {
            id: 'op-3',
            transaction_hash: 'tx-hash-3',
            created_at: '2026-08-20T12:00:00Z',
            type: 'create_account',
            transaction_successful: true,
            funder: PUBLIC_KEY,
            account: OTHER_USER,
            starting_balance: '10.0000000',
            fee_charged: '100',
            ledger: 502,
            paging_token: 'cursor-3',
          },
        ],
      },
    })

    const page = await fetchTransactionsFromHorizon(PUBLIC_KEY, 'testnet', 20)

    expect(page.transactions).toHaveLength(3)

    // Sent USDC payment: counterparty is destination (OTHER_USER), direction is sent
    expect(page.transactions[0]).toMatchObject({
      id: 'op-1',
      hash: 'tx-hash-1',
      type: 'payment',
      status: 'success',
      sourceAccount: PUBLIC_KEY,
      destinationAccount: OTHER_USER,
      amount: '25.5000000',
      assetCode: 'USDC',
      assetIssuer: 'GISSUER',
      direction: 'sent',
      counterparty: OTHER_USER,
    })

    // Received native XLM payment: counterparty is sender (SENDER_USER), direction is received
    expect(page.transactions[1]).toMatchObject({
      id: 'op-2',
      hash: 'tx-hash-2',
      type: 'payment',
      status: 'success',
      sourceAccount: SENDER_USER,
      destinationAccount: PUBLIC_KEY,
      amount: '100.0000000',
      assetCode: 'XLM',
      assetIssuer: null,
      direction: 'received',
      counterparty: SENDER_USER,
    })

    // Created account with starting balance: mapped as create_account with starting_balance
    expect(page.transactions[2]).toMatchObject({
      id: 'op-3',
      hash: 'tx-hash-3',
      type: 'create_account',
      status: 'success',
      sourceAccount: PUBLIC_KEY,
      destinationAccount: OTHER_USER,
      amount: '10.0000000',
      assetCode: 'XLM',
      direction: 'sent',
      counterparty: OTHER_USER,
    })
  })
})
