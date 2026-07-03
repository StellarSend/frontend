import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { EscrowItem } from './EscrowItem'
import type { Escrow } from '@/types'

const DEPOSITOR = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
const BENEFICIARY = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'
const ARBITER = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBSMQ7B3W6C'

function makeEscrow(overrides: Partial<Escrow> = {}): Escrow {
  return {
    id: 'esc_1',
    depositorPublicKey: DEPOSITOR,
    beneficiaryPublicKey: BENEFICIARY,
    arbiterPublicKey: ARBITER,
    assetCode: 'XLM',
    assetIssuer: null,
    amount: '100',
    unlockTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
    status: 'funded',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

const noop = vi.fn()

describe('EscrowItem release/refund gating', () => {
  it('does not show the release button to the depositor before unlock (not beneficiary/arbiter)', () => {
    render(
      <EscrowItem
        escrow={makeEscrow()}
        currentPublicKey={DEPOSITOR}
        onRelease={noop}
        onRefund={noop}
      />,
    )
    expect(screen.queryByRole('button', { name: /release/i })).not.toBeInTheDocument()
    // Refund also hidden pre-unlock for the depositor.
    expect(screen.queryByRole('button', { name: /refund/i })).not.toBeInTheDocument()
  })

  it('shows the release button to the beneficiary even before unlock time', () => {
    render(
      <EscrowItem
        escrow={makeEscrow()}
        currentPublicKey={BENEFICIARY}
        onRelease={noop}
        onRefund={noop}
      />,
    )
    expect(screen.getByRole('button', { name: /release/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /refund/i })).not.toBeInTheDocument()
  })

  it('shows the release button to the arbiter even before unlock time', () => {
    render(
      <EscrowItem
        escrow={makeEscrow()}
        currentPublicKey={ARBITER}
        onRelease={noop}
        onRefund={noop}
      />,
    )
    expect(screen.getByRole('button', { name: /release/i })).toBeInTheDocument()
  })

  it('allows the depositor to refund once the unlock time has passed', () => {
    const pastUnlock = makeEscrow({ unlockTime: new Date(Date.now() - 60_000).toISOString() })
    render(
      <EscrowItem
        escrow={pastUnlock}
        currentPublicKey={DEPOSITOR}
        onRelease={noop}
        onRefund={noop}
      />,
    )
    expect(screen.getByRole('button', { name: /refund/i })).toBeInTheDocument()
    // Depositor still cannot release — only beneficiary/arbiter can.
    expect(screen.queryByRole('button', { name: /release/i })).not.toBeInTheDocument()
  })

  it('hides both actions once the escrow is no longer funded', () => {
    render(
      <EscrowItem
        escrow={makeEscrow({ status: 'released' })}
        currentPublicKey={BENEFICIARY}
        onRelease={noop}
        onRefund={noop}
      />,
    )
    expect(screen.queryByRole('button', { name: /release/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /refund/i })).not.toBeInTheDocument()
  })
})
