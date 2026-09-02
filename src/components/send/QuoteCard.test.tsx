import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { QuoteCard } from './QuoteCard'
import type { Quote } from '@/types'
import { NATIVE_XLM } from '@/types'

const mockQuote: Quote = {
  id: 'quote_123',
  sourceAsset: NATIVE_XLM,
  destinationAsset: { ...NATIVE_XLM, code: 'USDC', issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5' },
  sendAmount: '100',
  receiveAmount: '12.5',
  exchangeRate: '0.125',
  networkFee: '0.00001',
  serviceFee: '0',
  totalFee: '0.00001',
  estimatedSeconds: 5,
  slippageTolerance: '0.5',
  priceImpact: '0.01',
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  path: [],
}

describe('QuoteCard', () => {
  it('renders quote details correctly', () => {
    render(<QuoteCard quote={mockQuote} />)
    expect(screen.getByText('Exchange Quote')).toBeInTheDocument()
    expect(screen.getByText('100.0000')).toBeInTheDocument()
    expect(screen.getByText('12.5000')).toBeInTheDocument()
  })

  it('renders Refresh button when onRefresh is provided and calls it when clicked (#39)', () => {
    const onRefresh = vi.fn()
    render(<QuoteCard quote={mockQuote} onRefresh={onRefresh} />)

    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    expect(refreshButton).toBeInTheDocument()

    fireEvent.click(refreshButton)
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('does not render Refresh button when onRefresh is not provided', () => {
    render(<QuoteCard quote={mockQuote} />)
    expect(screen.queryByRole('button', { name: /refresh/i })).not.toBeInTheDocument()
  })

  it('shows expired warning when quote is expired', () => {
    const expiredQuote = {
      ...mockQuote,
      expiresAt: new Date(Date.now() - 10_000).toISOString(),
    }
    render(<QuoteCard quote={expiredQuote} />)
    expect(screen.getByText(/This quote has expired/i)).toBeInTheDocument()
  })
})
