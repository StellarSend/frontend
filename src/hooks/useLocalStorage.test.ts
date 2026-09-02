import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('reads initial value from localStorage if present', () => {
    localStorage.setItem('test-key', JSON.stringify({ name: 'Alice' }))
    const { result } = renderHook(() => useLocalStorage('test-key', { name: 'Default' }))
    expect(result.current[0]).toEqual({ name: 'Alice' })
  })

  it('falls back to default value if key is not in localStorage or parse fails', () => {
    localStorage.setItem('corrupt-key', 'invalid json{')
    const { result: r1 } = renderHook(() => useLocalStorage('non-existent', 'fallback'))
    expect(r1.current[0]).toBe('fallback')

    const { result: r2 } = renderHook(() => useLocalStorage('corrupt-key', 'fallback'))
    expect(r2.current[0]).toBe('fallback')
  })

  it('persists value updates to localStorage and updates state', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    
    act(() => {
      result.current[1]('updated')
    })

    expect(result.current[0]).toBe('updated')
    expect(JSON.parse(localStorage.getItem('test-key')!)).toBe('updated')

    act(() => {
      result.current[1](prev => prev + '-fn')
    })

    expect(result.current[0]).toBe('updated-fn')
    expect(JSON.parse(localStorage.getItem('test-key')!)).toBe('updated-fn')
  })

  it('handles localStorage.setItem throwing QuotaExceededError gracefully without throwing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { result } = renderHook(() => useLocalStorage('quota-key', 'safe'))

    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      const err = new Error('QuotaExceededError')
      err.name = 'QuotaExceededError'
      throw err
    })

    expect(() => {
      act(() => {
        result.current[1]('new-value')
      })
    }).not.toThrow()

    expect(result.current[0]).toBe('new-value')
    expect(warnSpy).toHaveBeenCalled()
  })

  it('clears localStorage and resets state on remove()', () => {
    localStorage.setItem('test-key', JSON.stringify('existing'))
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))

    act(() => {
      result.current[2]()
    })

    expect(result.current[0]).toBe('default')
    expect(localStorage.getItem('test-key')).toBeNull()
  })

  it('handles localStorage.removeItem throwing gracefully without throwing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))

    vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    expect(() => {
      act(() => {
        result.current[2]()
      })
    }).not.toThrow()

    expect(result.current[0]).toBe('default')
    expect(warnSpy).toHaveBeenCalled()
  })
})
