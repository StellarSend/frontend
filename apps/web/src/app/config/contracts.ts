/**
 * apps/web/src/app/config/contracts.ts
 *
 * All Soroban contract addresses in one place, keyed by role.
 * Values are read from ENV (which in turn reads VITE_ env vars).
 *
 * Rule: feature code MUST import addresses from CONTRACTS, never
 * directly from ENV or import.meta.env.
 *
 * Optional contracts (stakingRouter, glvRouter, vestingRouter) will be
 * an empty string when not yet deployed.  Code that uses them must guard:
 *   if (!CONTRACTS.stakingRouter) throw new Error("Staking not deployed")
 */

import { ENV } from "./env"

export type ContractAddresses = {
  // ── Core trading contracts ─────────────────────────────────────────────────
  exchangeRouter: string
  syntheticsReader: string
  dataStore: string
  marketFactory: string
  depositHandler: string
  withdrawalHandler: string
  orderVault: string
  referralStorage: string
  faucet: string
  tokens: {
    tusdc: string
    twbtc: string
    teth: string
    txlm: string
  }
  marketTokens: {
    twbtcTusdc: string
    tethTusdc: string
    txlmTusdc: string
  }
  // ── Infrastructure contracts used by Reader view functions ────────────────
  oracle: string
  orderHandler: string
  // ── Optional — empty string when not deployed ─────────────────────────────
  stakingRouter: string
  glvRouter: string
  vestingRouter: string
}

export const CONTRACTS: ContractAddresses = {
  exchangeRouter:   ENV.CONTRACTS.EXCHANGE_ROUTER,
  syntheticsReader: ENV.CONTRACTS.SYNTHETICS_READER,
  dataStore:        ENV.CONTRACTS.DATA_STORE,
  marketFactory:    ENV.CONTRACTS.MARKET_FACTORY,
  depositHandler:   ENV.CONTRACTS.DEPOSIT_HANDLER,
  withdrawalHandler: ENV.CONTRACTS.WITHDRAWAL_HANDLER,
  orderVault:       ENV.CONTRACTS.ORDER_VAULT,
  referralStorage:  ENV.CONTRACTS.REFERRAL_STORAGE,
  faucet:           ENV.CONTRACTS.FAUCET,
  tokens: {
    tusdc: ENV.CONTRACTS.TOKENS.TUSDC,
    twbtc: ENV.CONTRACTS.TOKENS.TWBTC,
    teth:  ENV.CONTRACTS.TOKENS.TETH,
    txlm:  ENV.CONTRACTS.TOKENS.TXLM,
  },
  marketTokens: {
    twbtcTusdc: ENV.CONTRACTS.MARKET_TOKENS.TWBTC_TUSDC,
    tethTusdc:  ENV.CONTRACTS.MARKET_TOKENS.TETH_TUSDC,
    txlmTusdc:  ENV.CONTRACTS.MARKET_TOKENS.TXLM_TUSDC,
  },
  oracle:           ENV.CONTRACTS.ORACLE,
  orderHandler:     ENV.CONTRACTS.ORDER_HANDLER,
  stakingRouter:    ENV.CONTRACTS.STAKING_ROUTER,
  glvRouter:        ENV.CONTRACTS.GLV_ROUTER,
  vestingRouter:    ENV.CONTRACTS.VESTING_ROUTER,
}
