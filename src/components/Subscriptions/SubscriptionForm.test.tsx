import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SubscriptionForm } from './SubscriptionForm'

const VALID_ADDR = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
const assets = [{ code: 'XLM', name: 'Stellar Lumens' }]

describe('SubscriptionForm', () => {
  it('keeps the submit button disabled until the form is valid', async () => {
    render(<SubscriptionForm onSubmit={vi.fn()} supportedAssets={assets} />)
    expect(screen.getByRole('button', { name: /review subscription/i })).toBeDisabled()
  })

  it('rejects a zero/negative amount and does not call onSubmit', async () => {
    const onSubmit = vi.fn()
    render(<SubscriptionForm onSubmit={onSubmit} supportedAssets={assets} />)

    fireEvent.change(screen.getByLabelText(/recipient stellar address/i), {
      target: { value: VALID_ADDR },
    })
    fireEvent.change(screen.getByLabelText(/amount per payment/i), {
      target: { value: '0' },
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /review subscription/i })).toBeDisabled()
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits once recipient and amount are valid', async () => {
    const onSubmit = vi.fn()
    render(<SubscriptionForm onSubmit={onSubmit} supportedAssets={assets} />)

    fireEvent.change(screen.getByLabelText(/recipient stellar address/i), {
      target: { value: VALID_ADDR },
    })
    fireEvent.change(screen.getByLabelText(/amount per payment/i), {
      target: { value: '25' },
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /review subscription/i })).not.toBeDisabled()
    })

    fireEvent.click(screen.getByRole('button', { name: /review subscription/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      destinationAddress: VALID_ADDR,
      amount: '25',
      interval: 'monthly',
    })
  })
})
