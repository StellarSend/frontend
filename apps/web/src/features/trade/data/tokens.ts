import { CONTRACTS } from "@/app/config/contracts"

export type Token = {
  address: string
  symbol: string
  name: string
  decimals: number
  isStable: boolean
  priceDecimals: number
  logoUrl?: string
}

export const TOKENS: Array<Token> = [
  {
    address: CONTRACTS.tokens.txlm,
    symbol: "TXLM",
    name: "Test Stellar Lumens",
    decimals: 7,
    isStable: false,
    priceDecimals: 4,
  },
  {
    address: CONTRACTS.tokens.twbtc,
    symbol: "TWBTC",
    name: "Test Bitcoin",
    decimals: 7,
    isStable: false,
    priceDecimals: 2,
  },
  {
    address: CONTRACTS.tokens.teth,
    symbol: "TETH",
    name: "Test Ether",
    decimals: 7,
    isStable: false,
    priceDecimals: 2,
  },
  {
    address: CONTRACTS.tokens.tusdc,
    symbol: "TUSDC",
    name: "Test USDC",
    decimals: 7,
    isStable: true,
    priceDecimals: 4,
  },
]

export const STABLE_TOKENS = TOKENS.filter((t) => t.isStable)
export const INDEX_TOKENS = TOKENS.filter((t) => !t.isStable)

export function getToken(address: string): Token | undefined {
  return TOKENS.find((t) => t.address === address || t.symbol === address)
}
