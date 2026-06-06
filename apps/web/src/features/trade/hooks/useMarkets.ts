import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { MARKETS } from "../data/markets"
import type { Market } from "../data/markets"
import { useTokenList } from "./useTokenList"
import { syntheticsReaderClient } from "@/lib/contracts"
import { queryKeys } from "../lib/query-keys"

async function fetchMarkets(): Promise<Array<Market>> {
  const client = syntheticsReaderClient
  const results = await Promise.allSettled(
    MARKETS.map(async (market) => {
      const info = await client.getMarketInfo(market.address)
      return { ...market, isDisabled: info.isDisabled }
    }),
  )
  // Fall back to static entry for any market whose RPC call failed.
  return results.map((result, i) =>
    result.status === "fulfilled" ? result.value : MARKETS[i]!,
  )
}

export function useMarkets() {
  const { getToken } = useTokenList()

  const { data: markets = MARKETS } = useQuery<Array<Market>>({
    queryKey: queryKeys.trade.markets(),
    queryFn: fetchMarkets,
    staleTime: 60_000,
    retry: false,
  })

  const getMarket = useMemo(
    () => (address: string) => markets.find((m) => m.address === address),
    [markets],
  )

  const getMarketsForIndexToken = useMemo(
    () => (indexTokenAddressOrSymbol: string) => {
      const token = getToken(indexTokenAddressOrSymbol)
      const tokenAddress = token ? token.address : indexTokenAddressOrSymbol
      return markets.filter((m) => m.indexTokenAddress === tokenAddress)
    },
    [markets, getToken],
  )

  return { markets, getMarket, getMarketsForIndexToken }
}

export type { Market }
