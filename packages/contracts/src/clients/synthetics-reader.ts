import { Client } from "../generated/synthetics-reader/src"
import type {
  MarketProps,
  PoolValueInfo,
  FundingInfo,
  PositionInfo,
  OrderProps,
} from "../generated/synthetics-reader/src"
import type { NetworkConfig } from "../types"

export type { MarketProps, PoolValueInfo, FundingInfo, PositionInfo, OrderProps }

type Config = NetworkConfig & {
  contractId: string
  dataStore: string
  oracle: string
  orderHandler: string
}

export class SyntheticsReaderClient {
  private client: Client
  private dataStore: string
  private oracle: string
  private orderHandler: string

  constructor(config: Config) {
    this.client = new Client({
      contractId: config.contractId,
      networkPassphrase: config.networkPassphrase,
      rpcUrl: config.rpcUrl,
    })
    this.dataStore = config.dataStore
    this.oracle = config.oracle
    this.orderHandler = config.orderHandler
  }

  getMarket(marketToken: string): Promise<MarketProps> {
    return this.client.getMarket(this.dataStore, marketToken)
  }

  async getMarketInfo(marketToken: string): Promise<{ isDisabled: boolean }> {
    try {
      await this.client.getMarket(this.dataStore, marketToken)
      return { isDisabled: false }
    } catch {
      return { isDisabled: false }
    }
  }

  getMarketPoolValueInfo(marketToken: string, maximize = false): Promise<PoolValueInfo> {
    return this.client.getMarketPoolValueInfo(this.dataStore, this.oracle, marketToken, maximize)
  }

  async getMarketPoolAmounts(
    marketToken: string,
    maximize = false,
  ): Promise<PoolValueInfo & { poolValueUsd: bigint }> {
    const value = await this.getMarketPoolValueInfo(marketToken, maximize)
    return { ...value, poolValueUsd: value.poolValue }
  }

  getOpenInterest(marketToken: string): Promise<{ long: bigint; short: bigint }> {
    return this.client.getOpenInterest(this.dataStore, marketToken)
  }

  getFundingInfo(marketToken: string): Promise<FundingInfo> {
    return this.client.getFundingInfo(this.dataStore, marketToken)
  }

  getAccountPositions(account: string, page = 1, pageSize = 20): Promise<Array<PositionInfo>> {
    return this.client.getAccountPositions(
      this.dataStore,
      this.oracle,
      this.orderHandler,
      account,
      page,
      pageSize,
    )
  }

  getAccountOrders(account: string, page = 1, pageSize = 50): Promise<Array<OrderProps>> {
    return this.client.getAccountOrders(this.dataStore, this.orderHandler, account, page, pageSize)
  }
}
