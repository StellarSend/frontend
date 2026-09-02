import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRetry } from './useRetry'

describe('useRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resets loading to false after a successful first attempt', async () => {
    const fn = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useRetry(fn))

    expect(result.current.loading).toBe(false)

    let promise: Promise<void>
    act(() => {
      promise = result.current.run()
    })

    expect(result.current.loading).toBe(true)

    await act(async () => {
      await promise
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.attempt).toBe(0)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('resets loading to false after a successful retry', async () => {
    let callCount = 0
    const fn = vi.fn().mockImplementation(async () => {
      callCount++
      if (callCount === 1) {
        throw new Error('Network glitch')
      }
      return undefined
    })

    const { result } = renderHook(() => useRetry(fn, { maxAttempts: 3, delay: 100 }))

    let promise: Promise<void>
    act(() => {
      promise = result.current.run()
    })

    expect(result.current.loading).toBe(true)

    // Advance timer for delay (100ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
      await promise
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.attempt).toBe(0)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('sets error and resets loading to false when all retries are exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Persistent failure'))
    const { result } = renderHook(() => useRetry(fn, { maxAttempts: 3, delay: 100 }))

    let promise: Promise<void>
    act(() => {
      promise = result.current.run()
    })

    expect(result.current.loading).toBe(true)

    // Advance through all delays: attempt 0 fails -> delay 100 -> attempt 1 fails -> delay 200 -> attempt 2 fails
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
      await vi.advanceTimersByTimeAsync(200)
      await promise
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('Persistent failure')
    expect(result.current.attempt).toBe(3)
    expect(fn).toHaveBeenCalledTimes(3)
  })
})
