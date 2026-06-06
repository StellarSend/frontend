import { useQuery } from "@tanstack/react-query"
import { fromSorobanAmount } from "@/shared/lib/bignum"
import { queryKeys } from "@/shared/lib/query-keys"
import { syntheticsReaderClient } from "@/lib/contracts"

const syntheticsReader = syntheticsReaderClient

type MarketPoolAmounts = {
  longTokenAmount: number
  shortTokenAmount: number
  poolValueUsd: number
}

async function fetchMarketPoolAmounts(marketAddress: string): Promise<MarketPoolAmounts> {
  const amounts = await syntheticsReader.getMarketPoolAmounts(marketAddress)
  return {
    longTokenAmount: fromSorobanAmount(amounts.longTokenAmount, 7),
    shortTokenAmount: fromSorobanAmount(amounts.shortTokenAmount, 7),
    poolValueUsd: fromSorobanAmount(amounts.poolValueUsd, 7),
  }
}

export function useMarketPoolAmounts(marketAddress: string) {
  return useQuery<MarketPoolAmounts>({
    queryKey: queryKeys.earn.marketPoolAmounts(marketAddress),
    queryFn: () => fetchMarketPoolAmounts(marketAddress),
    enabled: !!marketAddress,
    staleTime: 20_000,
    refetchInterval: 30_000,
  })
}
