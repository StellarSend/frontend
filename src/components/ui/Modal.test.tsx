import React, { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Modal } from './Modal'

function TestHarness({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button data-testid="trigger" onClick={() => setOpen(true)}>
        Open Modal
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Test Modal">
        <div>
          <button data-testid="btn-inside-1">Inside 1</button>
          <button data-testid="btn-inside-2">Inside 2</button>
        </div>
      </Modal>
    </div>
  )
}

describe('Modal FocusTrap and focus restoration (#42, #9)', () => {
  it('traps focus within the modal on Tab and Shift+Tab', () => {
    render(<TestHarness />)

    const closeBtn = screen.getByLabelText('Close')
    const btn1 = screen.getByTestId('btn-inside-1')
    const btn2 = screen.getByTestId('btn-inside-2')

    // Close button should be initially focused as the first focusable element
    expect(document.activeElement).toBe(closeBtn)

    // Tab from closeBtn to btn1
    fireEvent.keyDown(document, { key: 'Tab' })
    // In our manual keydown handler, Tab from last element wraps to first,
    // let's test wrapping around from last element (btn2)
    btn2.focus()
    expect(document.activeElement).toBe(btn2)

    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(closeBtn)

    // Shift+Tab from closeBtn wraps to btn2
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(btn2)
  })

  it('restores focus to the trigger button when modal closes', () => {
    render(<TestHarness defaultOpen={false} />)

    const trigger = screen.getByTestId('trigger')
    trigger.focus()
    expect(document.activeElement).toBe(trigger)

    // Open modal
    fireEvent.click(trigger)
    const closeBtn = screen.getByLabelText('Close')
    expect(document.activeElement).toBe(closeBtn)

    // Close modal via Escape
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.activeElement).toBe(trigger)
  })
})
