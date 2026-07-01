import { useState, useEffect } from 'react'
export function useExchangeRate() {
  const [rate, setRate] = useState<{ xlmUsd: number } | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const update = () => setRate({ xlmUsd: 0.12 })
    setLoading(true); setTimeout(() => { update(); setLoading(false) }, 200)
    const t = setInterval(update, 30_000)
    return () => clearInterval(t)
  }, [])
  return { rate, loading }
}
