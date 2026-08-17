import { act, renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { usePendingIds } from './usePendingIds'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('usePendingIds', () => {
  it('marks an id pending immediately when tracked', () => {
    const { result } = renderHook(() => usePendingIds())
    const { promise } = deferred<void>()

    act(() => {
      result.current.track('a', promise)
    })

    expect(result.current.pendingIds.has('a')).toBe(true)
  })

  it('two different ids tracked concurrently stay independently pending', () => {
    const { result } = renderHook(() => usePendingIds())
    const a = deferred<void>()
    const b = deferred<void>()

    act(() => {
      result.current.track('a', a.promise)
      result.current.track('b', b.promise)
    })

    expect(result.current.pendingIds.has('a')).toBe(true)
    expect(result.current.pendingIds.has('b')).toBe(true)
  })

  it('resolving one id does not clear a different, still-pending id (#52)', async () => {
    const { result } = renderHook(() => usePendingIds())
    const a = deferred<void>()
    const b = deferred<void>()

    act(() => {
      result.current.track('a', a.promise)
      result.current.track('b', b.promise)
    })

    await act(async () => {
      b.resolve()
      await b.promise
    })

    expect(result.current.pendingIds.has('a')).toBe(true)
    expect(result.current.pendingIds.has('b')).toBe(false)
  })

  it('clears the id once its promise resolves', async () => {
    const { result } = renderHook(() => usePendingIds())
    const { promise, resolve } = deferred<void>()

    act(() => {
      result.current.track('a', promise)
    })
    expect(result.current.pendingIds.has('a')).toBe(true)

    await act(async () => {
      resolve()
      await promise
    })

    expect(result.current.pendingIds.has('a')).toBe(false)
  })

  it('clears the id even when its promise rejects, without an unhandled rejection', async () => {
    const { result } = renderHook(() => usePendingIds())
    const { promise, reject } = deferred<void>()

    act(() => {
      result.current.track('a', promise)
    })

    await act(async () => {
      reject(new Error('boom'))
      await promise.catch(() => {})
    })

    expect(result.current.pendingIds.has('a')).toBe(false)
  })

  it('tracking the same id twice while the first is still pending is a no-op on entry', () => {
    const { result } = renderHook(() => usePendingIds())
    const a = deferred<void>()
    const b = deferred<void>()

    act(() => {
      result.current.track('a', a.promise)
      result.current.track('a', b.promise)
    })

    expect(result.current.pendingIds.has('a')).toBe(true)
    expect(result.current.pendingIds.size).toBe(1)
  })

  it('track is referentially stable across renders', () => {
    const { result, rerender } = renderHook(() => usePendingIds())
    const first = result.current.track
    rerender()
    expect(result.current.track).toBe(first)
  })

  it('does not produce an unhandled rejection warning for a rejected promise', async () => {
    const onUnhandledRejection = vi.fn()
    process.on('unhandledRejection', onUnhandledRejection)

    const { result } = renderHook(() => usePendingIds())
    const { promise, reject } = deferred<void>()

    act(() => {
      result.current.track('a', promise)
    })

    await act(async () => {
      reject(new Error('boom'))
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(onUnhandledRejection).not.toHaveBeenCalled()
    process.off('unhandledRejection', onUnhandledRejection)
  })
})
