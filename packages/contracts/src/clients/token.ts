import { Client } from "../generated/test-token/src"
import type { NetworkConfig } from "../types"

type Config = NetworkConfig & {
  contractId: string
  publicKey?: string
}

export class TokenClient {
  private client: Client

  constructor(config: Config) {
    this.client = new Client({
      contractId: config.contractId,
      networkPassphrase: config.networkPassphrase,
      rpcUrl: config.rpcUrl,
      publicKey: config.publicKey,
    })
  }

  async balance(account: string): Promise<bigint> {
    const tx = await this.client.balance({ id: account })
    return tx.result as bigint
  }

  async totalSupply(): Promise<bigint> {
    const tx = await this.client.total_supply()
    return tx.result as bigint
  }

  async decimals(): Promise<number> {
    const tx = await this.client.decimals()
    return Number(tx.result)
  }

  async symbol(): Promise<string> {
    const tx = await this.client.symbol()
    return tx.result
  }

  approve(args: {
    from: string
    spender: string
    amount: bigint
    expirationLedger: number
  }) {
    return this.client.approve({
      from: args.from,
      spender: args.spender,
      amount: args.amount,
      expiration_ledger: args.expirationLedger,
    })
  }
}
