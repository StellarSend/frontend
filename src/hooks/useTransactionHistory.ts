import { useState, useEffect, useCallback } from 'react'
export function useTransactionHistory(address: string | null) {
  const [transactions, setTransactions] = useState<unknown[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchTxs = useCallback(async () => {
    if (!address) return
    setLoading(true)
    try {
      const r = await fetch('https://horizon.stellar.org/accounts/' + address + '/payments?order=desc&limit=20')
      const d = await r.json()
      setTransactions(d._embedded?.records ?? [])
    } catch (e) { setError((e as Error).message) } finally { setLoading(false) }
  }, [address])
  useEffect(() => { fetchTxs() }, [fetchTxs])
  return { transactions, loading, error, refresh: fetchTxs }
}
