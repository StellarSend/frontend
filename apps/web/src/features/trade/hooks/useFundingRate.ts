import { useQuery } from "@tanstack/react-query"
import { MARKETS } from "../data/markets"
import { queryKeys } from "../lib/query-keys"

const FUNDING_INTERVAL_MS = 8 * 60 * 60 * 1000 // 8-hour epochs
const CHAIN_ID = "stellar-mainnet"
const DEFAULT_MARKET_ADDRESS = "all"
const BASE_FUNDING_RATE_PER_HOUR = 0.00005
const FUNDING_VARIANCE_PER_MARKET = 0.00002

export type FundingRateInfo = {
  ratePerHour: number
  nextEpochTs: number // Unix ms timestamp of next funding settlement
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function computeFundingRatePerHour(marketAddress: string): number {
  const market = MARKETS.find((m) => m.address === marketAddress)
  if (!market) return BASE_FUNDING_RATE_PER_HOUR

  const variation =
    ((hashString(market.address) % 2001) / 1000 - 1) *
    FUNDING_VARIANCE_PER_MARKET
  return BASE_FUNDING_RATE_PER_HOUR + variation
}

function computeNextEpoch(): number {
  const now = Date.now()
  const elapsed = now % FUNDING_INTERVAL_MS
  return now - elapsed + FUNDING_INTERVAL_MS
}

async function fetchFundingRate(
  marketAddress: string
): Promise<FundingRateInfo> {
  // TODO: replace with on-chain DataStore read once contracts are deployed
  return {
    ratePerHour: computeFundingRatePerHour(marketAddress),
    nextEpochTs: computeNextEpoch(),
  }
}

export function useFundingRate(marketAddress: string = DEFAULT_MARKET_ADDRESS) {
  return useQuery<FundingRateInfo>({
    queryKey: queryKeys.trade.fundingRate(CHAIN_ID, marketAddress),
    queryFn: () => fetchFundingRate(marketAddress),
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
}
