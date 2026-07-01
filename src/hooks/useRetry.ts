import { useState, useCallback } from "react"
interface Options { maxAttempts?: number; delay?: number }
export function useRetry(fn: () => Promise<void>, { maxAttempts = 3, delay = 1000 }: Options = {}) {
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const run = useCallback(async () => {
    setLoading(true); setError(null)
    for (let i = 0; i < maxAttempts; i++) {
      try { await fn(); setAttempt(0); return }
      catch (e) {
        setAttempt(i + 1)
        if (i < maxAttempts - 1) await new Promise(r => setTimeout(r, delay * (i + 1)))
        else setError((e as Error).message)
      }
    }
    setLoading(false)
  }, [fn, maxAttempts, delay])
  return { run, attempt, error, loading }
}
