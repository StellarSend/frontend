import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SubscriptionList } from './SubscriptionList'
import type { Subscription } from '@/types'

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

const noop = vi.fn()

describe('SubscriptionList per-row pending state (#52)', () => {
  it('shows a row as cancelling only when its own id is in cancellingIds', () => {
    const subscriptions = [
      makeSubscription({ id: 'subA', amount: '10' }),
      makeSubscription({ id: 'subB', amount: '20' }),
    ]
    render(
      <SubscriptionList
        subscriptions={subscriptions}
        isLoading={false}
        isError={false}
        onRetry={noop}
        onCancel={noop}
        cancellingIds={new Set(['subB'])}
      />,
    )

    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i })
    expect(cancelButtons).toHaveLength(2)
    expect(cancelButtons[0]).not.toBeDisabled()
    expect(cancelButtons[1]).toBeDisabled()
  })

  it('shows two different rows as cancelling simultaneously without clobbering each other (#52)', () => {
    const subscriptions = [
      makeSubscription({ id: 'subA', amount: '10' }),
      makeSubscription({ id: 'subB', amount: '20' }),
      makeSubscription({ id: 'subC', amount: '30' }),
    ]
    render(
      <SubscriptionList
        subscriptions={subscriptions}
        isLoading={false}
        isError={false}
        onRetry={noop}
        onCancel={noop}
        cancellingIds={new Set(['subA', 'subC'])}
      />,
    )

    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i })
    expect(cancelButtons[0]).toBeDisabled() // subA
    expect(cancelButtons[1]).not.toBeDisabled() // subB
    expect(cancelButtons[2]).toBeDisabled() // subC
  })

  it('treats an undefined cancellingIds as nothing pending', () => {
    render(
      <SubscriptionList
        subscriptions={[makeSubscription()]}
        isLoading={false}
        isError={false}
        onRetry={noop}
        onCancel={noop}
      />,
    )

    expect(screen.getByRole('button', { name: /cancel/i })).not.toBeDisabled()
  })
})
