import React from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Escrow } from '@/types'

const apiMocks = vi.hoisted(() => ({
  escrowApi: {
    buildReleaseTransaction: vi.fn(),
    release: vi.fn(),
    buildRefundTransaction: vi.fn(),
    refund: vi.fn(),
  },
}))
vi.mock('@/lib/api', () => apiMocks)

const walletMocks = vi.hoisted(() => ({
  signTransaction: vi.fn(async (xdr: string) => `signed:${xdr}`),
  refreshAccount: vi.fn(async () => {}),
}))
vi.mock('./useWallet', () => ({ useWallet: () => walletMocks }))

import { useReleaseEscrow, useRefundEscrow } from './useEscrows'
import { usePendingIds } from './usePendingIds'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

function makeEscrow(overrides: Partial<Escrow> = {}): Escrow {
  return {
    id: 'esc_1',
    depositorPublicKey: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    beneficiaryPublicKey: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    arbiterPublicKey: null,
    assetCode: 'XLM',
    assetIssuer: null,
    amount: '100',
    unlockTime: new Date().toISOString(),
    status: 'funded',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function useReleaseHarness() {
  const releaseMutation = useReleaseEscrow()
  const { pendingIds, track } = usePendingIds()
  return { releaseMutation, pendingIds, track }
}

function useRefundHarness() {
  const refundMutation = useRefundEscrow()
  const { pendingIds, track } = usePendingIds()
  return { refundMutation, pendingIds, track }
}

beforeEach(() => {
  apiMocks.escrowApi.buildReleaseTransaction.mockReset()
  apiMocks.escrowApi.release.mockReset()
  apiMocks.escrowApi.buildRefundTransaction.mockReset()
  apiMocks.escrowApi.refund.mockReset()
  apiMocks.escrowApi.buildReleaseTransaction.mockImplementation(async (id: string) => ({
    xdr: `unsigned-xdr-${id}`,
    fee: '100',
  }))
  apiMocks.escrowApi.buildRefundTransaction.mockImplementation(async (id: string) => ({
    xdr: `unsigned-refund-xdr-${id}`,
    fee: '100',
  }))
})

describe('useReleaseEscrow + usePendingIds: concurrent releases (#52)', () => {
  it('releasing a second escrow while the first is still in flight keeps both independently pending', async () => {
    const releaseA = deferred<Escrow>()
    const releaseB = deferred<Escrow>()
    apiMocks.escrowApi.release.mockImplementation((id: string) =>
      id === 'escrowA' ? releaseA.promise : releaseB.promise,
    )

    const { result } = renderHook(() => useReleaseHarness(), { wrapper })

    act(() => {
      result.current.track('escrowA', result.current.releaseMutation.mutateAsync('escrowA'))
    })
    await waitFor(() => expect(result.current.pendingIds.has('escrowA')).toBe(true))

    // Escrow A's release is still outstanding when B's is started — the
    // exact scenario from #52's repro steps.
    act(() => {
      result.current.track('escrowB', result.current.releaseMutation.mutateAsync('escrowB'))
    })
    await waitFor(() => expect(result.current.pendingIds.has('escrowB')).toBe(true))

    // Both pending at once. The old bug derived "is A releasing" from
    // releaseMutation.variables, which is now 'escrowB' — proving that
    // scalar alone is the wrong source of truth, while pendingIds still
    // has both.
    expect(result.current.releaseMutation.variables).toBe('escrowB')
    expect(result.current.pendingIds.has('escrowA')).toBe(true)
    expect(result.current.pendingIds.has('escrowB')).toBe(true)

    // Resolving B first must not clear A (this is what the bug broke).
    await act(async () => {
      releaseB.resolve(makeEscrow({ id: 'escrowB', status: 'released' }))
      await releaseB.promise
    })
    await waitFor(() => expect(result.current.pendingIds.has('escrowB')).toBe(false))
    expect(result.current.pendingIds.has('escrowA')).toBe(true)

    await act(async () => {
      releaseA.resolve(makeEscrow({ id: 'escrowA', status: 'released' }))
      await releaseA.promise
    })
    await waitFor(() => expect(result.current.pendingIds.has('escrowA')).toBe(false))
  })
})

describe('useRefundEscrow + usePendingIds: concurrent refunds (#52)', () => {
  it('refunding a second escrow while the first is still in flight keeps both independently pending', async () => {
    const refundA = deferred<Escrow>()
    const refundB = deferred<Escrow>()
    apiMocks.escrowApi.refund.mockImplementation((id: string) =>
      id === 'escrowA' ? refundA.promise : refundB.promise,
    )

    const { result } = renderHook(() => useRefundHarness(), { wrapper })

    act(() => {
      result.current.track('escrowA', result.current.refundMutation.mutateAsync('escrowA'))
    })
    await waitFor(() => expect(result.current.pendingIds.has('escrowA')).toBe(true))

    act(() => {
      result.current.track('escrowB', result.current.refundMutation.mutateAsync('escrowB'))
    })
    await waitFor(() => expect(result.current.pendingIds.has('escrowB')).toBe(true))

    expect(result.current.refundMutation.variables).toBe('escrowB')
    expect(result.current.pendingIds.has('escrowA')).toBe(true)
    expect(result.current.pendingIds.has('escrowB')).toBe(true)

    await act(async () => {
      refundB.resolve(makeEscrow({ id: 'escrowB', status: 'refunded' }))
      await refundB.promise
    })
    await waitFor(() => expect(result.current.pendingIds.has('escrowB')).toBe(false))
    expect(result.current.pendingIds.has('escrowA')).toBe(true)

    await act(async () => {
      refundA.resolve(makeEscrow({ id: 'escrowA', status: 'refunded' }))
      await refundA.promise
    })
    await waitFor(() => expect(result.current.pendingIds.has('escrowA')).toBe(false))
  })
})
