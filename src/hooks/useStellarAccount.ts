import { useState, useCallback } from 'react'

interface AccountInfo {
  address: string
  balance: string
  sequence: string
}

export function useStellarAccount() {
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAccount = useCallback(async (address: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`https://horizon.stellar.org/accounts/${address}`)
      if (res.status === 404) throw new Error('Account not found')
      if (!res.ok) throw new Error('Network error')
      const data = await res.json()
      const xlmBalance = data.balances?.find((b: { asset_type: string }) => b.asset_type === 'native')
      setAccount({
        address,
        balance: xlmBalance?.balance ?? '0',
        sequence: data.sequence,
      })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { account, loading, error, fetchAccount }
}
