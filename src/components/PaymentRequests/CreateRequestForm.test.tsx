import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CreateRequestForm } from './CreateRequestForm'

const assets = [{ code: 'XLM', name: 'Stellar Lumens' }]

describe('CreateRequestForm', () => {
  it('disables submit until an amount is entered', () => {
    render(<CreateRequestForm onSubmit={vi.fn()} supportedAssets={assets} />)
    expect(screen.getByRole('button', { name: /create request/i })).toBeDisabled()
  })

  it('rejects a zero amount', async () => {
    const onSubmit = vi.fn()
    render(<CreateRequestForm onSubmit={onSubmit} supportedAssets={assets} />)

    fireEvent.change(screen.getByLabelText(/^amount$/i), { target: { value: '0' } })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create request/i })).toBeDisabled()
    })
    fireEvent.click(screen.getByRole('button', { name: /create request/i }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits with a valid positive amount', async () => {
    const onSubmit = vi.fn()
    render(<CreateRequestForm onSubmit={onSubmit} supportedAssets={assets} />)

    fireEvent.change(screen.getByLabelText(/^amount$/i), { target: { value: '15.5' } })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create request/i })).not.toBeDisabled()
    })
    fireEvent.click(screen.getByRole('button', { name: /create request/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ amount: '15.5', assetCode: 'XLM' })
  })
})
