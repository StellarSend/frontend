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

// Mirrors Dashboard.tsx exactly: RecentTransactions(5), QuickStats(50),
// ActivityChart(50) all mounted together for the same wallet.
function useDashboardRecentTransactions() {
  const recentTransactions = useRecentTransactions(5)
  const quickStats = useRecentTransactions(50)
  const activityChart = useRecentTransactions(50)
  return { recentTransactions, quickStats, activityChart }
}

// Mirrors History.tsx exactly: HistoryChart(100), HistorySummary(50).
function useHistoryRecentTransactions() {
  const historyChart = useRecentTransactions(100)
  const historySummary = useRecentTransactions(50)
  return { historyChart, historySummary }
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

  // Dashboard.tsx's exact three call sites: RecentTransactions(5),
  // QuickStats(50), ActivityChart(50). The two limit=50 callers should
  // still correctly dedupe to a single shared fetch (same wallet, same
  // limit really is the same query) — only the limit=5 caller needs its
  // own. Before the fix all three collapsed into one shared query
  // regardless of limit; the fix must not overcorrect into never sharing.
  it("Dashboard's three simultaneous callers (5, 50, 50) produce exactly two fetches, and both limit=50 callers share one result", async () => {
    apiMocks.fetchTransactionsFromHorizon.mockImplementation(
      async (_pubKey: string, _network: string, limit: number) =>
        makePage({ transactions: Array(limit).fill(null).map((_, i) => ({ id: `tx${i}` })), pageSize: limit }),
    )

    const { result } = renderHook(() => useDashboardRecentTransactions(), { wrapper })

    await waitFor(() => {
      expect(result.current.recentTransactions.isSuccess).toBe(true)
      expect(result.current.quickStats.isSuccess).toBe(true)
      expect(result.current.activityChart.isSuccess).toBe(true)
    })

    // Two distinct limits -> two fetches, not three (the shared limit=50
    // pair dedupes) and not one (limit=5 doesn't collide with them).
    expect(apiMocks.fetchTransactionsFromHorizon).toHaveBeenCalledTimes(2)

    expect(result.current.recentTransactions.data?.transactions).toHaveLength(5)
    expect(result.current.quickStats.data?.transactions).toHaveLength(50)
    expect(result.current.activityChart.data?.transactions).toHaveLength(50)
    // QuickStats and ActivityChart share the exact same underlying data
    // reference — same query, same cache entry, as intended for equal limits.
    expect(result.current.quickStats.data).toBe(result.current.activityChart.data)
  })

  // History.tsx's independent collision: HistoryChart(100) and
  // HistorySummary(50). A separate page from Dashboard, but the same class
  // of bug — worth its own explicit coverage per the issue.
  it("History's two simultaneous callers (100, 50) each fetch and receive their own limit-sized dataset", async () => {
    apiMocks.fetchTransactionsFromHorizon.mockImplementation(
      async (_pubKey: string, _network: string, limit: number) =>
        makePage({ transactions: Array(limit).fill(null).map((_, i) => ({ id: `tx${i}` })), pageSize: limit }),
    )

    const { result } = renderHook(() => useHistoryRecentTransactions(), { wrapper })

    await waitFor(() => {
      expect(result.current.historyChart.isSuccess).toBe(true)
      expect(result.current.historySummary.isSuccess).toBe(true)
    })

    expect(apiMocks.fetchTransactionsFromHorizon).toHaveBeenCalledTimes(2)
    expect(result.current.historyChart.data?.transactions).toHaveLength(100)
    expect(result.current.historySummary.data?.transactions).toHaveLength(50)
  })

  it('two callers with the identical limit for the same wallet still share one fetch', async () => {
    apiMocks.fetchTransactionsFromHorizon.mockResolvedValue(makePage({ pageSize: 50 }))

    const { result } = renderHook(() => useTwoRecentTransactions(50, 50), { wrapper })

    await waitFor(() => {
      expect(result.current.a.isSuccess).toBe(true)
      expect(result.current.b.isSuccess).toBe(true)
    })

    expect(apiMocks.fetchTransactionsFromHorizon).toHaveBeenCalledTimes(1)
    expect(result.current.a.data).toBe(result.current.b.data)
  })
})
