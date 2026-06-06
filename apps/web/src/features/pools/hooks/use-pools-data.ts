import { useMemo } from "react"
import { POOL_MARKETS } from "../data/markets"
import type { PoolsTimeRange } from "./use-pools-time-range"

export function usePoolsData(_timeRange: PoolsTimeRange) {
  return useMemo(() => ({ markets: POOL_MARKETS, glvEnabled: false }), [])
}
