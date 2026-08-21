import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { TransactionPage } from '@/types'

const apiMocks = vi.hoisted(() => ({
  fetchTransactionsFromHorizon: vi.fn(),
}))
vi.mock('@/lib/api', () => apiMocks)

const walletMocks = vi.hoisted(() => ({
  publicKey: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  network: 'testnet' as const,
  isConnected: true,
}))
vi.mock('./useWallet', () => ({ useWallet: () => walletMocks }))

import { txKeys, useRecentTransactions } from './useTransactions'

function makePage(overrides: Partial<TransactionPage> = {}): TransactionPage {
  return {
    transactions: [],
    page: 1,
    pageSize: 5,
    total: 0,
    hasMore: false,
    ...overrides,
  }
}

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

// Renders two hooks under one shared QueryClient (mirroring how multiple
// Dashboard/History components mount together under the app's single
// QueryClientProvider).
function useTwoRecentTransactions(limitA: number, limitB: number) {
  const a = useRecentTransactions(limitA)
  const b = useRecentTransactions(limitB)
  return { a, b }
}

beforeEach(() => {
  apiMocks.fetchTransactionsFromHorizon.mockReset()
  walletMocks.publicKey = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
  walletMocks.isConnected = true
})

describe('txKeys.list', () => {
  it('includes limit in the returned key tuple', () => {
    expect(txKeys.list('GPUBKEY', 5, { direction: undefined })).toEqual([
      'transactions',
      'list',
      'GPUBKEY',
      5,
      { direction: undefined },
    ])
  })

  it('produces distinct keys for the same wallet at different limits', () => {
    const key5 = txKeys.list('GPUBKEY', 5)
    const key50 = txKeys.list('GPUBKEY', 50)
    expect(key5).not.toEqual(key50)
  })
})

describe('useRecentTransactions', () => {
  // Regression test for #51: mirrors Dashboard.tsx, where RecentTransactions
  // calls useRecentTransactions(5) and QuickStats/ActivityChart call
  // useRecentTransactions(50) for the same connected wallet at the same
  // time. Before the fix, both resolved to one shared cache entry — whoever
  // fetched first "won" and every subscriber received that dataset size
  // regardless of the limit it actually asked for.
  it('two callers with different limits for the same wallet each fetch and receive their own limit-sized dataset', async () => {
    apiMocks.fetchTransactionsFromHorizon.mockImplementation(
      async (_pubKey: string, _network: string, limit: number) =>
        makePage({ transactions: Array(limit).fill(null).map((_, i) => ({ id: `tx${i}` })) , pageSize: limit }),
    )

    const { result } = renderHook(() => useTwoRecentTransactions(5, 50), { wrapper })

    await waitFor(() => {
      expect(result.current.a.isSuccess).toBe(true)
      expect(result.current.b.isSuccess).toBe(true)
    })

    // Each call site independently invoked the fetcher with its own limit...
    expect(apiMocks.fetchTransactionsFromHorizon).toHaveBeenCalledWith(
      walletMocks.publicKey,
      walletMocks.network,
      5,
    )
    expect(apiMocks.fetchTransactionsFromHorizon).toHaveBeenCalledWith(
      walletMocks.publicKey,
      walletMocks.network,
      50,
    )

    // ...and each received the dataset sized for the limit it asked for,
    // not whichever one happened to resolve first for a shared cache slot.
    expect(result.current.a.data?.transactions).toHaveLength(5)
    expect(result.current.b.data?.transactions).toHaveLength(50)
  })
})
