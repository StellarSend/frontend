import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BatchForm } from './BatchForm'

const VALID_ADDR = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
const assets = [{ code: 'XLM', name: 'Stellar Lumens' }]

describe('BatchForm', () => {
  it('does not call onSubmit when the only recipient has a zero amount', async () => {
    const onSubmit = vi.fn()
    render(<BatchForm onSubmit={onSubmit} supportedAssets={assets} />)

    fireEvent.change(screen.getByPlaceholderText('G... recipient address'), {
      target: { value: VALID_ADDR },
    })
    fireEvent.change(screen.getByPlaceholderText('Amount'), {
      target: { value: '0' },
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /review batch/i })).toBeDisabled()
    })

    fireEvent.click(screen.getByRole('button', { name: /review batch/i }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('allows adding a second recipient row and submits with valid amounts', async () => {
    const onSubmit = vi.fn()
    render(<BatchForm onSubmit={onSubmit} supportedAssets={assets} />)

    fireEvent.change(screen.getByPlaceholderText('G... recipient address'), {
      target: { value: VALID_ADDR },
    })
    fireEvent.change(screen.getByPlaceholderText('Amount'), {
      target: { value: '10' },
    })

    fireEvent.click(screen.getByRole('button', { name: /add recipient/i }))

    const addresses = screen.getAllByPlaceholderText('G... recipient address')
    const amounts = screen.getAllByPlaceholderText('Amount')
    expect(addresses).toHaveLength(2)

    fireEvent.change(addresses[1], { target: { value: VALID_ADDR } })
    fireEvent.change(amounts[1], { target: { value: '5' } })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /review batch/i })).not.toBeDisabled()
    })

    fireEvent.click(screen.getByRole('button', { name: /review batch/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0].recipients).toHaveLength(2)
  })
})
