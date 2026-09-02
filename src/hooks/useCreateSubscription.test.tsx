/**
 * Tests for issue #15 — useCreateSubscription must never substitute a plain
 * one-time payment for a failed subscription build.
 *
 * Previously, when subscriptionApi.buildCreateTransaction rejected for any
 * reason, the hook silently built a single Operation.payment transaction
 * locally and submitted it, leading the user to unknowingly sign and broadcast
 * a real on-chain payment while the UI reported subscription "success".
 *
 * After the fix, any failure from buildCreateTransaction surfaces as an error;
 * buildPaymentTransaction is never called.
 */
import React from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Subscription, SubscriptionFormValues } from '@/types'

// ─── Hoist mocks ─────────────────────────────────────────────────────────────

const apiMocks = vi.hoisted(() => ({
  subscriptionApi: {
    buildCreateTransaction: vi.fn(),
    create: vi.fn<() => Promise<Subscription>>(),
    list: vi.fn(),
    buildCancelTransaction: vi.fn(),
    cancel: vi.fn(),
  },
}))

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return { ...actual, subscriptionApi: apiMocks.subscriptionApi }
})

// buildPaymentTransaction must never be called; spy to verify
const stellarMocks = vi.hoisted(() => ({
  buildPaymentTransaction: vi.fn(async () => 'should-never-be-called'),
}))

vi.mock('@/lib/stellar', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/stellar')>()
  return { ...actual, buildPaymentTransaction: stellarMocks.buildPaymentTransaction }
})

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function makeSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub_1',
    sourcePublicKey: walletMocks.publicKey,
    destinationAddress: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    asset: { code: 'XLM', issuer: null, name: 'Stellar Lumens', decimals: 7 },
    amount: '10',
    interval: 'monthly',
    startDate: new Date().toISOString(),
    nextRunAt: new Date(Date.now() + 86_400_000).toISOString(),
    status: 'active',
    createdAt: new Date().toISOString(),
    runCount: 0,
    ...overrides,
  }
}

const FORM_VALUES: SubscriptionFormValues = {
  assetCode: 'XLM',
  destinationAddress: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
  amount: '10',
  interval: 'monthly',
  startDate: new Date().toISOString(),
}

import { useCreateSubscription } from './useSubscriptions'

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  apiMocks.subscriptionApi.buildCreateTransaction.mockReset()
  apiMocks.subscriptionApi.create.mockReset()
  walletMocks.signTransaction.mockReset()
  walletMocks.refreshAccount.mockReset()
  stellarMocks.buildPaymentTransaction.mockReset()

  walletMocks.signTransaction.mockImplementation(async (xdr: string) => `signed:${xdr}`)
})

describe('useCreateSubscription — no silent one-time-payment fallback (#15)', () => {
  it('succeeds normally when buildCreateTransaction resolves', async () => {
    apiMocks.subscriptionApi.buildCreateTransaction.mockResolvedValue({ xdr: 'sub-xdr' })
    const sub = makeSubscription()
    apiMocks.subscriptionApi.create.mockResolvedValue(sub)

    const { result } = renderHook(() => useCreateSubscription(), { wrapper })

    act(() => {
      result.current.reviewSubscription(FORM_VALUES)
    })
    await act(async () => {
      result.current.confirmCreate()
    })

    await waitFor(() => expect(result.current.state.step).toBe('success'))
    expect(result.current.state.result?.id).toBe('sub_1')
    // The subscription XDR — not a plain payment XDR — should be signed
    expect(walletMocks.signTransaction).toHaveBeenCalledWith('sub-xdr')
    // buildPaymentTransaction must never be invoked
    expect(stellarMocks.buildPaymentTransaction).not.toHaveBeenCalled()
  })

  it('surfaces an error when buildCreateTransaction rejects — never calls buildPaymentTransaction', async () => {
    apiMocks.subscriptionApi.buildCreateTransaction.mockRejectedValue(
      new Error('501 Not Implemented'),
    )

    const { result } = renderHook(() => useCreateSubscription(), { wrapper })

    act(() => {
      result.current.reviewSubscription(FORM_VALUES)
    })
    await act(async () => {
      result.current.confirmCreate()
    })

    await waitFor(() => expect(result.current.state.step).toBe('error'))
    // Must never silently substitute a one-time payment
    expect(stellarMocks.buildPaymentTransaction).not.toHaveBeenCalled()
    // subscriptionApi.create must not be called with a wrongly-built XDR
    expect(apiMocks.subscriptionApi.create).not.toHaveBeenCalled()
    expect(result.current.state.error).toBeTruthy()
  })

  it('surfaces an error when buildCreateTransaction rejects with a 503 — never calls buildPaymentTransaction', async () => {
    apiMocks.subscriptionApi.buildCreateTransaction.mockRejectedValue(
      new Error('503 Service Unavailable'),
    )

    const { result } = renderHook(() => useCreateSubscription(), { wrapper })

    act(() => {
      result.current.reviewSubscription(FORM_VALUES)
    })
    await act(async () => {
      result.current.confirmCreate()
    })

    await waitFor(() => expect(result.current.state.step).toBe('error'))
    expect(stellarMocks.buildPaymentTransaction).not.toHaveBeenCalled()
    expect(apiMocks.subscriptionApi.create).not.toHaveBeenCalled()
  })

  it('surfaces an error when signTransaction rejects — subscriptionApi.create is not called', async () => {
    apiMocks.subscriptionApi.buildCreateTransaction.mockResolvedValue({ xdr: 'sub-xdr' })
    walletMocks.signTransaction.mockRejectedValue(new Error('User rejected signing'))

    const { result } = renderHook(() => useCreateSubscription(), { wrapper })

    act(() => {
      result.current.reviewSubscription(FORM_VALUES)
    })
    await act(async () => {
      result.current.confirmCreate()
    })

    await waitFor(() => expect(result.current.state.step).toBe('error'))
    expect(apiMocks.subscriptionApi.create).not.toHaveBeenCalled()
    expect(stellarMocks.buildPaymentTransaction).not.toHaveBeenCalled()
  })
})
