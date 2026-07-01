import React from "react"
import { useExchangeRate } from "../../hooks/useExchangeRate"
interface Props { xlmAmount?: number }
export function RateBadge({ xlmAmount }: Props) {
  const { rate, loading } = useExchangeRate()
  if (loading) return <span className="text-xs text-gray-400">Loading rate…</span>
  if (!rate) return null
  const usdValue = xlmAmount != null ? (xlmAmount * rate.xlmUsd).toFixed(2) : null
  return (
    <span className="text-xs text-gray-500 font-mono">
      {usdValue != null ? `≈ $${usdValue} USD` : `1 XLM = $${rate.xlmUsd.toFixed(4)} USD`}
    </span>
  )
}
