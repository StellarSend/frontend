import { useState, useEffect, useRef, useContext } from 'react'
import { fetchExchangeRate, DEFAULT_FALLBACK_XLM_USD } from '@/lib/exchangeRate'
import { useWalletContext } from '@/context/WalletContext'

export interface ExchangeRateState {
  xlmUsd: number
  source?: 'coingecko' | 'horizon' | 'fallback'
}

/**
 * Hook to retrieve live XLM/USD spot exchange rate.
 * Polls every 30s while respecting the active network (if within WalletProvider).
 */
export function useExchangeRate() {
  let network: 'testnet' | 'mainnet' = 'mainnet'
  try {
    const walletCtx = useWalletContext()
    network = walletCtx.wallet.network
  } catch {
    // Gracefully handle usage outside WalletProvider in isolated tests or standalone components
    network = 'mainnet'
  }

  const [rate, setRate] = useState<ExchangeRateState>({
    xlmUsd: DEFAULT_FALLBACK_XLM_USD,
    source: 'fallback',
  })
  const [loading, setLoading] = useState(true)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    let isFirst = true
    const updateRate = async () => {
      try {
        if (isFirst) setLoading(true)
        const result = await fetchExchangeRate(network)
        if (isMountedRef.current) {
          setRate(result)
          setLoading(false)
        }
      } catch {
        if (isMountedRef.current) {
          setLoading(false)
        }
      } finally {
        isFirst = false
      }
    }

    updateRate()
    const timer = setInterval(updateRate, 30_000)

    return () => {
      isMountedRef.current = false
      clearInterval(timer)
    }
  }, [network])

  return { rate, loading }
}
