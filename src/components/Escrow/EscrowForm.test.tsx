import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { EscrowForm } from './EscrowForm'

const DEPOSITOR = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
const BENEFICIARY = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'

const supportedAssets = [{ code: 'XLM', name: 'Stellar Lumens' }]

async function fillCommonFields() {
  const amountInput = screen.getByLabelText(/amount/i)
  fireEvent.change(amountInput, { target: { value: '10' } })
  fireEvent.blur(amountInput)

  const unlockInput = screen.getByLabelText(/unlock time/i)
  const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  fireEvent.change(unlockInput, { target: { value: future } })
  fireEvent.blur(unlockInput)
}

describe('EscrowForm self-escrow / arbiter guards', () => {
  it('disables submit and shows an error when beneficiary equals the connected wallet', async () => {
    const user = userEvent.setup()
    render(
      <EscrowForm
        onSubmit={vi.fn()}
        supportedAssets={supportedAssets}
        depositorPublicKey={DEPOSITOR}
      />,
    )

    await user.type(screen.getByLabelText(/beneficiary stellar address/i), DEPOSITOR)
    await fillCommonFields()

    await waitFor(() => {
      expect(screen.getByText(/self-escrow is not allowed/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /review escrow/i })).toBeDisabled()
  })
})
