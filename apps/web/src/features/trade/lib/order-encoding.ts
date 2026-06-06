import { toSorobanAmount } from "@/shared/lib/bignum"
import { getMarket } from "../data/markets"
import { getToken } from "../data/tokens"
import type { CreateOrderParams } from "@/lib/contracts"
import type { IncreaseOrderParams, DecreaseOrderParams, SwapOrderParams } from "./stellar"

const USD_DECIMALS = 30
const XLM_DECIMALS = 7
const DEFAULT_EXECUTION_FEE_XLM = 0.3

const TOKEN_DECIMALS: Record<string, number> = {
  BTC: 8,
  ETH: 18,
  XLM: 7,
  USDC: 7,
  USDT: 7,
}

/** GMX-style on-chain price: usdPrice × 10^(30 − indexTokenDecimals). */
export function encodeOraclePrice(usdPrice: number, indexToken: string): bigint {
  const tokenDecimals = TOKEN_DECIMALS[indexToken] ?? 18
  const scaleDecimals = Math.max(0, USD_DECIMALS - tokenDecimals)
  return toSorobanAmount(usdPrice, scaleDecimals)
}

export function encodeUsdAmount(usd: number): bigint {
  return toSorobanAmount(usd, USD_DECIMALS)
}

export function encodeTokenAmount(amount: number, tokenSymbol: string): bigint {
  const decimals = getToken(tokenSymbol)?.decimals ?? TOKEN_DECIMALS[tokenSymbol] ?? 7
  return toSorobanAmount(amount, decimals)
}

export function encodeExecutionFeeXlm(xlm = DEFAULT_EXECUTION_FEE_XLM): bigint {
  return toSorobanAmount(xlm, XLM_DECIMALS)
}

/**
 * Map UI increase-order params → ExchangeRouter.create_order contract params.
 * Aligns with the Rust CreateOrderParams struct in gmx_types.
 */
export function toCreateOrderParams(params: IncreaseOrderParams): CreateOrderParams {
  const market = getMarket(params.marketAddress)
  const indexToken = market?.indexTokenAddress ?? params.marketAddress

  const triggerPrice =
    params.orderType === "LimitIncrease" && params.triggerPrice != null
      ? encodeOraclePrice(params.triggerPrice, indexToken)
      : 0n

  return {
    receiver:               params.account,
    market:                 params.marketAddress,
    initialCollateralToken: params.collateralToken,
    swapPath:               [],
    sizeDeltaUsd:           encodeUsdAmount(params.sizeDeltaUsd),
    collateralDeltaAmount:  encodeTokenAmount(params.collateralAmount, params.collateralToken),
    triggerPrice,
    acceptablePrice:        encodeOraclePrice(params.acceptablePrice, indexToken),
    executionFee:           encodeExecutionFeeXlm(),
    minOutputAmount:        0n,
    orderType:              params.orderType,
    isLong:                 params.isLong,
  }
}

/**
 * Map UI decrease-order params → ExchangeRouter.create_order contract params.
 */
export function toDecreaseOrderParams(params: DecreaseOrderParams): CreateOrderParams {
  const market = getMarket(params.marketAddress)
  const indexToken = market?.indexTokenAddress ?? params.marketAddress

  const triggerPrice =
    params.triggerPrice != null ? encodeOraclePrice(params.triggerPrice, indexToken) : 0n

  const orderType = params.orderType === "StopLoss" ? "StopLossDecrease" : params.orderType

  return {
    receiver:               params.account,
    market:                 params.marketAddress,
    initialCollateralToken: params.collateralToken,
    swapPath:               [],
    sizeDeltaUsd:           encodeUsdAmount(params.sizeDeltaUsd),
    collateralDeltaAmount:  encodeTokenAmount(params.collateralDeltaAmount, params.collateralToken),
    triggerPrice,
    acceptablePrice:        encodeOraclePrice(params.acceptablePrice, indexToken),
    executionFee:           encodeExecutionFeeXlm(),
    minOutputAmount:        0n,
    orderType:              orderType as CreateOrderParams["orderType"],
    isLong:                 params.isLong,
  }
}

/**
 * Map UI swap params → ExchangeRouter.create_order with MarketSwap type.
 * The contract does not have a separate createSwapOrder function.
 */
export function toSwapOrderParams(params: SwapOrderParams): CreateOrderParams {
  return {
    receiver:               params.account,
    market:                 params.swapPath[0] ?? params.fromToken,
    initialCollateralToken: params.fromToken,
    swapPath:               params.swapPath,
    sizeDeltaUsd:           0n,
    collateralDeltaAmount:  encodeTokenAmount(params.amountIn, params.fromToken),
    triggerPrice:           0n,
    acceptablePrice:        0n,
    executionFee:           encodeExecutionFeeXlm(),
    minOutputAmount:        encodeTokenAmount(params.minAmountOut, params.toToken),
    orderType:              "MarketSwap",
    isLong:                 false,
  }
}
