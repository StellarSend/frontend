import {
  Account,
  Address,
  Contract,
  TransactionBuilder,
  rpc,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk"
import type { Transaction } from "@stellar/stellar-sdk"
import { CONTRACTS } from "@/app/config/contracts"
import { NETWORK } from "@/app/config/network"
import { sorobanRpc } from "./client"
import { referralCodeToScVal, scValToReferralCode } from "./referral-code"

const DUMMY_ACCOUNT = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"

function isPlaceholderContract(id: string): boolean {
  return id.startsWith("CXXX") || id.length < 10
}

async function simulateRead<T>(
  method: string,
  args: xdr.ScVal[],
  decode: (value: unknown) => T,
  fallback: T,
): Promise<T> {
  if (isPlaceholderContract(CONTRACTS.referralStorage)) {
    return fallback
  }

  const contract = new Contract(CONTRACTS.referralStorage)
  const dummyAccount = new Account(DUMMY_ACCOUNT, "0")

  const tx = new TransactionBuilder(dummyAccount, {
    fee: "100",
    networkPassphrase: NETWORK.networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build()

  try {
    const simulation = await sorobanRpc.simulateTransaction(tx)
    if (!rpc.Api.isSimulationSuccess(simulation)) {
      return fallback
    }

    const retval = simulation.result?.retval
    if (!retval) return fallback

    return decode(scValToNative(retval))
  } catch {
    return fallback
  }
}

async function buildReferralWriteTx(
  method: string,
  account: string,
  args: xdr.ScVal[],
): Promise<Transaction> {
  const sourceAccount = await sorobanRpc.getAccount(account)
  const contract = new Contract(CONTRACTS.referralStorage)
  const accountVal = new Address(account).toScVal()

  let tx = new TransactionBuilder(sourceAccount, {
    fee: "100",
    networkPassphrase: NETWORK.networkPassphrase,
  })
    .addOperation(contract.call(method, accountVal, ...args))
    .setTimeout(180)
    .build()

  const simulation = await sorobanRpc.simulateTransaction(tx)
  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Transaction simulation failed: ${simulation.error}`)
  }

  return rpc.assembleTransaction(tx, simulation).build()
}

export async function buildSetTraderReferralCodeTransaction(
  account: string,
  code: string,
): Promise<Transaction> {
  return buildReferralWriteTx("set_trader_referral_code", account, [referralCodeToScVal(code)])
}

export async function buildRegisterCodeTransaction(
  account: string,
  code: string,
): Promise<Transaction> {
  return buildReferralWriteTx("register_code", account, [referralCodeToScVal(code)])
}

/**
 * Batch-claim accrued trader rebates. Each epoch id is passed as a Soroban Symbol.
 */
export async function buildClaimRebatesTransaction(
  account: string,
  epochIds: string[],
): Promise<Transaction> {
  if (epochIds.length === 0) {
    throw new Error("Select at least one rebate epoch to claim.")
  }

  const sourceAccount = await sorobanRpc.getAccount(account)
  const contract = new Contract(CONTRACTS.referralStorage)
  const accountVal = new Address(account).toScVal()
  const epochsVal = xdr.ScVal.scvVec(epochIds.map((id) => xdr.ScVal.scvSymbol(id)))

  let tx = new TransactionBuilder(sourceAccount, {
    fee: "100",
    networkPassphrase: NETWORK.networkPassphrase,
  })
    .addOperation(contract.call("claim_rebates", accountVal, epochsVal))
    .setTimeout(180)
    .build()

  const simulation = await sorobanRpc.simulateTransaction(tx)
  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Transaction simulation failed: ${simulation.error}`)
  }

  return rpc.assembleTransaction(tx, simulation).build()
}

export async function getTraderReferralCode(account: string): Promise<string | null> {
  const accountVal = new Address(account).toScVal()
  return simulateRead(
    "get_trader_referral_code",
    [accountVal],
    (value) => scValToReferralCode(value),
    null,
  )
}

export async function getTraderDiscountBps(account: string): Promise<number> {
  const accountVal = new Address(account).toScVal()
  return simulateRead(
    "get_trader_discount_bps",
    [accountVal],
    (value) => {
      if (typeof value === "number") return value
      if (typeof value === "bigint") return Number(value)
      if (typeof value === "string") return Number(value)
      return 0
    },
    0,
  )
}

export type ReferralCodeStats = {
  totalTraders: number
  volume24hUsd: number
  totalVolumeUsd: number
  totalRebatesUsd: number
  tier: 1 | 2 | 3
}

export async function getReferralCodeStats(
  code: string,
  _period: string,
): Promise<ReferralCodeStats> {
  const codeVal = referralCodeToScVal(code)
  return simulateRead(
    "get_referral_stats",
    [codeVal],
    (value) => {
      if (!value || typeof value !== "object") {
        return { totalTraders: 0, volume24hUsd: 0, totalVolumeUsd: 0, totalRebatesUsd: 0, tier: 1 }
      }
      const row = value as Record<string, unknown>
      const tierRaw = row.tier ?? row.tier_level ?? 1
      const tier = Math.min(3, Math.max(1, Number(tierRaw))) as 1 | 2 | 3
      return {
        totalTraders: Number(row.total_traders ?? row.totalTraders ?? 0),
        volume24hUsd: Number(row.volume_24h_usd ?? row.volume24hUsd ?? 0),
        totalVolumeUsd: Number(row.total_volume_usd ?? row.totalVolumeUsd ?? 0),
        totalRebatesUsd: Number(row.total_rebates_usd ?? row.totalRebatesUsd ?? 0),
        tier,
      }
    },
    { totalTraders: 0, volume24hUsd: 0, totalVolumeUsd: 0, totalRebatesUsd: 0, tier: 1 },
  )
}

export type TraderRebateInfo = {
  claimableRebateUsd: number
  totalDiscountUsd: number
}

export async function getTraderRebateInfo(account: string): Promise<TraderRebateInfo> {
  const accountVal = new Address(account).toScVal()
  return simulateRead(
    "get_trader_rebate_info",
    [accountVal],
    (value) => {
      if (!value || typeof value !== "object") {
        return { claimableRebateUsd: 0, totalDiscountUsd: 0 }
      }
      const row = value as Record<string, unknown>
      return {
        claimableRebateUsd: Number(row.claimable_rebate_usd ?? row.claimableRebateUsd ?? 0),
        totalDiscountUsd: Number(row.total_discount_usd ?? row.totalDiscountUsd ?? 0),
      }
    },
    { claimableRebateUsd: 0, totalDiscountUsd: 0 },
  )
}

/**
 * Return the referral code registered by an affiliate, or null if they have
 * not registered one. Calls `get_affiliate_code(account)` on the contract.
 */
export async function getAffiliateCode(account: string): Promise<string | null> {
  const accountVal = new Address(account).toScVal()
  return simulateRead(
    "get_affiliate_code",
    [accountVal],
    (value) => scValToReferralCode(value),
    null,
  )
}

export function mapContractError(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error)
  const upper = text.toUpperCase()

  if (upper.includes("CODE_ALREADY_TAKEN") || upper.includes("CODEALREADYTAKEN")) {
    return "Code already taken"
  }
  if (upper.includes("CODE_NOT_FOUND") || upper.includes("CODENOTFOUND")) {
    return "Referral code not found"
  }
  if (upper.includes("INVALID_INPUT")) {
    return "Invalid referral code"
  }

  return text.includes("simulation failed") ? "Transaction simulation failed" : text
}
