import { POOL_MARKETS } from "@/features/pools/data/markets"

export type GmPool = {
  id: string
  marketAddress: string
  name: string
  longToken: string
  shortToken: string
  /** Annualized yield % — replace with live usePerformanceAnnualized when on-chain */
  apy: number
  tvlUsd: number
  longPct: number
  shortPct: number
}

export type GlvVault = {
  id: string
  name: string
  displayPair: string
  underlyingPools: Array<string>
  apy: number
  tvlUsd: number
}

export const GM_POOLS: Array<GmPool> = POOL_MARKETS.map((market) => ({
  id: `gm-${market.label.toLowerCase().replace("/", "-")}`,
  marketAddress: market.marketToken,
  name: market.displayName,
  longToken: market.longSymbol,
  shortToken: market.shortSymbol,
  apy: 0,
  tvlUsd: 0,
  longPct: 50,
  shortPct: 50,
}))

// TODO: GLV vault APY aggregates underlying GM pool performance weighted by allocation
export const GLV_VAULTS: Array<GlvVault> = [
  {
    id: "glv-btc-usdc",
    name: "GLV",
    displayPair: "BTC-USDC",
    underlyingPools: ["gm-btc-usdc", "gm-eth-usdc"],
    apy: 10.17,
    tvlUsd: 4_250_000,
  },
  {
    id: "glv-xlm-usdc",
    name: "GLV",
    displayPair: "XLM-USDC",
    underlyingPools: ["gm-xlm-usdc"],
    apy: 8.43,
    tvlUsd: 1_800_000,
  },
]
