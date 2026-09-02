import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { TransactionTable } from './TransactionTable'
import type { Transaction } from '@/types'

// Mock dependencies
const mockUseWallet = vi.fn()
const mockUseTransactions = vi.fn()

vi.mock('@/hooks/useWallet', () => ({
  useWallet: () => mockUseWallet(),
}))

vi.mock('@/hooks/useTransactions', () => ({
  useTransactions: () => mockUseTransactions(),
}))

const mockTransactions: Transaction[] = [
  {
    id: 'tx1',
    hash: '0x123abc456def',
    sourceAccount: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    destinationAccount: 'GCKFBEIYV2U22IO2GUOWGO2STRBISXAPUSFHUMXSTDDQJK4V5Q742ZNP',
    counterparty: 'GCKFBEIYV2U22IO2GUOWGO2STRBISXAPUSFHUMXSTDDQJK4V5Q742ZNP',
    amount: '100.5',
    assetCode: 'XLM',
    assetIssuer: null,
    fee: '0.00001',
    direction: 'sent',
    status: 'success',
    type: 'payment',
    ledger: 1000,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tx2',
    hash: '0x789xyz012uvw',
    sourceAccount: 'GCKFBEIYV2U22IO2GUOWGO2STRBISXAPUSFHUMXSTDDQJK4V5Q742ZNP',
    destinationAccount: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    counterparty: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    amount: '50.0',
    assetCode: 'USDC',
    assetIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    fee: '0.00001',
    direction: 'received',
    status: 'success',
    type: 'payment',
    ledger: 1001,
    createdAt: new Date().toISOString(),
  },
]

describe('TransactionTable', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockUseWallet.mockReturnValue({ network: 'testnet' })
    mockUseTransactions.mockReturnValue({
      data: { pages: [{ transactions: mockTransactions }] },
      isLoading: false,
      isError: false,
      error: null,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders all transactions initially', () => {
    render(<TransactionTable />)
    expect(screen.getByText('Transaction History')).toBeInTheDocument()
    expect(screen.getByText(/100\.5000\s*XLM/)).toBeInTheDocument()
    expect(screen.getByText(/50\.0000\s*USDC/)).toBeInTheDocument()
  })

  it('filters transactions with debounce when searching', async () => {
    render(<TransactionTable />)

    const input = screen.getByPlaceholderText('Search by hash, address, or asset...')
    
    // Type search query for USDC
    fireEvent.change(input, { target: { value: 'USDC' } })

    // Before debounce delay passes, both should still be visible because state hasn't updated debounced value yet
    expect(screen.getByText(/100\.5000\s*XLM/)).toBeInTheDocument()
    expect(screen.getByText(/50\.0000\s*USDC/)).toBeInTheDocument()

    // Advance timers by 200ms debounce
    act(() => {
      vi.advanceTimersByTime(200)
    })

    // Now only USDC transaction is shown
    expect(screen.queryByText(/100\.5000\s*XLM/)).not.toBeInTheDocument()
    expect(screen.getByText(/50\.0000\s*USDC/)).toBeInTheDocument()
  })

  it('shows empty state when no transactions match search', async () => {
    render(<TransactionTable />)

    const input = screen.getByPlaceholderText('Search by hash, address, or asset...')
    fireEvent.change(input, { target: { value: 'nonexistent-token' } })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(screen.getByText('No matching transactions')).toBeInTheDocument()
    expect(
      screen.getByText('Try adjusting your search query or clear the filter.'),
    ).toBeInTheDocument()
  })

  it('filters by counterparty address', async () => {
    render(<TransactionTable />)

    const input = screen.getByPlaceholderText('Search by hash, address, or asset...')
    fireEvent.change(input, { target: { value: 'GBBD47' } })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    // tx2 counterparty starts with GBBD47
    expect(screen.queryByText(/100\.5000\s*XLM/)).not.toBeInTheDocument()
    expect(screen.getByText(/50\.0000\s*USDC/)).toBeInTheDocument()
  })

  it('filters by hash', async () => {
    render(<TransactionTable />)

    const input = screen.getByPlaceholderText('Search by hash, address, or asset...')
    fireEvent.change(input, { target: { value: '0x123abc' } })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(screen.getByText(/100\.5000\s*XLM/)).toBeInTheDocument()
    expect(screen.queryByText(/50\.0000\s*USDC/)).not.toBeInTheDocument()
  })
})
