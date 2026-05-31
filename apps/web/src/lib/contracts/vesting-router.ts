import { Contract, TransactionBuilder, rpc, Address, nativeToScVal, Account, scValToNative } from "@stellar/stellar-sdk"
import type { Transaction } from "@stellar/stellar-sdk"
import { CONTRACTS } from "@/app/config/contracts"
import { NETWORK } from "@/app/config/network"
import { sorobanRpc } from "@/lib/soroban/client"

export type VestingSchedule = {
  /** Total esSO4 locked into vesting. */
  deposited: bigint
  /** Amount that has linearly vested so far. */
  vested: bigint
  /** Vested amount available to claim now. */
  claimable: bigint
  /** Unix seconds when linear vesting completes (0 when no active schedule). */
  vestingEndTimestamp: number
}

export type VestingRouterBinding = {
  getVestingSchedule: (account: string) => Promise<VestingSchedule>
}

const DUMMY_ACCOUNT = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"

/**
 * Client for the VestingRouter Soroban contract (esSO4 12-month linear vesting).
 */
export class VestingRouterClient implements VestingRouterBinding {
  readonly contractId: string

  constructor(contractId = CONTRACTS.vestingRouter) {
    this.contractId = contractId
  }

  async getVestingSchedule(account: string): Promise<VestingSchedule> {
    const contract = new Contract(this.contractId)
    const dummyAccount = new Account(DUMMY_ACCOUNT, "0")
    const accountVal = new Address(account).toScVal()

    const tx = new TransactionBuilder(dummyAccount, {
      fee: "100",
      networkPassphrase: NETWORK.networkPassphrase,
    })
      .addOperation(contract.call("get_vesting_schedule", accountVal))
      .setTimeout(30)
      .build()

    try {
      const simulation = await sorobanRpc.simulateTransaction(tx)
      if (rpc.Api.isSimulationSuccess(simulation)) {
        const retval = simulation.result?.retval
        if (retval) {
          const native = scValToNative(retval)
          if (native && typeof native === "object") {
            return {
              deposited: BigInt(native.locked ?? native.deposited ?? 0n),
              vested: BigInt(native.unlocked ?? native.vested ?? 0n),
              claimable: BigInt(native.claimable ?? 0n),
              vestingEndTimestamp: Number(native.end ?? native.vestingEndTimestamp ?? 0),
            }
          }
        }
      }
    } catch {
      // fall through to default
    }

    return { deposited: 0n, vested: 0n, claimable: 0n, vestingEndTimestamp: 0 }
  }
}

/**
 * Build a fee-assembled Soroban transaction calling VestingRouter.deposit_for_vesting.
 */
export async function buildDepositForVestingTransaction(
  account: string,
  amount: bigint,
): Promise<Transaction> {
  const sourceAccount = await sorobanRpc.getAccount(account)
  const contract = new Contract(CONTRACTS.vestingRouter)

  const tx = new TransactionBuilder(sourceAccount, {
    fee: "100",
    networkPassphrase: NETWORK.networkPassphrase,
  })
    .addOperation(contract.call("deposit_for_vesting", new Address(account).toScVal(), nativeToScVal(amount, { type: "i128" })))
    .setTimeout(180)
    .build()

  const simulation = await sorobanRpc.simulateTransaction(tx)
  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Transaction simulation failed: ${simulation.error}`)
  }

  return rpc.assembleTransaction(tx, simulation).build()
}
