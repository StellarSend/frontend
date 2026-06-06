import { Link } from "@tanstack/react-router"
import { Navbar } from "@/ui/Navbar"
import { NetworkMismatchBanner } from "@/features/wallet/components/NetworkMismatchBanner"
import { formatUsd } from "@/shared/lib/format"
import { usePoolsData } from "../hooks/use-pools-data"
import { usePoolsTimeRange } from "../hooks/use-pools-time-range"
import { PoolsCard } from "./pools-card"
import { PoolsTimeRangeFilter } from "./pools-time-range-filter"
import { GmPoolsTable } from "./gm-pools-table"

export function PoolsPage() {
  const { timeRange, setTimeRange, options } = usePoolsTimeRange()
  const { markets, glvEnabled } = usePoolsData(timeRange)

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <Navbar variant="app" />
      <NetworkMismatchBanner />

      <main className="mx-auto w-full max-w-320 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">Pools</h1>
            <p className="mt-1.5 max-w-160 text-sm text-muted-foreground">
              Provide liquidity to bootstrapped SO4 GM markets on Stellar testnet.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <div className="rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-[11px] uppercase text-muted-foreground">Total pool TVL</p>
              <p className="mt-1 font-mono text-lg text-foreground">{formatUsd(0)}</p>
            </div>
            <PoolsTimeRangeFilter value={timeRange} options={options} onChange={setTimeRange} />
          </div>
        </header>

        <div className="mb-5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-300">
          Deposit and withdrawal transactions are disabled until liquidity seeding and oracle
          pricing are confirmed. Read-only pool data uses live Soroban calls where available.
        </div>

        <PoolsCard
          title="GM Pools"
          description="Three configured GM markets using real testnet Soroban contract addresses."
          contentHeader={
            <Link
              to="/faucet"
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-input/50"
            >
              Get test tokens
            </Link>
          }
          bottomContent={
            <p className="text-[12px] text-muted-foreground">
              APY is shown only as estimated when pool value is available; production performance
              snapshots are not wired yet.
            </p>
          }
        >
          <GmPoolsTable markets={markets} />
        </PoolsCard>

        {!glvEnabled ? (
          <div className="mt-5 rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            GLV vaults are hidden because GLV contracts are not deployed for this testnet.
          </div>
        ) : null}
      </main>
    </div>
  )
}
