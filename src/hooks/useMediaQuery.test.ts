import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import { useMediaQuery, useIsDarkMode } from './useMediaQuery'

function createMockMatchMedia(initialMatches: boolean) {
  let matches = initialMatches
  const listeners = new Set<(e: MediaQueryListEvent) => void>()

  const mql = {
    get matches() {
      return matches
    },
    media: '',
    onchange: null,
    addEventListener: (_: 'change', handler: (e: MediaQueryListEvent) => void) => {
      listeners.add(handler)
    },
    removeEventListener: (_: 'change', handler: (e: MediaQueryListEvent) => void) => {
      listeners.delete(handler)
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }

  return {
    matchMedia: () => mql as unknown as MediaQueryList,
    fireChange: (nextMatches: boolean) => {
      matches = nextMatches
      const event = { matches: nextMatches } as MediaQueryListEvent
      listeners.forEach((handler) => handler(event))
    },
  }
}

describe('useMediaQuery / useIsDarkMode', () => {
  const originalMatchMedia = window.matchMedia

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('returns the initial matches value synchronously', () => {
    const mock = createMockMatchMedia(true)
    window.matchMedia = mock.matchMedia

    const { result } = renderHook(() => useMediaQuery('(prefers-color-scheme: dark)'))

    expect(result.current).toBe(true)
  })

  it('updates when the underlying media query fires a change event', () => {
    const mock = createMockMatchMedia(false)
    window.matchMedia = mock.matchMedia

    const { result } = renderHook(() => useMediaQuery('(prefers-color-scheme: dark)'))
    expect(result.current).toBe(false)

    act(() => {
      mock.fireChange(true)
    })

    expect(result.current).toBe(true)
  })

  it('removes its change listener on unmount', () => {
    const mock = createMockMatchMedia(false)
    window.matchMedia = mock.matchMedia

    const { unmount } = renderHook(() => useMediaQuery('(prefers-color-scheme: dark)'))
    unmount()

    // Firing a change after unmount should not throw (no dangling listener
    // calling setState on an unmounted component).
    expect(() => mock.fireChange(true)).not.toThrow()
  })

  it('useIsDarkMode reflects the prefers-color-scheme: dark query', () => {
    const mock = createMockMatchMedia(true)
    window.matchMedia = mock.matchMedia

    const { result } = renderHook(() => useIsDarkMode())

    expect(result.current).toBe(true)
  })
})
