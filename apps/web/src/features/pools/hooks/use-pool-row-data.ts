import { useQuery } from "@tanstack/react-query"
import type { FundingInfo, MarketProps, PoolValueInfo } from "@/lib/contracts"
import { getTokenClient, syntheticsReaderClient } from "@/lib/contracts"
import { useWalletStore } from "@/features/wallet/store/wallet-store"
import { queryKeys } from "@/shared/lib/query-keys"
import type { PoolMarketConfig } from "../data/markets"

export type PoolRowData = {
  market: MarketProps | null
  poolValue: PoolValueInfo | null
  openInterest: { long: bigint; short: bigint } | null
  fundingInfo: FundingInfo | null
  userGmBalance: bigint
  totalSupply: bigint
  failures: Array<string>
}

export function usePoolRowData(market: PoolMarketConfig) {
  const address = useWalletStore((state) => state.address)

  return useQuery<PoolRowData>({
    queryKey: queryKeys.pools.row(market.marketToken, address ?? null),
    queryFn: async () => {
      const tokenClient = getTokenClient(market.marketToken, address ?? undefined)
      const [marketResult, poolValueResult, openInterestResult, fundingResult, balanceResult, supplyResult] =
        await Promise.allSettled([
          syntheticsReaderClient.getMarket(market.marketToken),
          syntheticsReaderClient.getMarketPoolValueInfo(market.marketToken),
          syntheticsReaderClient.getOpenInterest(market.marketToken),
          syntheticsReaderClient.getFundingInfo(market.marketToken),
          address ? tokenClient.balance(address) : Promise.resolve(0n),
          tokenClient.totalSupply(),
        ])

      const failures: Array<string> = []
      const recordFailure = (label: string, result: PromiseSettledResult<unknown>) => {
        if (result.status === "rejected") failures.push(label)
      }

      recordFailure("market", marketResult)
      recordFailure("pool value", poolValueResult)
      recordFailure("open interest", openInterestResult)
      recordFailure("funding", fundingResult)
      recordFailure("GM balance", balanceResult)
      recordFailure("total supply", supplyResult)

      return {
        market: marketResult.status === "fulfilled" ? marketResult.value : null,
        poolValue: poolValueResult.status === "fulfilled" ? poolValueResult.value : null,
        openInterest: openInterestResult.status === "fulfilled" ? openInterestResult.value : null,
        fundingInfo: fundingResult.status === "fulfilled" ? fundingResult.value : null,
        userGmBalance: balanceResult.status === "fulfilled" ? balanceResult.value : 0n,
        totalSupply: supplyResult.status === "fulfilled" ? supplyResult.value : 0n,
        failures,
      }
    },
    staleTime: 30_000,
    refetchInterval: 45_000,
  })
}
