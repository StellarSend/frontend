import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AmountStep } from './AmountStep'
describe('AmountStep', () => {
  it('renders input', () => { render(<AmountStep onNext={vi.fn()} />); expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument() })
  it('shows error for empty amount', () => { render(<AmountStep onNext={vi.fn()} />); fireEvent.click(screen.getByText('Continue')); expect(screen.getByText(/valid amount/i)).toBeInTheDocument() })
  it('calls onNext with valid amount', () => { const fn = vi.fn(); render(<AmountStep onNext={fn} />); fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '10' } }); fireEvent.click(screen.getByText('Continue')); expect(fn).toHaveBeenCalledWith('10') })
})
