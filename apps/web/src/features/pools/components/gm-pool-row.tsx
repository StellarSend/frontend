import { useEffect } from "react"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { usePoolRowData } from "../hooks/use-pool-row-data"
import {
  getComposition,
  getEstimatedApy,
  getFundingRatePerHourPct,
  getOpenInterestUsd,
  getPoolTvlUsd,
  rawToDisplay,
} from "../lib/pool-math"
import { PoolActions } from "./pool-actions"
import { PoolCompositionBar } from "./pool-composition-bar"
import type { PoolMarketConfig } from "../data/markets"
import { TokenIcon } from "@/shared/components/TokenIcon"
import { formatPct, formatToken, formatUsd } from "@/shared/lib/format"
import { formatSorobanAmount } from "@/shared/lib/bignum"
import { useWalletStore } from "@/features/wallet/store/wallet-store"

type GmPoolRowProps = {
  market: PoolMarketConfig
  variant: "desktop" | "mobile"
  onMetricsChange?: (marketToken: string, metrics: PoolRowMetrics) => void
}

export type PoolRowMetrics = {
  tvlUsd: number
  openInterestUsd: number
  apy: number | null
}

function formatCompactUsd(value: number) {
  return formatUsd(value, { compact: true })
}

function ValueCell({
  value,
  title,
  isLoading,
  className = "",
}: {
  value: string
  title?: string
  isLoading?: boolean
  className?: string
}) {
  if (isLoading) {
    return <Skeleton className="ml-auto h-4 w-20 max-w-full" />
  }

  return (
    <span
      className={`block min-w-0 truncate tabular-nums ${className}`}
      title={title ?? value}
    >
      {value}
    </span>
  )
}

function MobileStat({
  label,
  value,
  title,
  isLoading,
}: {
  label: string
  value: string
  title?: string
  isLoading?: boolean
}) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-muted-foreground">{label}</dt>
      <dd className="mt-1 min-w-0 font-mono text-foreground">
        <ValueCell value={value} title={title} isLoading={isLoading} />
      </dd>
    </div>
  )
}

function PoolIdentity({ market }: { market: PoolMarketConfig }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex shrink-0 -space-x-2">
        <TokenIcon symbol={market.longSymbol.replace(/^T/, "")} size={30} />
        <TokenIcon symbol={market.shortSymbol.replace(/^T/, "")} size={30} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{market.label}</p>
        <p className="truncate text-xs text-muted-foreground">{market.displayName}</p>
      </div>
    </div>
  )
}

export function GmPoolRow({ market, variant, onMetricsChange }: GmPoolRowProps) {
  const address = useWalletStore((state) => state.address)
  const isConnected = useWalletStore((state) => state.status === "connected")
  const { data, isLoading } = usePoolRowData(market)
  const poolValue = data?.poolValue
  const composition = getComposition(poolValue)
  const tvlUsd = getPoolTvlUsd(poolValue)
  const apy = getEstimatedApy(poolValue)
  const openInterestUsd = getOpenInterestUsd(data?.openInterest)
  // Display funding as an hourly percentage, matching the trade page convention.
  const funding = getFundingRatePerHourPct(data?.fundingInfo?.fundingFactorPerSecond)
  const userGmBalance = data?.userGmBalance ?? 0n
  const hasUserGm = userGmBalance > 0n
  const hasFailures = (data?.failures.length ?? 0) > 0
  const failureTitle = hasFailures ? `Unavailable reads: ${data?.failures.join(", ")}` : undefined
  const tvlLabel = formatCompactUsd(tvlUsd)
  const tvlTitle = formatUsd(tvlUsd)
  const openInterestLabel = formatCompactUsd(openInterestUsd)
  const openInterestTitle = formatUsd(openInterestUsd)
  const fundingLabel = funding === 0 ? "—" : formatPct(funding, { decimals: 4 })
  const apyLabel = apy == null ? "Est. pending" : `${formatPct(apy, { sign: false })} est.`
  const userGmLabel = formatToken(rawToDisplay(userGmBalance), "GM", { decimals: 4 })
  const userGmTitle = formatToken(Number(formatSorobanAmount(userGmBalance, 7, 7)), "GM", {
    decimals: 7,
  })

  useEffect(() => {
    onMetricsChange?.(market.marketToken, { tvlUsd, openInterestUsd, apy })
  }, [apy, market.marketToken, onMetricsChange, openInterestUsd, tvlUsd])

  if (variant === "mobile") {
    return (
      <article className="min-w-0 rounded-lg border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <PoolIdentity market={market} />
          <p className="min-w-20 max-w-28 text-right font-mono text-sm">
            <ValueCell value={tvlLabel} title={tvlTitle} isLoading={isLoading} />
          </p>
        </div>
        <div className="mt-4">
          <PoolCompositionBar
            longPct={composition.longPct}
            shortPct={composition.shortPct}
            longSymbol={market.longSymbol}
            shortSymbol={market.shortSymbol}
          />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
          <MobileStat
            label="Open interest"
            value={openInterestLabel}
            title={openInterestTitle}
            isLoading={isLoading}
          />
          <MobileStat label="APY" value={apyLabel} isLoading={isLoading} />
          <MobileStat
            label="Your GM"
            value={userGmLabel}
            title={userGmTitle}
            isLoading={isLoading}
          />
          <MobileStat label="Funding / hr" value={fundingLabel} isLoading={isLoading} />
        </dl>
        {hasFailures ? (
          <p
            className="mt-3 inline-flex max-w-full items-center rounded border border-yellow-500/25 bg-yellow-500/10 px-2 py-1 text-[12px] text-yellow-700 dark:text-yellow-300"
            title={failureTitle}
          >
            Partial data
          </p>
        ) : null}
        <div className="mt-4">
          <PoolActions
            hasWallet={!!address && isConnected}
            hasUserGm={hasUserGm}
            account={address}
            market={market}
            userGmBalance={userGmBalance}
          />
        </div>
      </article>
    )
  }

  return (
    <tr className="border-b border-border last:border-0 odd:bg-muted/15 hover:bg-muted/30">
      <td className="px-5 py-4">
        <PoolIdentity market={market} />
      </td>
      <td className="px-4 py-4 text-right font-mono text-sm">
        <ValueCell value={tvlLabel} title={tvlTitle} isLoading={isLoading} />
      </td>
      <td className="px-5 py-4">
        <PoolCompositionBar
          longPct={composition.longPct}
          shortPct={composition.shortPct}
          longSymbol={market.longSymbol}
          shortSymbol={market.shortSymbol}
        />
      </td>
      <td className="px-4 py-4 text-right font-mono text-sm">
        <ValueCell
          value={openInterestLabel}
          title={openInterestTitle}
          isLoading={isLoading}
        />
      </td>
      <td className="px-4 py-4 text-right font-mono text-sm">
        <ValueCell value={fundingLabel} isLoading={isLoading} />
      </td>
      <td className="px-4 py-4 text-right font-mono text-sm">
        <ValueCell value={apyLabel} isLoading={isLoading} />
      </td>
      <td className="px-4 py-4 text-right font-mono text-sm">
        <ValueCell value={userGmLabel} title={userGmTitle} isLoading={isLoading} />
      </td>
      <td className="px-5 py-4 text-right">
        <PoolActions
          hasWallet={!!address && isConnected}
          hasUserGm={hasUserGm}
          account={address}
          market={market}
          userGmBalance={userGmBalance}
        />
        {hasFailures ? (
          <p
            className="mt-2 text-right text-[11px] text-yellow-700 dark:text-yellow-300"
            title={failureTitle}
          >
            Partial data
          </p>
        ) : null}
      </td>
    </tr>
  )
}
