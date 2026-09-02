import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RequestItem } from './RequestItem'
import { RequestList } from './RequestList'
import type { PaymentRequest } from '@/types'

function makeRequest(overrides: Partial<PaymentRequest> = {}): PaymentRequest {
  return {
    id: 'req_123',
    requesterAccount: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    assetCode: 'USDC',
    amount: '25.5',
    status: 'open',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

const noop = vi.fn()

describe('RequestItem cancel action (#53)', () => {
  it('renders Cancel button for open payment requests when onCancel is provided', () => {
    const onCancel = vi.fn()
    render(<RequestItem request={makeRequest({ status: 'open' })} onCancel={onCancel} />)

    const cancelBtn = screen.getByRole('button', { name: /cancel/i })
    expect(cancelBtn).toBeInTheDocument()
    expect(cancelBtn).not.toBeDisabled()

    fireEvent.click(cancelBtn)
    expect(onCancel).toHaveBeenCalledWith('req_123')
  })

  it('does not render Cancel button for non-open requests (paid, expired, cancelled)', () => {
    const onCancel = vi.fn()
    const { rerender } = render(
      <RequestItem request={makeRequest({ status: 'paid' })} onCancel={onCancel} />,
    )
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()

    rerender(<RequestItem request={makeRequest({ status: 'expired' })} onCancel={onCancel} />)
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()

    rerender(<RequestItem request={makeRequest({ status: 'cancelled' })} onCancel={onCancel} />)
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
  })

  it('disables Cancel button and shows loading state when isCancelling is true', () => {
    render(<RequestItem request={makeRequest({ status: 'open' })} onCancel={noop} isCancelling />)

    const cancelBtn = screen.getByRole('button', { name: /cancel/i })
    expect(cancelBtn).toBeDisabled()
  })
})

describe('RequestList cancel delegation and per-row pending state (#53)', () => {
  it('shows a row as cancelling only when its own id is in cancellingIds', () => {
    const requests = [
      makeRequest({ id: 'req_a', amount: '10' }),
      makeRequest({ id: 'req_b', amount: '20' }),
    ]
    render(
      <RequestList
        requests={requests}
        isLoading={false}
        isError={false}
        onRetry={noop}
        onCancel={noop}
        cancellingIds={new Set(['req_b'])}
      />,
    )

    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i })
    expect(cancelButtons).toHaveLength(2)
    expect(cancelButtons[0]).not.toBeDisabled() // req_a
    expect(cancelButtons[1]).toBeDisabled() // req_b
  })

  it('shows two different rows as cancelling simultaneously without clobbering each other', () => {
    const requests = [
      makeRequest({ id: 'req_a', amount: '10' }),
      makeRequest({ id: 'req_b', amount: '20' }),
      makeRequest({ id: 'req_c', amount: '30' }),
    ]
    render(
      <RequestList
        requests={requests}
        isLoading={false}
        isError={false}
        onRetry={noop}
        onCancel={noop}
        cancellingIds={new Set(['req_a', 'req_c'])}
      />,
    )

    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i })
    expect(cancelButtons[0]).toBeDisabled() // req_a
    expect(cancelButtons[1]).not.toBeDisabled() // req_b
    expect(cancelButtons[2]).toBeDisabled() // req_c
  })
})
