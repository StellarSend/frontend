export type { NetworkConfig } from "./types"
export { parseSorobanError, ORDER_EXECUTION_FROZEN_MESSAGE } from "./errors"
export { i128ToScVal } from "./scval"
export { referralCodeToScVal, scValToReferralCode } from "./soroban/referral-code"

export {
  ExchangeRouterClient,
  type CreateDepositParams as ExchangeCreateDepositParams,
  type CreateWithdrawalParams as ExchangeCreateWithdrawalParams,
  type CreateOrderParams,
  type OrderKey,
} from "./clients/exchange-router"
export {
  SyntheticsReaderClient,
  type FundingInfo,
  type MarketProps,
  type OrderProps,
  type PoolValueInfo,
  type PositionInfo,
} from "./clients/synthetics-reader"
export {
  GlvRouterClient,
  type CreateDepositParams as GlvCreateDepositParams,
  type CreateWithdrawalParams as GlvCreateWithdrawalParams,
  type GlvInfo,
} from "./clients/glv-router"
export {
  StakingRouterClient,
  type StakerInfo,
  type StakingRouterBinding,
} from "./clients/staking-router"
export {
  VestingRouterClient,
  type LegacyVestingSchedule,
  type VestingRouterBinding,
  type VestingSchedule,
} from "./clients/vesting-router"
export {
  ReferralStorageClient,
  type ReferralCodeStats,
  type ReferralInfo,
  type ReferralStorageBinding,
  type TierLevel,
  type TraderRebateInfo,
} from "./clients/referral-storage"
export { OrderVaultClient, type OrderVaultBinding } from "./clients/order-vault"
export { SacTokenClient } from "./clients/sac-token"
export { TokenClient } from "./clients/token"

export * as ExchangeRouterGenerated from "./generated/exchange-router/src"
export * as SyntheticsReaderGenerated from "./generated/synthetics-reader/src"
export * as GlvRouterGenerated from "./generated/glv-router/src"
export * as TestFaucetGenerated from "./generated/test-faucet/src"
export * as TestTokenGenerated from "./generated/test-token/src"

export { Client as FaucetContractClient } from "./generated/test-faucet/src"
export { Client as TestTokenContractClient } from "./generated/test-token/src"
