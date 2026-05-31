import { Contract, TransactionBuilder, rpc, xdr, scValToNative, Address, Account } from "@stellar/stellar-sdk"
import type { Transaction } from "@stellar/stellar-sdk"
import { CONTRACTS } from "@/app/config/contracts"
import { NETWORK } from "@/app/config/network"
import { sorobanRpc } from "@/lib/soroban/client"
import { i128ToScVal } from "./scval"

export type StakerInfo = {
  stakedSO4: bigint
  stakedEsSO4: bigint
  stakedMultiplierPoints: bigint
  pendingEsSO4Rewards: bigint
  pendingWethFees: bigint
  esSO4Balance: bigint
  stakedAmount: bigint
  accruedRewards: bigint
}

export type StakingRouterBinding = {
  stakeSO4: (account: string, amount: bigint) => Promise<xdr.ScVal>
  unstakeSO4: (account: string, amount: bigint) => Promise<xdr.ScVal>
  claimRewards: (account: string) => Promise<xdr.ScVal>
  getStakerInfo: (account: string) => Promise<StakerInfo>
  compound: (account: string) => Promise<xdr.ScVal>
}

export class StakingRouterClient implements StakingRouterBinding {
  readonly contractId: string

  constructor(contractId = CONTRACTS.stakingRouter) {
    this.contractId = contractId
  }

  async stakeSO4(account: string, amount: bigint): Promise<xdr.ScVal> {
    return this.invoke("stakeSO4", [xdr.ScVal.scvString(account), i128ToScVal(amount)])
  }

  async unstakeSO4(account: string, amount: bigint): Promise<xdr.ScVal> {
    return this.invoke("unstakeSO4", [xdr.ScVal.scvString(account), i128ToScVal(amount)])
  }

  async claimRewards(account: string): Promise<xdr.ScVal> {
    return this.invoke("claimRewards", [xdr.ScVal.scvString(account)])
  }

  async getStakerInfo(account: string): Promise<StakerInfo> {
    const contract = new Contract(this.contractId)
    const dummyAccount = new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0")
    const accountVal = new Address(account).toScVal()

    const tx = new TransactionBuilder(dummyAccount, {
      fee: "100",
      networkPassphrase: NETWORK.networkPassphrase,
    })
      .addOperation(contract.call("getStakerInfo", accountVal))
      .setTimeout(30)
      .build()

    try {
      const simulation = await sorobanRpc.simulateTransaction(tx)
      if (rpc.Api.isSimulationSuccess(simulation)) {
        const retval = simulation.result?.retval
        if (retval) {
          const native = scValToNative(retval)
          if (native && typeof native === "object") {
            const n = native as Record<string, unknown>
            return {
              stakedSO4: BigInt(n.stakedSO4?.toString() ?? n.stakedAmount?.toString() ?? 0),
              stakedEsSO4: BigInt(n.stakedEsSO4?.toString() ?? n.esSO4Balance?.toString() ?? 0),
              stakedMultiplierPoints: BigInt(n.stakedMultiplierPoints?.toString() ?? 0),
              pendingEsSO4Rewards: BigInt(n.pendingEsSO4Rewards?.toString() ?? n.accruedRewards?.toString() ?? 0),
              pendingWethFees: BigInt(n.pendingWethFees?.toString() ?? 0),
              esSO4Balance: BigInt(n.esSO4Balance?.toString() ?? 0),
              stakedAmount: BigInt(n.stakedAmount?.toString() ?? 0),
              accruedRewards: BigInt(n.accruedRewards?.toString() ?? 0),
            }
          }
        }
      }
    } catch {
      // fall through to default
    }

    return {
      stakedSO4: 0n,
      stakedEsSO4: 0n,
      stakedMultiplierPoints: 0n,
      pendingEsSO4Rewards: 0n,
      pendingWethFees: 0n,
      stakedAmount: 0n,
      esSO4Balance: 0n,
      accruedRewards: 0n,
    }
  }

  async compound(account: string): Promise<xdr.ScVal> {
    return this.invoke("compound", [xdr.ScVal.scvString(account)])
  }

  private async invoke(_method: string, _args: Array<xdr.ScVal>): Promise<xdr.ScVal> {
    return xdr.ScVal.scvVoid()
  }
}

async function buildStakingTransaction(
  account: string,
  method: "stakeSO4" | "unstakeSO4",
  amount: bigint,
): Promise<Transaction> {
  const sourceAccount = await sorobanRpc.getAccount(account)
  const contract = new Contract(CONTRACTS.stakingRouter)

  const tx = new TransactionBuilder(sourceAccount, {
    fee: "100",
    networkPassphrase: NETWORK.networkPassphrase,
  })
    .addOperation(contract.call(method, xdr.ScVal.scvString(account), i128ToScVal(amount)))
    .setTimeout(180)
    .build()

  const simulation = await sorobanRpc.simulateTransaction(tx)
  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Transaction simulation failed: ${simulation.error}`)
  }

  return rpc.assembleTransaction(tx, simulation).build()
}

async function buildClaimRewardsTx(account: string): Promise<Transaction> {
  const sourceAccount = await sorobanRpc.getAccount(account)
  const contract = new Contract(CONTRACTS.stakingRouter)

  const tx = new TransactionBuilder(sourceAccount, {
    fee: "100",
    networkPassphrase: NETWORK.networkPassphrase,
  })
    .addOperation(contract.call("claimRewards", xdr.ScVal.scvString(account)))
    .setTimeout(180)
    .build()

  const simulation = await sorobanRpc.simulateTransaction(tx)
  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Transaction simulation failed: ${simulation.error}`)
  }

  return rpc.assembleTransaction(tx, simulation).build()
}

/** Build a fee-assembled Soroban transaction calling StakingRouter.stakeSO4. */
export function buildStakeSO4Transaction(account: string, amount: bigint): Promise<Transaction> {
  return buildStakingTransaction(account, "stakeSO4", amount)
}

/** Build a fee-assembled Soroban transaction calling StakingRouter.unstakeSO4. */
export function buildUnstakeSO4Transaction(account: string, amount: bigint): Promise<Transaction> {
  return buildStakingTransaction(account, "unstakeSO4", amount)
}

/** Build a fee-assembled Soroban transaction calling StakingRouter.claimRewards. */
export function buildClaimRewardsTransaction(account: string): Promise<Transaction> {
  return buildClaimRewardsTx(account)
}

async function buildCompoundTx(account: string): Promise<Transaction> {
  const sourceAccount = await sorobanRpc.getAccount(account)
  const contract = new Contract(CONTRACTS.stakingRouter)

  const tx = new TransactionBuilder(sourceAccount, {
    fee: "100",
    networkPassphrase: NETWORK.networkPassphrase,
  })
    .addOperation(contract.call("compound", xdr.ScVal.scvString(account)))
    .setTimeout(180)
    .build()

  const simulation = await sorobanRpc.simulateTransaction(tx)
  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Transaction simulation failed: ${simulation.error}`)
  }

  return rpc.assembleTransaction(tx, simulation).build()
}

/** Build a fee-assembled Soroban transaction calling StakingRouter.compound. */
export function buildCompoundTransaction(account: string): Promise<Transaction> {
  return buildCompoundTx(account)
}
