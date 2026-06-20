import { useCallback, useMemo, useState } from "react"
import { GmPoolRow } from "./gm-pool-row"
import type { PoolRowMetrics } from "./gm-pool-row"
import type { PoolMarketConfig } from "../data/markets"

type GmPoolsTableProps = {
  markets: Array<PoolMarketConfig>
}

type SortKey = "tvlUsd" | "openInterestUsd" | "apy"
type SortDirection = "asc" | "desc"

type SortState = {
  key: SortKey
  direction: SortDirection
}

const SORT_LABELS: Record<SortKey, string> = {
  tvlUsd: "TVL",
  openInterestUsd: "Open Interest",
  apy: "APY",
}

function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string
  sortKey: SortKey
  sort: SortState
  onSort: (key: SortKey) => void
}) {
  const active = sort.key === sortKey
  const indicator = active ? (sort.direction === "asc" ? "↑" : "↓") : "↕"

  return (
    <button
      type="button"
      className={`ml-auto inline-flex h-7 items-center gap-1 rounded px-2 text-right font-medium transition-colors hover:bg-muted hover:text-foreground ${
        active ? "text-foreground" : "text-muted-foreground"
      }`}
      aria-label={`Sort by ${label}`}
      aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
      onClick={() => onSort(sortKey)}
    >
      <span>{label}</span>
      <span className="w-3 text-center text-[10px]">{indicator}</span>
    </button>
  )
}

export function GmPoolsTable({ markets }: GmPoolsTableProps) {
  const [sort, setSort] = useState<SortState>({ key: "tvlUsd", direction: "desc" })
  const [metricsByMarket, setMetricsByMarket] = useState<Partial<Record<string, PoolRowMetrics>>>({})

  const handleSort = useCallback((key: SortKey) => {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "desc" },
    )
  }, [])

  const handleMetricsChange = useCallback(
    (marketToken: string, metrics: PoolRowMetrics) => {
      setMetricsByMarket((current) => {
        const previous = current[marketToken]
        if (
          previous?.tvlUsd === metrics.tvlUsd &&
          previous.openInterestUsd === metrics.openInterestUsd &&
          previous.apy === metrics.apy
        ) {
          return current
        }

        return { ...current, [marketToken]: metrics }
      })
    },
    [],
  )

  const sortedMarkets = useMemo(() => {
    return [...markets].sort((a, b) => {
      const aMetrics = metricsByMarket[a.marketToken]
      const bMetrics = metricsByMarket[b.marketToken]
      const aValue = aMetrics?.[sort.key] ?? Number.NEGATIVE_INFINITY
      const bValue = bMetrics?.[sort.key] ?? Number.NEGATIVE_INFINITY
      const result = aValue - bValue

      if (result === 0) return a.label.localeCompare(b.label)

      return sort.direction === "asc" ? result : -result
    })
  }, [markets, metricsByMarket, sort.direction, sort.key])

  if (markets.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-sm text-muted-foreground">
        No markets configured.
      </div>
    )
  }

  return (
    <>
      <div className="hidden md:block">
        <table className="w-full min-w-190 table-fixed text-left">
          <colgroup>
            <col className="w-[19%]" />
            <col className="w-[12%]" />
            <col className="w-[20%]" />
            <col className="w-[13%]" />
            <col className="w-[11%]" />
            <col className="w-[10%]" />
            <col className="w-[11%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
            <tr className="border-b border-border text-[11px] uppercase text-muted-foreground">
              <th className="px-5 py-3 font-medium">Pool</th>
              <th className="px-2 py-3 text-right font-medium">
                <SortHeader label="TVL" sortKey="tvlUsd" sort={sort} onSort={handleSort} />
              </th>
              <th className="px-5 py-3 font-medium">Composition</th>
              <th className="px-2 py-3 text-right font-medium">
                <SortHeader
                  label="Open Interest"
                  sortKey="openInterestUsd"
                  sort={sort}
                  onSort={handleSort}
                />
              </th>
              <th className="px-5 py-3 text-right font-medium">Funding / hr</th>
              <th className="px-2 py-3 text-right font-medium">
                <SortHeader label="APY" sortKey="apy" sort={sort} onSort={handleSort} />
              </th>
              <th className="px-5 py-3 text-right font-medium">Your GM</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedMarkets.map((market) => (
              <GmPoolRow
                key={market.marketToken}
                market={market}
                variant="desktop"
                onMetricsChange={handleMetricsChange}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        <div className="flex items-center justify-between gap-3 px-1 text-[11px] uppercase text-muted-foreground">
          <span>Sorted by {SORT_LABELS[sort.key]}</span>
          <button
            type="button"
            className="rounded border border-border px-2 py-1 text-foreground"
            onClick={() => handleSort(sort.key)}
          >
            {sort.direction === "asc" ? "Ascending" : "Descending"}
          </button>
        </div>
        {sortedMarkets.map((market) => (
          <GmPoolRow
            key={market.marketToken}
            market={market}
            variant="mobile"
            onMetricsChange={handleMetricsChange}
          />
        ))}
      </div>
    </>
  )
}
