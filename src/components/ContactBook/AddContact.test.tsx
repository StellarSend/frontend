import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AddContact } from './AddContact'

describe('AddContact accessible labeling', () => {
  it('associates inputs with accessible labels', () => {
    render(<AddContact onAdd={vi.fn()} onCancel={vi.fn()} />)
    
    expect(screen.getByLabelText(/contact name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/stellar address/i)).toBeInTheDocument()
  })

  it('validates required fields on submit', () => {
    const onAdd = vi.fn()
    render(<AddContact onAdd={onAdd} onCancel={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(screen.getByText(/name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/invalid stellar address/i)).toBeInTheDocument()
    expect(onAdd).not.toHaveBeenCalled()
  })
})
