import React from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Subscription } from '@/types'

const apiMocks = vi.hoisted(() => ({
  subscriptionApi: {
    buildCancelTransaction: vi.fn(),
    cancel: vi.fn(),
  },
}))
vi.mock('@/lib/api', () => apiMocks)

const walletMocks = vi.hoisted(() => ({
  signTransaction: vi.fn(async (xdr: string) => `signed:${xdr}`),
  refreshAccount: vi.fn(async () => {}),
}))
vi.mock('./useWallet', () => ({ useWallet: () => walletMocks }))

import { useCancelSubscription } from './useSubscriptions'
import { usePendingIds } from './usePendingIds'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

function makeSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub_1',
    sourcePublicKey: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    destinationAddress: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    asset: { code: 'XLM', issuer: null, name: 'Stellar Lumens', decimals: 7 },
    amount: '10',
    interval: 'monthly',
    startDate: new Date().toISOString(),
    nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    createdAt: new Date().toISOString(),
    runCount: 0,
    ...overrides,
  }
}

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function useCancelHarness() {
  const cancelMutation = useCancelSubscription()
  const { pendingIds, track } = usePendingIds()
  return { cancelMutation, pendingIds, track }
}

beforeEach(() => {
  apiMocks.subscriptionApi.buildCancelTransaction.mockReset()
  apiMocks.subscriptionApi.cancel.mockReset()
  // No on-chain authorization needed for these ids — purely a backend flag
  // flip, matching useCancelSubscription's documented fallback path.
  apiMocks.subscriptionApi.buildCancelTransaction.mockResolvedValue({ xdr: undefined })
})

describe('useCancelSubscription + usePendingIds: concurrent cancellations (#52)', () => {
  it('cancelling a second subscription while the first is still in flight keeps both independently pending', async () => {
    const cancelA = deferred<Subscription>()
    const cancelB = deferred<Subscription>()
    apiMocks.subscriptionApi.cancel.mockImplementation((id: string) =>
      id === 'subA' ? cancelA.promise : cancelB.promise,
    )

    const { result } = renderHook(() => useCancelHarness(), { wrapper })

    act(() => {
      result.current.track('subA', result.current.cancelMutation.mutateAsync('subA'))
    })
    await waitFor(() => expect(result.current.pendingIds.has('subA')).toBe(true))

    act(() => {
      result.current.track('subB', result.current.cancelMutation.mutateAsync('subB'))
    })
    await waitFor(() => expect(result.current.pendingIds.has('subB')).toBe(true))

    expect(result.current.cancelMutation.variables).toBe('subB')
    expect(result.current.pendingIds.has('subA')).toBe(true)
    expect(result.current.pendingIds.has('subB')).toBe(true)

    await act(async () => {
      cancelB.resolve(makeSubscription({ id: 'subB', status: 'cancelled' }))
      await cancelB.promise
    })
    await waitFor(() => expect(result.current.pendingIds.has('subB')).toBe(false))
    expect(result.current.pendingIds.has('subA')).toBe(true)

    await act(async () => {
      cancelA.resolve(makeSubscription({ id: 'subA', status: 'cancelled' }))
      await cancelA.promise
    })
    await waitFor(() => expect(result.current.pendingIds.has('subA')).toBe(false))
  })
})
