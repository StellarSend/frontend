import { Buffer } from "buffer"
import { Contract, rpc, xdr } from "@stellar/stellar-sdk"

if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface OrderKey {
  orderType: string
  account: string
  market: string
  index: bigint
}

export interface CreateOrderParams {
  account: string
  market: string
  collateralToken: string
  collateralAmount: bigint
  sizeDelta: bigint
  isLong: boolean
  acceptablePrice: bigint
  triggerPrice: bigint | null
  orderType: string
  executionFee: bigint
  receiveToken: string | null
  priceUpdateData: Array<Uint8Array>
}

export interface SwapOrderParams {
  account: string
  fromToken: string
  toToken: string
  amountIn: bigint
  minAmountOut: bigint
  swapPath: Array<string>
  executionFee: bigint
  priceUpdateData: Array<Uint8Array>
}

export interface BatchOperation {
  actionType: "createOrder" | "cancelOrder"
  orderParams: CreateOrderParams | null
  cancelKey: OrderKey | null
}

// ── Network configs ──────────────────────────────────────────────────────────

export const networks = {
  testnet: {
    contractId: "",
    networkPassphrase: "Test SDF Network ; September 2015",
  },
  mainnet: {
    contractId: "",
    networkPassphrase: "Public Global Stellar Network ; September 2015",
  },
}

// ── ScVal helpers ────────────────────────────────────────────────────────────

function i128(v: bigint): xdr.ScVal {
  return xdr.ScVal.scvI128(
    new xdr.Int128Parts({
      lo: xdr.Uint64.fromString((v & BigInt("0xFFFFFFFFFFFFFFFF")).toString()),
      hi: xdr.Int64.fromString((v >> BigInt(64)).toString()),
    }),
  )
}

function u64(v: bigint): xdr.ScVal {
  return xdr.ScVal.scvU64(xdr.Uint64.fromString(v.toString()))
}

function address(a: string): xdr.ScVal {
  return xdr.ScVal.scvString(a)
}

function symbol(s: string): xdr.ScVal {
  return xdr.ScVal.scvSymbol(s)
}

function opt<T>(val: T | null, fn: (v: T) => xdr.ScVal): xdr.ScVal {
  return val !== null ? xdr.ScVal.scvVec([fn(val)]) : xdr.ScVal.scvVoid()
}

function priceUpdateDataVec(updates: Array<Uint8Array>): xdr.ScVal {
  return xdr.ScVal.scvVec(
    updates.map((chunk) => xdr.ScVal.scvBytes(Buffer.from(chunk))),
  )
}

/** Encode args for ExchangeRouter.createOrder (includes Pyth priceUpdateData). */
export function createOrderArgs(params: CreateOrderParams): Array<xdr.ScVal> {
  return [
    address(params.account),
    address(params.market),
    address(params.collateralToken),
    i128(params.collateralAmount),
    i128(params.sizeDelta),
    xdr.ScVal.scvBool(params.isLong),
    i128(params.acceptablePrice),
    opt(params.triggerPrice, i128),
    symbol(params.orderType),
    i128(params.executionFee),
    opt(params.receiveToken, address),
    priceUpdateDataVec(params.priceUpdateData),
  ]
}

/** Encode args for ExchangeRouter.createSwapOrder (includes Pyth priceUpdateData). */
export function swapOrderArgs(params: SwapOrderParams): Array<xdr.ScVal> {
  return [
    address(params.account),
    address(params.fromToken),
    address(params.toToken),
    i128(params.amountIn),
    i128(params.minAmountOut),
    xdr.ScVal.scvVec(params.swapPath.map(address)),
    i128(params.executionFee),
    priceUpdateDataVec(params.priceUpdateData),
  ]
}

/** Encode args for ExchangeRouter.cancelOrder. */
export function cancelOrderArgs(account: string, orderKey: OrderKey): Array<xdr.ScVal> {
  return [
    symbol(orderKey.orderType),
    address(account),
    address(orderKey.market),
    u64(orderKey.index),
  ]
}

// ── Client ───────────────────────────────────────────────────────────────────

export interface ClientOptions {
  contractId: string
  networkPassphrase: string
  rpcUrl: string
}

export class Client {
  private contract: Contract
  private rpcUrl: string
  private networkPassphrase: string

  constructor(opts: ClientOptions) {
    this.contract = new Contract(opts.contractId)
    this.rpcUrl = opts.rpcUrl
    this.networkPassphrase = opts.networkPassphrase
  }

  private async buildTx(method: string, ...args: xdr.ScVal[]): Promise<string> {
    const server = new rpc.Server(this.rpcUrl)
    const call = this.contract.call(method, ...args)
    const prepared = await server.prepareTransaction(call, "" as any, {
      networkPassphrase: this.networkPassphrase,
    })
    return prepared.toXDR()
  }

  createOrder(params: CreateOrderParams): Promise<string> {
    return this.buildTx("createOrder", ...createOrderArgs(params))
  }

  cancelOrder(orderKey: OrderKey): Promise<string> {
    return this.buildTx(
      "cancelOrder",
      symbol(orderKey.orderType),
      address(orderKey.account),
      address(orderKey.market),
      u64(orderKey.index),
    )
  }

  claimFundingFees(account: string, markets: string[]): Promise<string> {
    return this.buildTx(
      "claimFundingFees",
      address(account),
      xdr.ScVal.scvVec(markets.map(address)),
    )
  }

  sendBatchOrderTxn(operations: BatchOperation[]): Promise<string> {
    return this.buildTx(
      "sendBatchOrderTxn",
      xdr.ScVal.scvVec(
        operations.map((op) =>
          xdr.ScVal.scvMap([
            new xdr.ScMapEntry({ key: symbol("action_type"), val: symbol(op.actionType) }),
            new xdr.ScMapEntry({ key: symbol("order_params"), val: op.orderParams ? xdr.ScVal.scvVec([
              address(op.orderParams.account),
              address(op.orderParams.market),
              address(op.orderParams.collateralToken),
              i128(op.orderParams.collateralAmount),
              i128(op.orderParams.sizeDelta),
              xdr.ScVal.scvBool(op.orderParams.isLong),
              i128(op.orderParams.acceptablePrice),
              opt(op.orderParams.triggerPrice, i128),
              symbol(op.orderParams.orderType),
              i128(op.orderParams.executionFee),
              opt(op.orderParams.receiveToken, address),
            ]) : xdr.ScVal.scvVoid() }),
            new xdr.ScMapEntry({ key: symbol("cancel_key"), val: op.cancelKey ? xdr.ScVal.scvVec([
              symbol(op.cancelKey.orderType),
              address(op.cancelKey.account),
              address(op.cancelKey.market),
              u64(op.cancelKey.index),
            ]) : xdr.ScVal.scvVoid() }),
          ]),
        ),
      ),
    )
  }
}
