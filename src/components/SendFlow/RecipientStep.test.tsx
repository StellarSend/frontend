import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RecipientStep } from './RecipientStep'

const VALID_ADDR = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'

describe('RecipientStep', () => {
  it('renders address input', () => {
    render(<RecipientStep onNext={vi.fn()} />)
    expect(screen.getByPlaceholderText(/Stellar address/i)).toBeInTheDocument()
  })

  it('rejects invalid address', () => {
    render(<RecipientStep onNext={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'invalid' } })
    fireEvent.click(screen.getByText('Continue'))
    expect(screen.getByText(/valid Stellar address/i)).toBeInTheDocument()
  })

  it('accepts valid Stellar address', () => {
    const onNext = vi.fn()
    render(<RecipientStep onNext={onNext} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: VALID_ADDR } })
    fireEvent.click(screen.getByText('Continue'))
    expect(onNext).toHaveBeenCalledWith(VALID_ADDR)
  })
})
