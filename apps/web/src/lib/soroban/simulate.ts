import * as StellarSdk from "@stellar/stellar-sdk"

const rpcUrl = import.meta.env.VITE_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org"
export const rpc = new StellarSdk.rpc.Server(rpcUrl, { allowHttp: true })

/**
 * Wraps rpc.simulateTransaction; throws with diagnostic event string on error.
 */
export async function simulateTx(
  tx: StellarSdk.Transaction | StellarSdk.FeeBumpTransaction
): Promise<StellarSdk.rpc.Api.SimulateTransactionSuccessResponse> {
  const simulation = await rpc.simulateTransaction(tx)

  if (StellarSdk.rpc.Api.isSimulationError(simulation)) {
    // Attempt to extract diagnostic events for better error messages
    const events = simulation.events?.map(e => {
      try {
        return e.event().toXDR('base64')
      } catch {
        return "Unknown Event"
      }
    }).join(', ') || ''
    
    throw new Error(`Simulation failed: ${simulation.error}${events ? ` (Events: ${events})` : ''}`)
  }

  return simulation as StellarSdk.rpc.Api.SimulateTransactionSuccessResponse
}

/**
 * Calls simulateTx, extracts fee breakdown, returns amounts formatted in XLM (7dp).
 */
export async function estimateFee(
  tx: StellarSdk.Transaction | StellarSdk.FeeBumpTransaction
): Promise<{
  inclusionFee: string
  resourceFee: string
  total: string
}> {
  const simulation = await simulateTx(tx)

  // simulation.minResourceFee is in stroops (1 XLM = 10,000,000 stroops)
  const minResourceFeeStroops = BigInt(simulation.minResourceFee)
  
  // Base inclusion fee per operation (100 stroops by default)
  let numOps = 1
  if ('operations' in tx) {
    numOps = tx.operations.length
  } else if ('innerTransaction' in tx) {
    numOps = (tx as StellarSdk.FeeBumpTransaction).innerTransaction.operations.length
  }
  
  const inclusionFeeStroops = BigInt(StellarSdk.BASE_FEE) * BigInt(numOps)
  
  const totalStroops = minResourceFeeStroops + inclusionFeeStroops

  // Format as XLM with 7 decimal places
  const toXLM = (stroops: bigint) => (Number(stroops) / 10_000_000).toFixed(7)

  return {
    inclusionFee: toXLM(inclusionFeeStroops),
    resourceFee: toXLM(minResourceFeeStroops),
    total: toXLM(totalStroops),
  }
}
