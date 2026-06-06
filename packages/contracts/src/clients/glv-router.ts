import { Client } from "../generated/glv-router/src"
import type {
  CreateDepositParams,
  CreateWithdrawalParams,
  GlvInfo,
} from "../generated/glv-router/src"
import type { NetworkConfig } from "../types"

export type { CreateDepositParams, CreateWithdrawalParams, GlvInfo }

type Config = NetworkConfig & { contractId: string }

export class GlvRouterClient {
  private client: Client

  constructor(config: Config) {
    this.client = new Client({
      contractId: config.contractId,
      networkPassphrase: config.networkPassphrase,
      rpcUrl: config.rpcUrl,
    })
  }

  createDeposit(params: CreateDepositParams): Promise<string> {
    return this.client.createDeposit(params)
  }

  createWithdrawal(params: CreateWithdrawalParams): Promise<string> {
    return this.client.createWithdrawal(params)
  }

  getGlvInfo(glvAddress: string): Promise<GlvInfo> {
    return this.client.getGlvInfo(glvAddress)
  }
}
