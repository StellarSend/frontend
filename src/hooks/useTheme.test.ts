import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useTheme } from './useTheme'

function createMockMatchMedia(initialMatches: boolean) {
  let matches = initialMatches
  const listeners = new Set<(e: MediaQueryListEvent) => void>()

  const mql = {
    get matches() {
      return matches
    },
    media: '(prefers-color-scheme: dark)',
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

describe('useTheme', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('reacts live to an OS theme change while theme is "system", with no change to theme itself', () => {
    const mock = createMockMatchMedia(false)
    window.matchMedia = mock.matchMedia

    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('system')
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    act(() => {
      mock.fireChange(true)
    })

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(result.current.theme).toBe('system')
  })

  it('toggles the dark class back off when the OS switches back to light', () => {
    const mock = createMockMatchMedia(true)
    window.matchMedia = mock.matchMedia

    renderHook(() => useTheme())
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    act(() => {
      mock.fireChange(false)
    })

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('does not react to OS theme changes when explicitly set to "light"', () => {
    localStorage.setItem('ss-theme', JSON.stringify('light'))
    const mock = createMockMatchMedia(false)
    window.matchMedia = mock.matchMedia

    renderHook(() => useTheme())
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    act(() => {
      mock.fireChange(true)
    })

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('does not react to OS theme changes when explicitly set to "dark"', () => {
    localStorage.setItem('ss-theme', JSON.stringify('dark'))
    const mock = createMockMatchMedia(true)
    window.matchMedia = mock.matchMedia

    renderHook(() => useTheme())
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    act(() => {
      mock.fireChange(false)
    })

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
