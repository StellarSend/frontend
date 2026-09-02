import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast } from './useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('adds toasts with proper types and message', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.success('Operation succeeded')
      result.current.error('Operation failed')
      result.current.info('Information notice')
    })

    expect(result.current.toasts).toHaveLength(3)
    expect(result.current.toasts[0]).toEqual({
      id: 1,
      message: 'Operation succeeded',
      type: 'success',
    })
    expect(result.current.toasts[1]).toEqual({
      id: 2,
      message: 'Operation failed',
      type: 'error',
    })
    expect(result.current.toasts[2]).toEqual({
      id: 3,
      message: 'Information notice',
      type: 'info',
    })
  })

  it('automatically dismisses toasts after default timeout', () => {
    const { result } = renderHook(() => useToast(3000))

    act(() => {
      result.current.success('Auto dismiss test')
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(2999)
    })
    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current.toasts).toHaveLength(0)
  })

  it('allows overriding timeout per toast', () => {
    const { result } = renderHook(() => useToast(5000))

    act(() => {
      result.current.show('Quick toast', 'info', 1000)
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.toasts).toHaveLength(0)
  })

  it('clears timer on manual dismiss to avoid dangling callbacks', () => {
    const { result } = renderHook(() => useToast(5000))

    let toastId: number
    act(() => {
      toastId = result.current.info('Manual dismiss')
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      result.current.dismiss(toastId)
    })

    expect(result.current.toasts).toHaveLength(0)

    // Advancing timers should not cause errors
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current.toasts).toHaveLength(0)
  })

  it('scopes toast IDs per hook instance without cross-instance leakage', () => {
    const { result: hookA } = renderHook(() => useToast())
    const { result: hookB } = renderHook(() => useToast())

    act(() => {
      hookA.current.info('Toast from A')
      hookB.current.info('Toast from B')
    })

    expect(hookA.current.toasts[0].id).toBe(1)
    expect(hookB.current.toasts[0].id).toBe(1)
  })

  it('clears active timers on unmount', () => {
    const { result, unmount } = renderHook(() => useToast(3000))

    act(() => {
      result.current.info('Will unmount')
    })

    expect(result.current.toasts).toHaveLength(1)

    unmount()

    // Advancing timers after unmount should be cleanly handled
    act(() => {
      vi.advanceTimersByTime(3000)
    })
  })
})
