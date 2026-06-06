import { useQuery } from "@tanstack/react-query"
import { fromSorobanAmount } from "@/shared/lib/bignum"
import { syntheticsReaderClient } from "@/lib/contracts"
import { queryKeys } from "../lib/query-keys"

const USD_DECIMALS = 30

export type OpenInterest = {
  /** Long open interest in USD. */
  longOI: number
  /** Short open interest in USD. */
  shortOI: number
  /** Long OI as a percentage of total (0–100). */
  longOIPct: number
  /** Short OI as a percentage of total (0–100). */
  shortOIPct: number
}

export function useOpenInterest(marketAddress: string) {
  return useQuery<OpenInterest>({
    queryKey: queryKeys.trade.openInterest(marketAddress),
    queryFn: async (): Promise<OpenInterest> => {
      const client = syntheticsReaderClient
      const info = await client.getOpenInterest(marketAddress)
      const longOI = fromSorobanAmount(info.long, USD_DECIMALS)
      const shortOI = fromSorobanAmount(info.short, USD_DECIMALS)
      const total = longOI + shortOI
      return {
        longOI,
        shortOI,
        longOIPct: total > 0 ? (longOI / total) * 100 : 50,
        shortOIPct: total > 0 ? (shortOI / total) * 100 : 50,
      }
    },
    enabled: !!marketAddress,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}
