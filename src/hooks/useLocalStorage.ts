import { useState } from 'react'
export function useLocalStorage<T>(key: string, init: T) {
  const [val, setVal] = useState<T>(() => { try { const i = localStorage.getItem(key); return i ? JSON.parse(i) : init } catch { return init } })
  const set = (v: T | ((p: T) => T)) => { const s = v instanceof Function ? v(val) : v; setVal(s); localStorage.setItem(key, JSON.stringify(s)) }
  const remove = () => { localStorage.removeItem(key); setVal(init) }
  return [val, set, remove] as const
}
