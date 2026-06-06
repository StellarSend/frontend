import {
  ExchangeRouterClient,
  GlvRouterClient,
  OrderVaultClient,
  ReferralStorageClient,
  SacTokenClient,
  StakingRouterClient,
  SyntheticsReaderClient,
  TokenClient,
  VestingRouterClient,
  type ExchangeCreateDepositParams,
  type ExchangeCreateWithdrawalParams,
  type OrderKey,
  type CreateOrderParams,
} from "@workspace/contracts"
import { CONTRACTS } from "@/app/config/contracts"
import { NETWORK } from "@/app/config/network"

export * from "@workspace/contracts"

const networkConfig = {
  rpcUrl: NETWORK.rpcUrl,
  networkPassphrase: NETWORK.networkPassphrase,
}

function requireContract(id: string, label: string): string {
  if (!id) {
    throw new Error(`${label} is not deployed on this network.`)
  }
  return id
}

export const exchangeRouterClient = new ExchangeRouterClient({
  ...networkConfig,
  contractId: CONTRACTS.exchangeRouter,
})

export const syntheticsReaderClient = new SyntheticsReaderClient({
  ...networkConfig,
  contractId: CONTRACTS.syntheticsReader,
  dataStore: CONTRACTS.dataStore,
  oracle: CONTRACTS.oracle,
  orderHandler: CONTRACTS.orderHandler,
})

export const referralStorageClient = new ReferralStorageClient({
  ...networkConfig,
  contractId: CONTRACTS.referralStorage,
})

export const orderVaultClient = new OrderVaultClient(CONTRACTS.orderVault)

export const sacTokenClient = new SacTokenClient(networkConfig)

export function getTokenClient(contractId: string, publicKey?: string): TokenClient {
  return new TokenClient({
    ...networkConfig,
    contractId,
    publicKey,
  })
}

export function getGlvRouterClient(): GlvRouterClient {
  return new GlvRouterClient({
    ...networkConfig,
    contractId: requireContract(CONTRACTS.glvRouter, "GLV router"),
  })
}

export function getStakingRouterClient(): StakingRouterClient {
  return new StakingRouterClient({
    ...networkConfig,
    contractId: requireContract(CONTRACTS.stakingRouter, "Staking router"),
  })
}

export function getVestingRouterClient(): VestingRouterClient {
  return new VestingRouterClient({
    ...networkConfig,
    contractId: requireContract(CONTRACTS.vestingRouter, "Vesting router"),
  })
}

export const stakingRouterClient = {
  getStakerInfo(account: string) {
    return getStakingRouterClient().getStakerInfo(account)
  },
}

export type WebCreateDepositParams = Omit<
  ExchangeCreateDepositParams,
  "initialLongToken" | "initialShortToken"
> &
  Partial<Pick<ExchangeCreateDepositParams, "initialLongToken" | "initialShortToken">>

export type { CreateOrderParams, OrderKey }

type BatchOrderOperation =
  | { type: "createOrder"; params: CreateOrderParams }
  | { type: "cancelOrder"; key: OrderKey }
  | { actionType: "createOrder"; orderParams: CreateOrderParams; cancelKey: null }
  | { actionType: "cancelOrder"; orderParams: null; cancelKey: OrderKey }

export function buildCreateOrderTransaction(
  callerOrParams: string | CreateOrderParams,
  params?: CreateOrderParams,
) {
  const orderParams = typeof callerOrParams === "string" ? params : callerOrParams
  const caller = typeof callerOrParams === "string" ? callerOrParams : callerOrParams.receiver

  if (!orderParams) {
    throw new Error("Missing order params.")
  }

  return exchangeRouterClient.buildCreateOrderTransaction(caller, orderParams)
}

export function buildCancelOrderTransaction(caller: string, orderKey: OrderKey) {
  return exchangeRouterClient.buildCancelOrderTransaction(caller, orderKey)
}

export function buildBatchOrderTransaction(
  caller: string,
  operations: Array<BatchOrderOperation>,
) {
  const normalized = operations.map((op) => {
    if ("type" in op) return op
    if (op.actionType === "createOrder") {
      return { type: "createOrder" as const, params: op.orderParams }
    }
    return { type: "cancelOrder" as const, key: op.cancelKey }
  })

  return exchangeRouterClient.buildBatchOrderTransaction(caller, normalized)
}

export function buildClaimFundingFeesTransaction(
  caller: string,
  markets: Array<string>,
  tokens: Array<string>,
) {
  return exchangeRouterClient.buildClaimFundingFeesTransaction(caller, markets, tokens)
}

export function buildCreateDepositTransaction(params: WebCreateDepositParams) {
  return exchangeRouterClient.buildCreateDepositTransaction({
    ...params,
    initialLongToken: params.initialLongToken ?? params.market,
    initialShortToken: params.initialShortToken ?? params.market,
  })
}

export function buildCreateWithdrawalTransaction(params: ExchangeCreateWithdrawalParams) {
  return exchangeRouterClient.buildCreateWithdrawalTransaction(params)
}

export function buildStakeSO4Transaction(account: string, amount: bigint) {
  return getStakingRouterClient().buildStakeSO4Transaction(account, amount)
}

export function buildUnstakeSO4Transaction(account: string, amount: bigint) {
  return getStakingRouterClient().buildUnstakeSO4Transaction(account, amount)
}

export function buildClaimRewardsTransaction(account: string) {
  return getStakingRouterClient().buildClaimRewardsTransaction(account)
}

export function buildCompoundTransaction(account: string) {
  return getStakingRouterClient().buildCompoundTransaction(account)
}

export function buildDepositForVestingTransaction(account: string, amount: bigint) {
  return getVestingRouterClient().buildDepositForVestingTransaction(account, amount)
}

export function checkAllowance(tokenAddress: string, owner: string, spender: string) {
  return sacTokenClient.checkAllowance(tokenAddress, owner, spender)
}

export function buildApproveTransaction(
  tokenAddress: string,
  owner: string,
  spender: string,
  amount: bigint,
) {
  return sacTokenClient.buildApproveTransaction(tokenAddress, owner, spender, amount)
}

export function getTraderReferralCode(account: string) {
  return referralStorageClient.getTraderReferralCode(account)
}

export function getTraderDiscountBps(account: string) {
  return referralStorageClient.getTraderDiscountBps(account)
}

export function getReferralCodeStats(code: string, period: string) {
  return referralStorageClient.getReferralCodeStats(code, period)
}

export function getTraderRebateInfo(account: string) {
  return referralStorageClient.getTraderRebateInfo(account)
}

export function getAffiliateCode(account: string) {
  return referralStorageClient.getAffiliateCode(account)
}

export function buildSetTraderReferralCodeTransaction(account: string, code: string) {
  return referralStorageClient.buildSetTraderReferralCodeTransaction(account, code)
}

export function buildRegisterCodeTransaction(account: string, code: string) {
  return referralStorageClient.buildRegisterCodeTransaction(account, code)
}

export function buildClaimRebatesTransaction(account: string, epochIds: string[]) {
  return referralStorageClient.buildClaimRebatesTransaction(account, epochIds)
}

export function mapReferralContractError(error: unknown) {
  return referralStorageClient.mapContractError(error)
}

export function mapContractError(error: unknown) {
  return referralStorageClient.mapContractError(error)
}

export const AFFILIATE_CODE_STORAGE_KEY = "so4-affiliate-code"
export const REFERRAL_PROMPT_STORAGE_KEY = "so4-referral-prompt-done"
export const REFERRAL_CODE_STORAGE_KEY = "so4-referral-code"

export function affiliateCodeStorageKey(account: string): string {
  return `${AFFILIATE_CODE_STORAGE_KEY}:${account}`
}

export function saveReferralCode(code: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(REFERRAL_CODE_STORAGE_KEY, code.toUpperCase().trim())
}

export function readStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFERRAL_CODE_STORAGE_KEY)
}

export function referralPromptStorageKey(account: string): string {
  return `${REFERRAL_PROMPT_STORAGE_KEY}:${account}`
}
