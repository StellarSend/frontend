import { useState, useCallback } from 'react'

export function useLocalStorage<T>(key: string, init: T) {
  const [val, setVal] = useState<T>(() => {
    try {
      const i = localStorage.getItem(key)
      return i ? JSON.parse(i) : init
    } catch {
      return init
    }
  })

  const set = useCallback((v: T | ((p: T) => T)) => {
    setVal(prev => {
      const next = v instanceof Function ? v(prev) : v
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch (err) {
        console.warn(`[useLocalStorage] Failed to persist key "${key}":`, err)
      }
      return next
    })
  }, [key])

  const remove = useCallback(() => {
    try {
      localStorage.removeItem(key)
    } catch (err) {
      console.warn(`[useLocalStorage] Failed to remove key "${key}":`, err)
    }
    setVal(init)
  }, [key, init])

  return [val, set, remove] as const
}
