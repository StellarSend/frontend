import { CONTRACTS } from "@/app/config/contracts"

export type FaucetTokenSymbol = "TUSDC" | "TWBTC" | "TETH" | "TXLM"

export type FaucetTokenConfig = {
  symbol: FaucetTokenSymbol
  name: string
  contractId: string
  decimals: 7
}

export const FAUCET_TOKENS: Array<FaucetTokenConfig> = [
  {
    symbol: "TUSDC",
    name: "Test USDC",
    contractId: CONTRACTS.tokens.tusdc,
    decimals: 7,
  },
  {
    symbol: "TWBTC",
    name: "Test Bitcoin",
    contractId: CONTRACTS.tokens.twbtc,
    decimals: 7,
  },
  {
    symbol: "TETH",
    name: "Test Ether",
    contractId: CONTRACTS.tokens.teth,
    decimals: 7,
  },
  {
    symbol: "TXLM",
    name: "Test Stellar Lumens",
    contractId: CONTRACTS.tokens.txlm,
    decimals: 7,
  },
]
