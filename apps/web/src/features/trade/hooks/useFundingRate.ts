import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "../lib/query-keys"
import { SyntheticsReaderClient } from "@/lib/contracts/synthetics-reader"

const FUNDING_INTERVAL_MS = 8 * 60 * 60 * 1000 // 8-hour epochs
const CHAIN_ID = "stellar-mainnet"
const DEFAULT_MARKET_ADDRESS = "all"
const SECONDS_PER_HOUR = 3600n
const FACTOR_PRECISION = 10n ** 30n

export type FundingRateInfo = {
  ratePerHour: number
  nextEpochTs: number // Unix ms timestamp of next funding settlement
}

function computeNextEpoch(): number {
  const now = Date.now()
  const elapsed = now % FUNDING_INTERVAL_MS
  return now - elapsed + FUNDING_INTERVAL_MS
}

async function fetchFundingRate(marketAddress: string): Promise<FundingRateInfo> {
  if (marketAddress === DEFAULT_MARKET_ADDRESS) {
    return { ratePerHour: 0, nextEpochTs: computeNextEpoch() }
  }

  const reader = new SyntheticsReaderClient()
  const info = await reader.getFundingInfo(marketAddress)

  // funding_factor_per_second is in 30-decimal precision.
  // per-hour rate (fractional) = factor_per_second × 3600 / 10^30
  const perHourFactor = info.fundingFactorPerSecond * SECONDS_PER_HOUR
  const ratePerHour = Number(perHourFactor) / Number(FACTOR_PRECISION)

  return { ratePerHour, nextEpochTs: computeNextEpoch() }
}

export function useFundingRate(marketAddress: string = DEFAULT_MARKET_ADDRESS) {
  return useQuery<FundingRateInfo>({
    queryKey: queryKeys.trade.fundingRate(CHAIN_ID, marketAddress),
    queryFn: () => fetchFundingRate(marketAddress),
    enabled: marketAddress !== DEFAULT_MARKET_ADDRESS,
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
}
