import { describe, expect, it } from "vitest"

import {
  getFundingRatePerHourPct,
  getOpenInterestUsd,
  getPoolTvlUsd,
  rawToDisplay,
  usdRawToDisplay,
} from "./pool-math"

const USD_SCALE = 10n ** 30n
const TOKEN_SCALE = 10n ** 7n

describe("pool math scale conversions", () => {
  it("converts 30-decimal USD values in bigint space", () => {
    expect(usdRawToDisplay(60_000n * USD_SCALE)).toBe(60_000)
    expect(
      getPoolTvlUsd({
        poolValue: 1_234_567n * USD_SCALE,
        longTokenAmount: 0n,
        shortTokenAmount: 0n,
        longTokenUsd: 0n,
        shortTokenUsd: 0n,
        longPnl: 0n,
        shortPnl: 0n,
        netPnl: 0n,
        totalBorrowingFees: 0n,
        impactPoolAmount: 0n,
      }),
    ).toBe(1_234_567)
  })

  it("keeps 7-decimal token values on token precision", () => {
    expect(rawToDisplay(42n * TOKEN_SCALE)).toBe(42)
    expect(rawToDisplay(123_456_789n)).toBe(12.3456789)
  })

  it("converts missing and zero values to zero", () => {
    expect(rawToDisplay(undefined)).toBe(0)
    expect(usdRawToDisplay(null)).toBe(0)
    expect(getOpenInterestUsd(null)).toBe(0)
  })

  it("preserves negative USD values intentionally", () => {
    expect(usdRawToDisplay(-1_725n * USD_SCALE)).toBe(-1_725)
  })

  it("converts open interest and funding from 30-decimal USD precision", () => {
    expect(
      getOpenInterestUsd({
        long: 20_000n * USD_SCALE,
        short: 15_000n * USD_SCALE,
      }),
    ).toBe(35_000)

    const oneBasisPointPerHour = USD_SCALE / 10_000n / 3600n
    expect(getFundingRatePerHourPct(oneBasisPointPerHour)).toBeCloseTo(0.01)
  })
})
