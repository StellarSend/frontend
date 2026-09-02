import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useClipboard } from './useClipboard'
import * as utils from '../lib/utils'

describe('useClipboard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('sets copied to true when copyToClipboard succeeds', async () => {
    vi.spyOn(utils, 'copyToClipboard').mockResolvedValue(true)

    const { result } = renderHook(() => useClipboard(1000))
    expect(result.current.copied).toBe(false)
    expect(result.current.error).toBeNull()

    let outcome: boolean | undefined
    await act(async () => {
      outcome = await result.current.copy('test text')
    })

    expect(outcome).toBe(true)
    expect(result.current.copied).toBe(true)
    expect(result.current.error).toBeNull()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.copied).toBe(false)
  })

  it('sets error and copied=false when copyToClipboard returns false without throwing', async () => {
    vi.spyOn(utils, 'copyToClipboard').mockResolvedValue(false)

    const { result } = renderHook(() => useClipboard())

    let outcome: boolean | undefined
    await act(async () => {
      outcome = await result.current.copy('unsupported')
    })

    expect(outcome).toBe(false)
    expect(result.current.copied).toBe(false)
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toContain('Failed to copy')
  })

  it('catches thrown rejections and sets error state gracefully (#22)', async () => {
    vi.spyOn(utils, 'copyToClipboard').mockRejectedValue(new Error('Permission denied'))

    const { result } = renderHook(() => useClipboard())

    let outcome: boolean | undefined
    await act(async () => {
      outcome = await result.current.copy('permission error')
    })

    expect(outcome).toBe(false)
    expect(result.current.copied).toBe(false)
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Permission denied')
  })

  it('clears pending timeout and resets copied timer on rapid successive copy calls', async () => {
    vi.spyOn(utils, 'copyToClipboard').mockResolvedValue(true)

    const { result } = renderHook(() => useClipboard(2000))

    await act(async () => {
      await result.current.copy('first')
    })
    expect(result.current.copied).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.copied).toBe(true)

    await act(async () => {
      await result.current.copy('second')
    })
    expect(result.current.copied).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    // 1000ms after second copy, should still be true because timeout was reset to 2000ms
    expect(result.current.copied).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    // 2000ms after second copy
    expect(result.current.copied).toBe(false)
  })

  it('cleans up timeout on unmount without state update warnings', async () => {
    vi.spyOn(utils, 'copyToClipboard').mockResolvedValue(true)

    const { result, unmount } = renderHook(() => useClipboard(2000))

    await act(async () => {
      await result.current.copy('first')
    })
    expect(result.current.copied).toBe(true)

    unmount()

    act(() => {
      vi.advanceTimersByTime(2500)
    })
  })
})
