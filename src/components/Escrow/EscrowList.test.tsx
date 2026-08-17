import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { EscrowList } from './EscrowList'
import type { Escrow } from '@/types'

const BENEFICIARY = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'

function makeEscrow(overrides: Partial<Escrow> = {}): Escrow {
  return {
    id: 'esc_1',
    depositorPublicKey: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    beneficiaryPublicKey: BENEFICIARY,
    arbiterPublicKey: null,
    assetCode: 'XLM',
    assetIssuer: null,
    amount: '100',
    unlockTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'funded',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

const noop = vi.fn()

describe('EscrowList per-row pending state (#52)', () => {
  it('shows a row as releasing only when its own id is in releasingIds', () => {
    const escrows = [
      makeEscrow({ id: 'escrowA', amount: '10' }),
      makeEscrow({ id: 'escrowB', amount: '20' }),
    ]
    render(
      <EscrowList
        escrows={escrows}
        isLoading={false}
        isError={false}
        onRetry={noop}
        currentPublicKey={BENEFICIARY}
        onRelease={noop}
        onRefund={noop}
        releasingIds={new Set(['escrowB'])}
      />,
    )

    const releaseButtons = screen.getAllByRole('button', { name: /release/i })
    expect(releaseButtons).toHaveLength(2)
    // escrowA (10 XLM) not releasing, escrowB (20 XLM) is.
    expect(releaseButtons[0]).not.toBeDisabled()
    expect(releaseButtons[1]).toBeDisabled()
  })

  it('shows two different rows as releasing simultaneously without clobbering each other (#52)', () => {
    const escrows = [
      makeEscrow({ id: 'escrowA', amount: '10' }),
      makeEscrow({ id: 'escrowB', amount: '20' }),
      makeEscrow({ id: 'escrowC', amount: '30' }),
    ]
    render(
      <EscrowList
        escrows={escrows}
        isLoading={false}
        isError={false}
        onRetry={noop}
        currentPublicKey={BENEFICIARY}
        onRelease={noop}
        onRefund={noop}
        releasingIds={new Set(['escrowA', 'escrowC'])}
      />,
    )

    const releaseButtons = screen.getAllByRole('button', { name: /release/i })
    expect(releaseButtons[0]).toBeDisabled() // escrowA
    expect(releaseButtons[1]).not.toBeDisabled() // escrowB
    expect(releaseButtons[2]).toBeDisabled() // escrowC
  })

  it('treats an undefined releasingIds as nothing pending', () => {
    render(
      <EscrowList
        escrows={[makeEscrow()]}
        isLoading={false}
        isError={false}
        onRetry={noop}
        currentPublicKey={BENEFICIARY}
        onRelease={noop}
        onRefund={noop}
      />,
    )

    expect(screen.getByRole('button', { name: /release/i })).not.toBeDisabled()
  })
})
