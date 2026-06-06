import { FaucetContractClient as FaucetClient } from "@workspace/contracts"
import { TestTokenContractClient as TokenClient } from "@workspace/contracts"
import { CONTRACTS } from "@/app/config/contracts"
import { NETWORK } from "@/app/config/network"

export const FAUCET_CONTRACT_ID = CONTRACTS.faucet

// Used as the source account for read-only simulations when no wallet is connected.
const READ_SOURCE = "GAUHMCMUP5FZO5675W3ISZ6E6CNYJGXBUW5WANE2JR4TGAARYCTSCBKI"

const base = () => ({
  rpcUrl: NETWORK.rpcUrl,
  networkPassphrase: NETWORK.networkPassphrase,
})

export function createFaucetClient(publicKey = READ_SOURCE) {
  return new FaucetClient({ ...base(), contractId: FAUCET_CONTRACT_ID, publicKey })
}

export function createTokenClient(contractId: string, publicKey = READ_SOURCE) {
  return new TokenClient({ ...base(), contractId, publicKey })
}

/** Convert raw i128 (7-decimal fixed-point) to a human-readable number. */
export function fromContractAmount(raw: bigint): number {
  return Number(raw) / 1e7
}
