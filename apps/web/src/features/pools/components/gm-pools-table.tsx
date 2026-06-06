import type { PoolMarketConfig } from "../data/markets"
import { GmPoolRow } from "./gm-pool-row"

type GmPoolsTableProps = {
  markets: Array<PoolMarketConfig>
}

export function GmPoolsTable({ markets }: GmPoolsTableProps) {
  return (
    <>
      <div className="hidden md:block">
        <table className="w-full min-w-230 table-fixed text-left">
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
          <thead>
            <tr className="border-b border-border text-[11px] uppercase text-muted-foreground">
              <th className="px-5 py-3 font-medium">Pool</th>
              <th className="px-5 py-3 text-right font-medium">TVL</th>
              <th className="px-5 py-3 font-medium">Composition</th>
              <th className="px-5 py-3 text-right font-medium">Open Interest</th>
              <th className="px-5 py-3 text-right font-medium">Funding</th>
              <th className="px-5 py-3 text-right font-medium">APY</th>
              <th className="px-5 py-3 text-right font-medium">Your GM</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {markets.map((market) => (
              <GmPoolRow key={market.marketToken} market={market} variant="desktop" />
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {markets.map((market) => (
          <GmPoolRow key={market.marketToken} market={market} variant="mobile" />
        ))}
      </div>
    </>
  )
}
