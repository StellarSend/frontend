import type { PoolValueInfo } from "@/lib/contracts"
import { fromSorobanAmount } from "@/shared/lib/bignum"

export const TOKEN_DECIMALS = 7
export const USD_DECIMALS = 30

const SECONDS_PER_HOUR = 3600n

export function rawToDisplay(raw: bigint | undefined | null, decimals = TOKEN_DECIMALS): number {
  return fromSorobanAmount(raw ?? 0n, decimals)
}

export function usdRawToDisplay(raw: bigint | undefined | null): number {
  return fromSorobanAmount(raw ?? 0n, USD_DECIMALS)
}

export function getPoolTvlUsd(poolValue: PoolValueInfo | null | undefined): number {
  return usdRawToDisplay(poolValue?.poolValue)
}

export function getOpenInterestUsd(
  openInterest: { long: bigint; short: bigint } | null | undefined,
): number {
  return usdRawToDisplay(openInterest?.long) + usdRawToDisplay(openInterest?.short)
}

export function getFundingRatePerHourPct(
  fundingFactorPerSecond: bigint | null | undefined,
): number {
  const perHourFactor = (fundingFactorPerSecond ?? 0n) * SECONDS_PER_HOUR

  return usdRawToDisplay(perHourFactor) * 100
}

export function getComposition(poolValue: PoolValueInfo | null | undefined) {
  const longUsd = usdRawToDisplay(poolValue?.longTokenUsd)
  const shortUsd = usdRawToDisplay(poolValue?.shortTokenUsd)
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
