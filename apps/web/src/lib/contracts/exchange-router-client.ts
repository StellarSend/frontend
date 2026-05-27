import { Contract, TransactionBuilder, rpc } from "@stellar/stellar-sdk"
import { CONTRACTS } from "@/app/config/contracts"
import { NETWORK } from "@/app/config/network"
import { sorobanRpc } from "@/lib/soroban/client"
import {
  createOrderArgs,
  type CreateOrderParams,
} from "@/lib/contracts/generated/exchange-router/src"
import type { Transaction } from "@stellar/stellar-sdk"

/**
 * Build a fee-assembled Soroban transaction calling ExchangeRouter.createOrder.
 */
export async function buildCreateOrderTransaction(
  params: CreateOrderParams,
): Promise<Transaction> {
  const sourceAccount = await sorobanRpc.getAccount(params.account)
  const contract = new Contract(CONTRACTS.exchangeRouter)

  let tx = new TransactionBuilder(sourceAccount, {
    fee: "100",
    networkPassphrase: NETWORK.networkPassphrase,
  })
    .addOperation(contract.call("createOrder", ...createOrderArgs(params)))
    .setTimeout(180)
    .build()

  const simulation = await sorobanRpc.simulateTransaction(tx)
  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Transaction simulation failed: ${simulation.error}`)
  }

  return rpc.assembleTransaction(tx, simulation).build()
}
