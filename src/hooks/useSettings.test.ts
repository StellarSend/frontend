import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSettings, getStoredSettings, SETTINGS_STORAGE_KEY } from './useSettings'
import { DEFAULT_SETTINGS } from '@/types'

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('initializes with default settings when localStorage is empty', () => {
    const { result } = renderHook(() => useSettings())
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS)
    expect(result.current.settings.showTestnetWarning).toBe(true)
    expect(result.current.settings.autoRefreshInterval).toBe(30)
    expect(result.current.settings.defaultMemo).toBe('')
    expect(result.current.settings.slippageTolerance).toBe('0.5')
  })

  it('reads stored settings from localStorage on init', () => {
    const custom = {
      ...DEFAULT_SETTINGS,
      autoRefreshInterval: 60,
      defaultMemo: 'Test Memo',
      showTestnetWarning: false,
      slippageTolerance: '1.0',
    }
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(custom))

    const { result } = renderHook(() => useSettings())
    expect(result.current.settings.autoRefreshInterval).toBe(60)
    expect(result.current.settings.defaultMemo).toBe('Test Memo')
    expect(result.current.settings.showTestnetWarning).toBe(false)
    expect(result.current.settings.slippageTolerance).toBe('1.0')
  })

  it('persists changes to localStorage when save() is called and syncs auxiliary keys', () => {
    const { result } = renderHook(() => useSettings())

    const updated = {
      ...DEFAULT_SETTINGS,
      autoRefreshInterval: 300,
      defaultMemo: 'Payroll',
      showTestnetWarning: false,
      slippageTolerance: '2.5',
    }

    act(() => {
      result.current.save(updated)
    })

    expect(result.current.settings).toEqual(updated)
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)!)).toEqual(updated)
    expect(localStorage.getItem('stellarsend_refresh_interval')).toBe('300')
    expect(localStorage.getItem('stellarsend_network')).toBe('testnet')
  })

  it('resets to default settings when reset() is called', () => {
    const custom = {
      ...DEFAULT_SETTINGS,
      autoRefreshInterval: 60,
      defaultMemo: 'Custom',
    }
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(custom))

    const { result } = renderHook(() => useSettings())
    expect(result.current.settings.defaultMemo).toBe('Custom')

    act(() => {
      result.current.reset()
    })

    expect(result.current.settings).toEqual(DEFAULT_SETTINGS)
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)!)).toEqual(DEFAULT_SETTINGS)
  })
})
