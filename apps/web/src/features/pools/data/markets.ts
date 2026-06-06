import { CONTRACTS } from "@/app/config/contracts"

export type PoolMarketConfig = {
  label: "TWBTC/TUSDC" | "TETH/TUSDC" | "TXLM/TUSDC"
  displayName: string
  marketToken: string
  indexToken: string
  longToken: string
  shortToken: string
  longSymbol: "TWBTC" | "TETH" | "TXLM"
  shortSymbol: "TUSDC"
  decimals: 7
}

export const POOL_MARKETS: Array<PoolMarketConfig> = [
  {
    label: "TWBTC/TUSDC",
    displayName: "BTC/USD",
    marketToken: CONTRACTS.marketTokens.twbtcTusdc,
    indexToken: CONTRACTS.tokens.twbtc,
    longToken: CONTRACTS.tokens.twbtc,
    shortToken: CONTRACTS.tokens.tusdc,
    longSymbol: "TWBTC",
    shortSymbol: "TUSDC",
    decimals: 7,
  },
  {
    label: "TETH/TUSDC",
    displayName: "ETH/USD",
    marketToken: CONTRACTS.marketTokens.tethTusdc,
    indexToken: CONTRACTS.tokens.teth,
    longToken: CONTRACTS.tokens.teth,
    shortToken: CONTRACTS.tokens.tusdc,
    longSymbol: "TETH",
    shortSymbol: "TUSDC",
    decimals: 7,
  },
  {
    label: "TXLM/TUSDC",
    displayName: "XLM/USD",
    marketToken: CONTRACTS.marketTokens.txlmTusdc,
    indexToken: CONTRACTS.tokens.txlm,
    longToken: CONTRACTS.tokens.txlm,
    shortToken: CONTRACTS.tokens.tusdc,
    longSymbol: "TXLM",
    shortSymbol: "TUSDC",
    decimals: 7,
  },
]

export function getPoolMarket(marketToken: string): PoolMarketConfig | undefined {
  return POOL_MARKETS.find((market) => market.marketToken === marketToken)
}
