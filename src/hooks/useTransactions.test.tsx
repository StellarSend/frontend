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
