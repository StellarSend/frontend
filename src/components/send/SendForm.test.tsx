import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SendForm } from './SendForm'

const VALID_ADDR = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
const assets = [
  { code: 'XLM', name: 'Stellar Lumens' },
  { code: 'USDC', name: 'USD Coin' },
]

describe('SendForm', () => {
  function fillValidForm(memo = '', memoType = '') {
    fireEvent.change(screen.getByLabelText(/recipient stellar address/i), {
      target: { value: VALID_ADDR },
    })
    fireEvent.change(screen.getByLabelText(/you send/i), {
      target: { value: '10' },
    })
    if (memo) {
      fireEvent.change(screen.getByLabelText(/memo \(optional\)/i), {
        target: { value: memo },
      })
    }
    if (memoType) {
      fireEvent.change(screen.getByLabelText(/memo type/i), {
        target: { value: memoType },
      })
    }
  }

  it('renders the memo type selector', () => {
    render(<SendForm onSubmit={vi.fn()} supportedAssets={assets} />)
    expect(screen.getByLabelText(/memo type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/memo type/i)).toHaveValue('text')
  })

  it('has default memo type as text', async () => {
    const onSubmit = vi.fn()
    render(<SendForm onSubmit={onSubmit} supportedAssets={assets} />)

    fillValidForm()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /get quote & review/i })).not.toBeDisabled()
    })

    fireEvent.click(screen.getByRole('button', { name: /get quote & review/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const submittedValues = onSubmit.mock.calls[0][0]
    expect(submittedValues.memoType).toBe('text')
  })

  it('accepts numeric memo as text when memo type is text', async () => {
    const onSubmit = vi.fn()
    render(<SendForm onSubmit={onSubmit} supportedAssets={assets} />)

    fillValidForm('4291001')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /get quote & review/i })).not.toBeDisabled()
    })

    fireEvent.click(screen.getByRole('button', { name: /get quote & review/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const submittedValues = onSubmit.mock.calls[0][0]
    expect(submittedValues.memo).toBe('4291001')
    expect(submittedValues.memoType).toBe('text')
  })

  it('accepts numeric memo as id when memo type is id', async () => {
    const onSubmit = vi.fn()
    render(<SendForm onSubmit={onSubmit} supportedAssets={assets} />)

    fillValidForm('4291001', 'id')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /get quote & review/i })).not.toBeDisabled()
    })

    fireEvent.click(screen.getByRole('button', { name: /get quote & review/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const submittedValues = onSubmit.mock.calls[0][0]
    expect(submittedValues.memo).toBe('4291001')
    expect(submittedValues.memoType).toBe('id')
  })

  it('rejects invalid MEMO_ID format when memo type is id', async () => {
    const onSubmit = vi.fn()
    render(<SendForm onSubmit={onSubmit} supportedAssets={assets} />)

    fillValidForm('abc123', 'id')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /get quote & review/i })).toBeDisabled()
    })

    fireEvent.click(screen.getByRole('button', { name: /get quote & review/i }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rejects MEMO_ID overflow when memo type is id', async () => {
    const onSubmit = vi.fn()
    render(<SendForm onSubmit={onSubmit} supportedAssets={assets} />)

    fillValidForm('18446744073709551616', 'id')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /get quote & review/i })).toBeDisabled()
    })

    fireEvent.click(screen.getByRole('button', { name: /get quote & review/i }))
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
