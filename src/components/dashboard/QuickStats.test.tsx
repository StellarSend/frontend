import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuickStats } from './QuickStats'
import { useRecentTransactions } from '@/hooks/useTransactions'
import { Transaction } from '@/types'

vi.mock('@/hooks/useTransactions', () => ({
  useRecentTransactions: vi.fn(),
}))

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    hash: 'hash-1',
    createdAt: new Date().toISOString(),
    type: 'payment',
    status: 'success',
    sourceAccount: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    destinationAccount: 'GAHK7WOJWVU67MHUCHC5QUODIC2GQUQ32ZPXRKZ43D4ML5I5U2PLM6TV',
    amount: '10',
    assetCode: 'XLM',
    assetIssuer: null,
    fee: '100',
    ledger: 1000,
    direction: 'sent',
    counterparty: 'GAHK7WOJWVU67MHUCHC5QUODIC2GQUQ32ZPXRKZ43D4ML5I5U2PLM6TV',
    memo: '',
    ...overrides,
  }
}

describe('QuickStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('computes average fee using only sent transactions, ignoring received transaction fees', () => {
    // 1 sent transaction with fee = 100 stroops (0.0000100 XLM)
    // 1 received transaction with massive fee = 10_000_000 stroops (1.0 XLM)
    const transactions = [
      makeTx({ id: 'tx-1', direction: 'sent', fee: '100', amount: '50' }),
      makeTx({ id: 'tx-2', direction: 'received', fee: '10000000', amount: '100' }),
    ]

    vi.mocked(useRecentTransactions).mockReturnValue({
      data: { transactions, total: 2 },
      isLoading: false,
    } as any)

    render(<QuickStats />)

    // Expected avg fee = 100 / 1 / 10_000_000 = 0.0000100
    expect(screen.getByText('0.0000100')).toBeInTheDocument()
    expect(screen.getByText('Average Fee')).toBeInTheDocument()
  })

  it('handles zero sent transactions gracefully with avgFee = "0"', () => {
    const transactions = [
      makeTx({ id: 'tx-1', direction: 'received', fee: '5000', amount: '20' }),
    ]

    vi.mocked(useRecentTransactions).mockReturnValue({
      data: { transactions, total: 1 },
      isLoading: false,
    } as any)

    render(<QuickStats />)

    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
