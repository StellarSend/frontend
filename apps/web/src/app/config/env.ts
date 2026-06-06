/**
 * apps/web/src/app/config/env.ts
 *
 * Single source of truth for every VITE_ environment variable.
 * Evaluated at module-load time — a missing required var throws
 * "Missing env var: VITE_X" before any component renders, so
 * mis-configured deployments fail loudly.
 *
 * Usage:
 *   import { ENV } from "@/app/config/env"
 *   console.log(ENV.NETWORK)                   // "testnet" | "mainnet"
 *   console.log(ENV.CONTRACTS.DATA_STORE)      // contract address
 */

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function requireEnv(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

function optionalEnv(value: string | undefined, fallback = ""): string {
  return value ?? fallback
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type Network = "testnet" | "mainnet"

export type EnvContracts = {
  // ── Core trading contracts ─────────────────────────────────────────────────
  EXCHANGE_ROUTER: string
  SYNTHETICS_READER: string
  DATA_STORE: string
  MARKET_FACTORY: string
  DEPOSIT_HANDLER: string
  WITHDRAWAL_HANDLER: string
  ORDER_VAULT: string
  REFERRAL_STORAGE: string
  FAUCET: string
  TOKENS: {
    TUSDC: string
    TWBTC: string
    TETH: string
    TXLM: string
  }
  MARKET_TOKENS: {
    TWBTC_TUSDC: string
    TETH_TUSDC: string
    TXLM_TUSDC: string
  }
  // ── Infrastructure required by Reader views ───────────────────────────────
  ORACLE: string
  ORDER_HANDLER: string
  // ── Optional — not deployed on all networks yet ───────────────────────────
  STAKING_ROUTER: string   // "" when not deployed
  GLV_ROUTER: string       // "" when not deployed
  VESTING_ROUTER: string   // "" when not deployed
}

export type Env = {
  NETWORK: Network
  RPC_URL: string
  HORIZON_URL: string
  ORACLE_URL: string
  PYTH_HERMES_URL: string
  CONTRACTS: EnvContracts
}

// ─────────────────────────────────────────────────────────────────────────────
// ENV — evaluated once at startup
// ─────────────────────────────────────────────────────────────────────────────

export const ENV: Env = {
  NETWORK: requireEnv(import.meta.env.VITE_NETWORK, "VITE_NETWORK") as Network,

  RPC_URL: requireEnv(import.meta.env.VITE_RPC_URL, "VITE_RPC_URL"),

  HORIZON_URL: requireEnv(import.meta.env.VITE_HORIZON_URL, "VITE_HORIZON_URL"),

  ORACLE_URL: optionalEnv(
    import.meta.env.VITE_ORACLE_URL,
    "https://arbitrum-api.gmxinfra.io",
  ),

  PYTH_HERMES_URL: optionalEnv(
    import.meta.env.VITE_PYTH_HERMES_URL,
    "https://hermes.pyth.network",
  ),

  CONTRACTS: {
    EXCHANGE_ROUTER: requireEnv(
      import.meta.env.VITE_CONTRACT_EXCHANGE_ROUTER,
      "VITE_CONTRACT_EXCHANGE_ROUTER",
    ),
    SYNTHETICS_READER: requireEnv(
      import.meta.env.VITE_CONTRACT_SYNTHETICS_READER,
      "VITE_CONTRACT_SYNTHETICS_READER",
    ),
    DATA_STORE: requireEnv(
      import.meta.env.VITE_CONTRACT_DATA_STORE,
      "VITE_CONTRACT_DATA_STORE",
    ),
    MARKET_FACTORY: requireEnv(
      import.meta.env.VITE_CONTRACT_MARKET_FACTORY,
      "VITE_CONTRACT_MARKET_FACTORY",
    ),
    DEPOSIT_HANDLER: requireEnv(
      import.meta.env.VITE_CONTRACT_DEPOSIT_HANDLER,
      "VITE_CONTRACT_DEPOSIT_HANDLER",
    ),
    WITHDRAWAL_HANDLER: requireEnv(
      import.meta.env.VITE_CONTRACT_WITHDRAWAL_HANDLER,
      "VITE_CONTRACT_WITHDRAWAL_HANDLER",
    ),
    ORDER_VAULT: requireEnv(
      import.meta.env.VITE_CONTRACT_ORDER_VAULT,
      "VITE_CONTRACT_ORDER_VAULT",
    ),
    REFERRAL_STORAGE: requireEnv(
      import.meta.env.VITE_CONTRACT_REFERRAL_STORAGE,
      "VITE_CONTRACT_REFERRAL_STORAGE",
    ),
    ORACLE: requireEnv(
      import.meta.env.VITE_CONTRACT_ORACLE,
      "VITE_CONTRACT_ORACLE",
    ),
    ORDER_HANDLER: requireEnv(
      import.meta.env.VITE_CONTRACT_ORDER_HANDLER,
      "VITE_CONTRACT_ORDER_HANDLER",
    ),
    FAUCET: requireEnv(import.meta.env.VITE_FAUCET, "VITE_FAUCET"),
    TOKENS: {
      TUSDC: requireEnv(import.meta.env.VITE_TOKEN_TUSDC, "VITE_TOKEN_TUSDC"),
      TWBTC: requireEnv(import.meta.env.VITE_TOKEN_TWBTC, "VITE_TOKEN_TWBTC"),
      TETH: requireEnv(import.meta.env.VITE_TOKEN_TETH, "VITE_TOKEN_TETH"),
      TXLM: requireEnv(import.meta.env.VITE_TOKEN_TXLM, "VITE_TOKEN_TXLM"),
    },
    MARKET_TOKENS: {
      TWBTC_TUSDC: requireEnv(
        import.meta.env.VITE_MARKET_TOKEN_TWBTC_TUSDC,
        "VITE_MARKET_TOKEN_TWBTC_TUSDC",
      ),
      TETH_TUSDC: requireEnv(
        import.meta.env.VITE_MARKET_TOKEN_TETH_TUSDC,
        "VITE_MARKET_TOKEN_TETH_TUSDC",
      ),
      TXLM_TUSDC: requireEnv(
        import.meta.env.VITE_MARKET_TOKEN_TXLM_TUSDC,
        "VITE_MARKET_TOKEN_TXLM_TUSDC",
      ),
    },
    // Optional — empty string signals "not deployed yet"
    STAKING_ROUTER: optionalEnv(import.meta.env.VITE_CONTRACT_STAKING_ROUTER),
    GLV_ROUTER:     optionalEnv(import.meta.env.VITE_CONTRACT_GLV_ROUTER),
    VESTING_ROUTER: optionalEnv(import.meta.env.VITE_CONTRACT_VESTING_ROUTER),
  },
}
