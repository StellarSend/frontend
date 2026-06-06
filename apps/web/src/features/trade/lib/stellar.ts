import { formatUsd } from "@/shared/lib/format"
import { NETWORK } from "@/app/config/network"
import { queryClient } from "@/app/providers/QueryProvider"
import { MARKETS } from "../data/markets"
import {
  buildCreateOrderTransaction,
  buildCancelOrderTransaction,
  buildBatchOrderTransaction,
  buildClaimFundingFeesTransaction,
} from "@/lib/contracts"
import { prepareAndSign } from "@/lib/soroban/tx-builder"
import { parseSorobanError } from "@/lib/contracts"
import { walletKit } from "@/features/wallet/lib/wallet-kit"
import { queryKeys } from "./query-keys"
import { toCreateOrderParams, toDecreaseOrderParams, toSwapOrderParams, encodeOraclePrice, encodeUsdAmount, encodeExecutionFeeXlm } from "./order-encoding"
import type { OrderKey } from "@/lib/contracts"
import { submitTx } from "@/shared/hooks/useTxSubmit"

const CHAIN_ID = "stellar-mainnet"

// ── Parameter types ───────────────────────────────────────────────────────────

export type IncreaseOrderParams = {
  account: string
  marketAddress: string
  collateralToken: string
  collateralAmount: number
  sizeDeltaUsd: number
  isLong: boolean
  acceptablePrice: number
  triggerPrice?: number
  orderType: "MarketIncrease" | "LimitIncrease"
  leverage: number
}

export type DecreaseOrderParams = {
  account: string
  positionKey: string
  marketAddress: string
  collateralToken: string
  collateralDeltaAmount: number
  sizeDeltaUsd: number
  isLong: boolean
  acceptablePrice: number
  triggerPrice?: number
  orderType: "MarketDecrease" | "LimitDecrease" | "StopLoss"
  receiveToken: string
}

export type SwapOrderParams = {
  account: string
  fromToken: string
  toToken: string
  amountIn: number
  minAmountOut: number
  swapPath: Array<string>
}

export type SidecarOrderParams = {
  account: string
  marketAddress: string
  collateralToken: string
  isLong: boolean
  type: "takeProfit" | "stopLoss"
  /** Trigger price in USD. */
  triggerPrice: number
  /** Size of the parent position in USD — sidecar closes sizePct% of this. */
  parentSizeUsd: number
  /** 0–100 — percentage of parent position to close. */
  sizePct: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isValidAccount(account: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(account)
}

async function invalidateTradeQueries(account: string): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.trade.positions(CHAIN_ID, account) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.trade.orders(CHAIN_ID, account) }),
  ])
}

function isDecreaseOrder(
  params: IncreaseOrderParams | DecreaseOrderParams,
): params is DecreaseOrderParams {
  return "positionKey" in params
}

// ── Trade writes ──────────────────────────────────────────────────────────────

export async function createIncreaseOrder(params: IncreaseOrderParams): Promise<string> {
  if (!isValidAccount(params.account)) {
    throw new Error("Connect your wallet before placing an order.")
  }

  return submitTx(
    async () => {
      const tx = await buildCreateOrderTransaction(params.account, toCreateOrderParams(params))
      return prepareAndSign(tx, walletKit, NETWORK.networkPassphrase)
    },
    {
      loadingMessage: `Opening ${params.isLong ? "Long" : "Short"} ${params.marketAddress}...`,
      successMessage: `${params.isLong ? "Long" : "Short"} order submitted! Size: ${formatUsd(params.sizeDeltaUsd)}`,
      successDescription: (hash) => `Tx: ${hash.slice(0, 8)}...`,
      onSuccess: () => void invalidateTradeQueries(params.account),
      onError: parseSorobanError,
    },
  )
}

export async function createDecreaseOrder(params: DecreaseOrderParams): Promise<string> {
  if (!isValidAccount(params.account)) {
    throw new Error("Connect your wallet before placing an order.")
  }

  return submitTx(
    async () => {
      const tx = await buildCreateOrderTransaction(params.account, toDecreaseOrderParams(params))
      return prepareAndSign(tx, walletKit, NETWORK.networkPassphrase)
    },
    {
      loadingMessage: `Closing ${params.isLong ? "Long" : "Short"} ${params.marketAddress}...`,
      successMessage: "Position closed successfully",
      successDescription: (hash) => `Tx: ${hash.slice(0, 8)}...`,
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: queryKeys.trade.positions(CHAIN_ID, params.account),
        }),
      onError: parseSorobanError,
    },
  )
}

export async function createSwapOrder(params: SwapOrderParams): Promise<string> {
  if (!isValidAccount(params.account)) {
    throw new Error("Connect your wallet before placing an order.")
  }

  const knownMarkets = new Set(MARKETS.map((m) => m.address))
  const invalidPools = params.swapPath.filter((a) => !knownMarkets.has(a))
  if (invalidPools.length > 0) {
    throw new Error(`Invalid swap path: unknown pool(s): ${invalidPools.join(", ")}`)
  }

  return submitTx(
    async () => {
      // Swap uses create_order with MarketSwap type — no separate endpoint.
      const tx = await buildCreateOrderTransaction(params.account, toSwapOrderParams(params))
      return prepareAndSign(tx, walletKit, NETWORK.networkPassphrase)
    },
    {
      loadingMessage: `Swapping ${params.fromToken} → ${params.toToken}...`,
      successMessage: "Swap submitted",
      successDescription: (hash) =>
        `${params.amountIn} ${params.fromToken} → ${params.minAmountOut} ${params.toToken} | Tx: ${hash.slice(0, 8)}...`,
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: queryKeys.trade.tokenBalances(CHAIN_ID, params.account),
        }),
      onError: parseSorobanError,
    },
  )
}

export async function cancelOrder(account: string, orderKey: OrderKey): Promise<string> {
  if (!isValidAccount(account)) {
    throw new Error("Connect your wallet before cancelling an order.")
  }

  return submitTx(
    async () => {
      const tx = await buildCancelOrderTransaction(account, orderKey)
      return prepareAndSign(tx, walletKit, NETWORK.networkPassphrase)
    },
    {
      loadingMessage: "Cancelling order...",
      successMessage: "Order cancelled",
      successDescription: (hash) => `Tx: ${hash.slice(0, 8)}...`,
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.trade.orders(CHAIN_ID, account) }),
      onError: parseSorobanError,
    },
  )
}

export async function claimFundingFees(
  account: string,
  marketAddresses: Array<string>,
  /** Collateral token addresses parallel to marketAddresses. */
  tokens: Array<string>,
): Promise<string> {
  if (!isValidAccount(account)) {
    throw new Error("Connect your wallet before claiming funding fees.")
  }

  return submitTx(
    async () => {
      const tx = await buildClaimFundingFeesTransaction(account, marketAddresses, tokens)
      return prepareAndSign(tx, walletKit, NETWORK.networkPassphrase)
    },
    {
      loadingMessage: `Claiming funding fees for ${marketAddresses.length} market(s)...`,
      successMessage: "Funding fees claimed",
      successDescription: (hash) =>
        `${marketAddresses.length} market(s) | Tx: ${hash.slice(0, 8)}...`,
      onSuccess: () => void invalidateTradeQueries(account),
      onError: parseSorobanError,
    },
  )
}

export async function sendBatchOrderTxn(
  account: string,
  params: {
    createOrders?: Array<IncreaseOrderParams | DecreaseOrderParams>
    cancelOrderKeys?: Array<OrderKey>
  },
): Promise<string> {
  if (!isValidAccount(account)) {
    throw new Error("Connect your wallet before submitting a batch order.")
  }

  const opCount =
    (params.createOrders?.length ?? 0) + (params.cancelOrderKeys?.length ?? 0)
  if (opCount === 0) throw new Error("Batch must contain at least one operation.")

  return submitTx(
    async () => {
      const operations: Parameters<typeof buildBatchOrderTransaction>[1] = [
        ...(params.createOrders ?? []).map((p) => ({
          type: "createOrder" as const,
          params: isDecreaseOrder(p) ? toDecreaseOrderParams(p) : toCreateOrderParams(p),
        })),
        ...(params.cancelOrderKeys ?? []).map((key) => ({
          type: "cancelOrder" as const,
          key,
        })),
      ]

      const tx = await buildBatchOrderTransaction(account, operations)
      return prepareAndSign(tx, walletKit, NETWORK.networkPassphrase)
    },
    {
      loadingMessage: `Submitting batch (${opCount} operations)...`,
      successMessage: "Batch order submitted",
      successDescription: (hash) => `${opCount} operations | Tx: ${hash.slice(0, 8)}...`,
      onSuccess: () => void invalidateTradeQueries(account),
      onError: parseSorobanError,
    },
  )
}

/**
 * Create a TP/SL sidecar order as a real decrease order with a trigger price.
 *
 * takeProfit → LimitDecrease  (executes when price moves favourably)
 * stopLoss   → StopLossDecrease (executes to cap downside)
 *
 * sizePct% of parentSizeUsd is closed. For full close pass sizePct=100.
 */
export async function createSidecarOrder(params: SidecarOrderParams): Promise<string> {
  if (!isValidAccount(params.account)) {
    throw new Error("Connect your wallet before placing a TP/SL order.")
  }

  const market = MARKETS.find((m) => m.address === params.marketAddress)
  const indexToken = market?.indexTokenAddress ?? params.marketAddress

  const sizeDeltaUsd = params.parentSizeUsd * (params.sizePct / 100)
  const orderType = params.type === "takeProfit" ? "LimitDecrease" : "StopLossDecrease"
  const triggerPrice = encodeOraclePrice(params.triggerPrice, indexToken)

  // Slippage: ±0.5% around trigger for the acceptable price
  const slippage = 0.005
  const acceptablePrice = encodeOraclePrice(
    params.isLong
      ? params.triggerPrice * (1 - slippage)   // long TP/SL — acceptable is below trigger
      : params.triggerPrice * (1 + slippage),  // short TP/SL — acceptable is above trigger
    indexToken,
  )

  return submitTx(
    async () => {
      const contractParams = {
        receiver:               params.account,
        market:                 params.marketAddress,
        initialCollateralToken: params.collateralToken,
        swapPath:               [] as string[],
        sizeDeltaUsd:           encodeUsdAmount(sizeDeltaUsd),
        collateralDeltaAmount:  0n,
        triggerPrice,
        acceptablePrice,
        executionFee:           encodeExecutionFeeXlm(),
        minOutputAmount:        0n,
        orderType:              orderType as "LimitDecrease" | "StopLossDecrease",
        isLong:                 params.isLong,
      }
      const tx = await buildCreateOrderTransaction(params.account, contractParams)
      return prepareAndSign(tx, walletKit, NETWORK.networkPassphrase)
    },
    {
      loadingMessage: `Setting ${params.type === "takeProfit" ? "Take Profit" : "Stop Loss"}...`,
      successMessage: `${params.type === "takeProfit" ? "Take Profit" : "Stop Loss"} order set`,
      successDescription: (hash) => `Trigger: $${params.triggerPrice.toLocaleString()} | Tx: ${hash.slice(0, 8)}...`,
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.trade.orders(CHAIN_ID, params.account) }),
      onError: parseSorobanError,
    },
  )
}
