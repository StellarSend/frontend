// Pure math helpers — no blockchain calls, no side effects
// These are blockchain-agnostic and can be ported straight from GMX's utils/increase.ts etc.

/** Apply slippage to acceptable price */
export function applySlippageToPrice(
  slippageBps: number,
  price: number,
  isIncrease: boolean,
  isLong: boolean,
): number {
  // For longs: acceptable price is higher when buying (increase) or lower when selling (decrease)
  // For shorts: opposite
  const factor = slippageBps / 10_000
  if ((isIncrease && isLong) || (!isIncrease && !isLong)) {
    return price * (1 + factor)
  }
  return price * (1 - factor)
}

/** Collateral USD from size and leverage */
export function collateralFromSizeAndLeverage(sizeUsd: number, leverage: number): number {
  if (leverage <= 0) return 0
  return sizeUsd / leverage
}

/** Position size USD from collateral and leverage */
export function sizeFromCollateralAndLeverage(collateralUsd: number, leverage: number): number {
  return collateralUsd * leverage
}

/** Estimated liquidation price
 *
 * Simplified: liq price is where losses eat all collateral minus fees.
 * TODO: Replicate exact formula from Soroban contract once deployed.
 *   Contract uses: maintenanceMarginRate, fundingFeeDebt, borrowingFeeDebt
 */
export function estimateLiquidationPrice(params: {
  entryPrice: number
  collateralUsd: number
  sizeUsd: number
  isLong: boolean
  maintenanceMarginRateBps?: number  // default 50 = 0.5%
}): number {
  const {
    entryPrice,
    collateralUsd,
    sizeUsd,
    isLong,
    maintenanceMarginRateBps = 50,
  } = params

  if (sizeUsd === 0) return 0

  const maintenanceMargin = (sizeUsd * maintenanceMarginRateBps) / 10_000
  const maxLoss = collateralUsd - maintenanceMargin

  if (isLong) {
    // Liq price = entry - (maxLoss / positionTokens)
    const posTokens = sizeUsd / entryPrice
    return entryPrice - maxLoss / posTokens
  } else {
    // Short: liq price = entry + (maxLoss / positionTokens)
    const posTokens = sizeUsd / entryPrice
    return entryPrice + maxLoss / posTokens
  }
}

/** PnL in USD for an open position */
export function calculatePnl(params: {
  entryPrice: number
  currentPrice: number
  sizeUsd: number
  isLong: boolean
}): number {
  const { entryPrice, currentPrice, sizeUsd, isLong } = params
  if (entryPrice === 0) return 0

  const priceDelta = isLong
    ? currentPrice - entryPrice
    : entryPrice - currentPrice

  return (priceDelta / entryPrice) * sizeUsd
}

/** Borrow fee per hour (simplified)
 * TODO: Pull actual borrowingFactor from Soroban DataStore
 */
export function estimateBorrowFeePerHour(sizeUsd: number, borrowingFactorBps = 1): number {
  return (sizeUsd * borrowingFactorBps) / 10_000 / 24
}

// Re-export from centralised format module for backwards compatibility
export { formatUsd, formatToken as formatTokenAmount } from "@/shared/lib/format"
