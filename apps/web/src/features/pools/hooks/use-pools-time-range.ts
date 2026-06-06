import { useState } from "react"

export type PoolsTimeRange = "total" | "7d" | "30d" | "90d"

export const POOLS_TIME_RANGES: Array<{ value: PoolsTimeRange; label: string }> = [
  { value: "total", label: "Total" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
]

export function usePoolsTimeRange(defaultValue: PoolsTimeRange = "30d") {
  const [timeRange, setTimeRange] = useState<PoolsTimeRange>(defaultValue)

  return { timeRange, setTimeRange, options: POOLS_TIME_RANGES }
}
