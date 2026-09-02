import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useKeyboardShortcut } from './useKeyboardShortcut'

describe('useKeyboardShortcut', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('triggers callback when key matches and no modifier is required', () => {
    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut('k', callback))

    const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true, cancelable: true })
    window.dispatchEvent(event)

    expect(callback).toHaveBeenCalledOnce()
  })

  it('does not trigger callback when an extra modifier is pressed (e.g. Ctrl+Shift+K when only Ctrl is expected)', () => {
    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut('k', callback, { modifier: 'ctrl' }))

    const eventWithShift = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })
    window.dispatchEvent(eventWithShift)

    expect(callback).not.toHaveBeenCalled()

    const correctEvent = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      shiftKey: false,
      bubbles: true,
      cancelable: true,
    })
    window.dispatchEvent(correctEvent)

    expect(callback).toHaveBeenCalledOnce()
  })

  it('supports multiple required modifiers passed as an array', () => {
    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut('k', callback, { modifier: ['ctrl', 'shift'] }))

    const ctrlOnly = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      shiftKey: false,
      bubbles: true,
      cancelable: true,
    })
    window.dispatchEvent(ctrlOnly)
    expect(callback).not.toHaveBeenCalled()

    const ctrlAndShift = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })
    window.dispatchEvent(ctrlAndShift)
    expect(callback).toHaveBeenCalledOnce()
  })

  it('does not fire inside text inputs, textareas, or contenteditable elements by default', () => {
    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut('n', callback))

    const input = document.createElement('input')
    document.body.appendChild(input)

    const inputEvent = new KeyboardEvent('keydown', {
      key: 'n',
      bubbles: true,
      cancelable: true,
    })
    input.dispatchEvent(inputEvent)

    expect(callback).not.toHaveBeenCalled()

    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)

    const textareaEvent = new KeyboardEvent('keydown', {
      key: 'n',
      bubbles: true,
      cancelable: true,
    })
    textarea.dispatchEvent(textareaEvent)

    expect(callback).not.toHaveBeenCalled()

    document.body.removeChild(input)
    document.body.removeChild(textarea)
  })

  it('allows firing inside inputs when allowInInputs is true', () => {
    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut('Escape', callback, { allowInInputs: true }))

    const input = document.createElement('input')
    document.body.appendChild(input)

    const inputEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    })
    input.dispatchEvent(inputEvent)

    expect(callback).toHaveBeenCalledOnce()

    document.body.removeChild(input)
  })

  it('does not fire when enabled is false', () => {
    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut('k', callback, { enabled: false }))

    const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true, cancelable: true })
    window.dispatchEvent(event)

    expect(callback).not.toHaveBeenCalled()
  })
})
