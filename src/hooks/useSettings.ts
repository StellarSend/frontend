import { useState, useCallback, useEffect } from 'react'
import type { AppSettings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'

export const SETTINGS_STORAGE_KEY = 'stellarsend_settings'

export function getStoredSettings(): AppSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
  } catch {
    // corrupted or unavailable localStorage — fall back to defaults
  }
  return DEFAULT_SETTINGS
}

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(() => getStoredSettings())

  // Keep state synced across tabs / components if storage changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === SETTINGS_STORAGE_KEY) {
        setSettingsState(getStoredSettings())
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const save = useCallback((next: AppSettings) => {
    setSettingsState(next)
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next))
    // Also sync flat refresh interval key for backward compat / direct listeners
    localStorage.setItem('stellarsend_refresh_interval', String(next.autoRefreshInterval))
    // Also sync network preference
    localStorage.setItem('stellarsend_network', next.network)
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('stellarsend_settings_updated'))
  }, [])

  const reset = useCallback(() => save(DEFAULT_SETTINGS), [save])

  return { settings, save, reset }
}
