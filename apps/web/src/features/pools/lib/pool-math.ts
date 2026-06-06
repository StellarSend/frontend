import { fromSorobanAmount } from "@/shared/lib/bignum"
import type { PoolValueInfo } from "@/lib/contracts"

const DEFAULT_DECIMALS = 7

export function rawToDisplay(raw: bigint | undefined | null, decimals = DEFAULT_DECIMALS): number {
  return fromSorobanAmount(raw ?? 0n, decimals)
}

export function getPoolTvlUsd(poolValue: PoolValueInfo | null | undefined): number {
  return rawToDisplay(poolValue?.poolValue)
}

export function getComposition(poolValue: PoolValueInfo | null | undefined) {
  const longUsd = rawToDisplay(poolValue?.longTokenUsd)
  const shortUsd = rawToDisplay(poolValue?.shortTokenUsd)
  const usdTotal = longUsd + shortUsd

  if (usdTotal > 0) {
    return {
      longPct: (longUsd / usdTotal) * 100,
      shortPct: (shortUsd / usdTotal) * 100,
      source: "usd" as const,
    }
  }

  const longAmount = rawToDisplay(poolValue?.longTokenAmount)
  const shortAmount = rawToDisplay(poolValue?.shortTokenAmount)
  const amountTotal = longAmount + shortAmount

  if (amountTotal > 0) {
    return {
      longPct: (longAmount / amountTotal) * 100,
      shortPct: (shortAmount / amountTotal) * 100,
      source: "amount" as const,
    }
  }

  return { longPct: 50, shortPct: 50, source: "empty" as const }
}

export function getEstimatedApy(poolValue: PoolValueInfo | null | undefined): number | null {
  const tvlUsd = getPoolTvlUsd(poolValue)
  if (tvlUsd <= 0) return null

  return Math.min(18, Math.max(2, 12 / Math.log10(tvlUsd + 10)))
}
