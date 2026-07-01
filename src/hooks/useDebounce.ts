import { useState, useEffect } from 'react'
export function useDebounce<T>(value: T, delay = 300): T {
  const [d, setD] = useState(value)
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t) }, [value, delay])
  return d
}
