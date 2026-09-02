/**
 * Tests for issue #14 — useBatchPayment must not blindly fall back to a
 * direct Horizon submission for every batchPaymentApi.send failure.
 *
 * Only pure network-layer errors (no HTTP response) should trigger the
 * fallback.  4xx validation and 5xx server errors must surface as-is so the
 * caller sees a real error instead of a spurious "success" that bypassed
 * backend validation or double-submitted an already-executed transaction.
 */
import React from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApiRequestError } from '@/lib/api'
import type { BatchPaymentFormValues, BatchPaymentResult } from '@/types'

// ─── Hoist mocks ─────────────────────────────────────────────────────────────

const apiMocks = vi.hoisted(() => ({
  batchPaymentApi: {
    send: vi.fn<() => Promise<BatchPaymentResult>>(),
  },
  isNetworkLayerError: vi.fn<(e: unknown) => boolean>(),
}))

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    batchPaymentApi: apiMocks.batchPaymentApi,
    isNetworkLayerError: apiMocks.isNetworkLayerError,
  }
})

const stellarMocks = vi.hoisted(() => ({
  buildBatchPaymentTransaction: vi.fn(async () => 'raw-xdr'),
  submitTransaction: vi.fn<() => Promise<{ hash: string; ledger: number }>>(),
}))

vi.mock('@/lib/stellar', () => stellarMocks)

const walletMocks = vi.hoisted(() => ({
  publicKey: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  network: 'testnet' as const,
  signTransaction: vi.fn(async (xdr: string) => `signed:${xdr}`),
  isConnected: true,
  refreshAccount: vi.fn(async () => {}),
}))

vi.mock('./useWallet', () => ({ useWallet: () => walletMocks }))
vi.mock('./useSendPayment', () => ({
  useSupportedAssets: () => [{ code: 'XLM', issuer: null, name: 'Stellar Lumens', decimals: 7 }],
}))
vi.mock('./useTransactions', () => ({
  useInvalidateTransactions: () => vi.fn(),
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function makeApiError(code: string, httpStatus?: number): ApiRequestError {
  const err = new ApiRequestError({ code, message: `Error: ${code}` }, httpStatus)
  return err
}

const FORM_VALUES: BatchPaymentFormValues = {
  assetCode: 'XLM',
  recipients: [{ destinationAddress: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN', amount: '10' }],
}

import { useBatchPayment } from './useBatchPayment'

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  apiMocks.batchPaymentApi.send.mockReset()
  stellarMocks.buildBatchPaymentTransaction.mockReset()
  stellarMocks.submitTransaction.mockReset()
  walletMocks.signTransaction.mockReset()
  walletMocks.refreshAccount.mockReset()

  stellarMocks.buildBatchPaymentTransaction.mockResolvedValue('raw-xdr')
  walletMocks.signTransaction.mockImplementation(async (xdr: string) => `signed:${xdr}`)

  // Default: real isNetworkLayerError logic
  apiMocks.isNetworkLayerError.mockImplementation(
    (err: unknown) => err instanceof ApiRequestError && err.httpStatus === undefined,
  )
})

describe('useBatchPayment — fallback discrimination (#14)', () => {
  it('succeeds normally when batchPaymentApi.send resolves', async () => {
    const backendResult: BatchPaymentResult = {
      batchId: 'batch-1',
      transactionHash: 'hash-abc',
      status: 'success',
      recipientCount: 1,
      totalAmount: '10.0000000',
      createdAt: new Date().toISOString(),
    }
    apiMocks.batchPaymentApi.send.mockResolvedValue(backendResult)

    const { result } = renderHook(() => useBatchPayment(), { wrapper })

    act(() => {
      result.current.reviewBatch(FORM_VALUES)
    })
    await act(async () => {
      result.current.confirmBatch()
    })

    await waitFor(() => expect(result.current.state.step).toBe('success'))
    expect(result.current.state.result?.transactionHash).toBe('hash-abc')
    expect(stellarMocks.submitTransaction).not.toHaveBeenCalled()
  })

  it('falls back to direct Horizon submission on a pure network-layer error (no HTTP response)', async () => {
    // Network error: ApiRequestError with no httpStatus (no server response)
    const networkErr = makeApiError('UNKNOWN_ERROR', undefined)
    apiMocks.batchPaymentApi.send.mockRejectedValue(networkErr)
    stellarMocks.submitTransaction.mockResolvedValue({ hash: 'horizon-hash', ledger: 42 })

    const { result } = renderHook(() => useBatchPayment(), { wrapper })

    act(() => {
      result.current.reviewBatch(FORM_VALUES)
    })
    await act(async () => {
      result.current.confirmBatch()
    })

    await waitFor(() => expect(result.current.state.step).toBe('success'))
    expect(stellarMocks.submitTransaction).toHaveBeenCalledOnce()
    expect(result.current.state.result?.transactionHash).toBe('horizon-hash')
  })

  it('does NOT fall back to Horizon on a 400 validation error — surfaces the error instead', async () => {
    // 400: explicit backend rejection (e.g. sanctioned recipient)
    const validationErr = makeApiError('VALIDATION_ERROR', 400)
    apiMocks.batchPaymentApi.send.mockRejectedValue(validationErr)

    const { result } = renderHook(() => useBatchPayment(), { wrapper })

    act(() => {
      result.current.reviewBatch(FORM_VALUES)
    })
    await act(async () => {
      result.current.confirmBatch()
    })

    await waitFor(() => expect(result.current.state.step).toBe('error'))
    expect(stellarMocks.submitTransaction).not.toHaveBeenCalled()
    expect(result.current.state.error).toContain('VALIDATION_ERROR')
  })

  it('does NOT fall back to Horizon on a 500 server error — surfaces the error instead', async () => {
    // 500: server may have already submitted the tx; blind resubmission is unsafe
    const serverErr = makeApiError('INTERNAL_SERVER_ERROR', 500)
    apiMocks.batchPaymentApi.send.mockRejectedValue(serverErr)

    const { result } = renderHook(() => useBatchPayment(), { wrapper })

    act(() => {
      result.current.reviewBatch(FORM_VALUES)
    })
    await act(async () => {
      result.current.confirmBatch()
    })

    await waitFor(() => expect(result.current.state.step).toBe('error'))
    expect(stellarMocks.submitTransaction).not.toHaveBeenCalled()
  })

  it('does NOT fall back to Horizon on a 422 unprocessable error', async () => {
    const unprocessableErr = makeApiError('UNPROCESSABLE_ENTITY', 422)
    apiMocks.batchPaymentApi.send.mockRejectedValue(unprocessableErr)

    const { result } = renderHook(() => useBatchPayment(), { wrapper })

    act(() => {
      result.current.reviewBatch(FORM_VALUES)
    })
    await act(async () => {
      result.current.confirmBatch()
    })

    await waitFor(() => expect(result.current.state.step).toBe('error'))
    expect(stellarMocks.submitTransaction).not.toHaveBeenCalled()
  })

  it('does NOT fall back to Horizon on a 502 bad gateway', async () => {
    // 502 means the backend received the request (and may have forwarded it)
    const gatewayErr = makeApiError('HORIZON_ERROR', 502)
    apiMocks.batchPaymentApi.send.mockRejectedValue(gatewayErr)

    const { result } = renderHook(() => useBatchPayment(), { wrapper })

    act(() => {
      result.current.reviewBatch(FORM_VALUES)
    })
    await act(async () => {
      result.current.confirmBatch()
    })

    await waitFor(() => expect(result.current.state.step).toBe('error'))
    expect(stellarMocks.submitTransaction).not.toHaveBeenCalled()
  })
})

describe('isNetworkLayerError unit tests', () => {
  it('returns true for ApiRequestError with no httpStatus', () => {
    const err = makeApiError('UNKNOWN_ERROR', undefined)
    expect(apiMocks.isNetworkLayerError(err)).toBe(true)
  })

  it('returns false for ApiRequestError with a 400 status', () => {
    const err = makeApiError('VALIDATION_ERROR', 400)
    expect(apiMocks.isNetworkLayerError(err)).toBe(false)
  })

  it('returns false for ApiRequestError with a 500 status', () => {
    const err = makeApiError('INTERNAL_SERVER_ERROR', 500)
    expect(apiMocks.isNetworkLayerError(err)).toBe(false)
  })

  it('returns false for a plain Error (not an ApiRequestError)', () => {
    expect(apiMocks.isNetworkLayerError(new Error('network down'))).toBe(false)
  })
})
