import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  getComposition,
  getEstimatedApy,
  getFundingRatePerHourPct,
  getOpenInterestUsd,
  getPoolTvlUsd,
  rawToDisplay,
  usdRawToDisplay,
} from "../lib/pool-math"
import type { FundingInfo, MarketProps, PoolValueInfo } from "@/lib/contracts"
import type { PoolMarketConfig } from "../data/markets"
import type { usePoolRowData as UsePoolRowDataType } from "./use-pool-row-data"
import { useWalletStore } from "@/features/wallet/store/wallet-store"

// ── Fixtures ─────────────────────────────────────────────────────────────────

const MARKET_TOKEN = "CDLZFC3SYJYDZT7K3VZWPU7JYQRDARVII7CJIU2M676KBN2JRVFFE25H"
const marketConfig: PoolMarketConfig = {
  label: "TWBTC/TUSDC",
  displayName: "BTC/USD",
  marketToken: MARKET_TOKEN,
  indexToken: "CB7T6QRC5B6Y7TQJ5Y6Q7R5C6B7T6QRC5B6Y7TQJ5Y",
  longToken: "CB7T6QRC5B6Y7TQJ5Y6Q7R5C6B7T6QRC5B6Y7TQJ5Y",
  shortToken: "CDLZFC3SYJYDZT7K3VZWPU7JYQRDARVII7CJIU2M676KBN2JRVFFE25H",
  longSymbol: "TWBTC",
  shortSymbol: "TUSDC",
  decimals: 7,
}

const marketProps: MarketProps = {
  marketToken: MARKET_TOKEN,
  indexToken: marketConfig.indexToken,
  longToken: marketConfig.longToken,
  shortToken: marketConfig.shortToken,
}

const poolValueInfo: PoolValueInfo = {
  poolValue: 500_000n * 10n ** 30n,
  longTokenAmount: 10_000_000_000n,
  shortTokenAmount: 500_000_000_000_000_000n,
  longTokenUsd: 250_000n * 10n ** 30n,
  shortTokenUsd: 250_000n * 10n ** 30n,
  longPnl: 0n,
  shortPnl: 0n,
  netPnl: 0n,
  totalBorrowingFees: 0n,
  impactPoolAmount: 0n,
}

const openInterest = { long: 1_000_000n * 10n ** 30n, short: 500_000n * 10n ** 30n }

const fundingInfo: FundingInfo = {
  fundingFactorPerSecond: 1_000_000_000_000_000_000_00n,
  longFundingAmountPerSize: 0n,
  shortFundingAmountPerSize: 0n,
}

const USER_GM_BALANCE = 1_000_000_000n
const TOTAL_SUPPLY = 5_000_000_000n

// ── Mock: @/lib/contracts ────────────────────────────────────────────────────

const mockSyntheticsReader = {
  getMarket: vi.fn(),
  getMarketPoolValueInfo: vi.fn(),
  getOpenInterest: vi.fn(),
  getFundingInfo: vi.fn(),
}

const mockTokenClient = {
  balance: vi.fn(),
  totalSupply: vi.fn(),
}

vi.mock("@/lib/contracts", () => ({
  // ── Re-exported client classes ──────────────────────────────────────────
  ExchangeRouterClient: class {},
  GlvRouterClient: class {},
  OrderVaultClient: class {},
  ReferralStorageClient: class {},
  SacTokenClient: class {},
  StakingRouterClient: class {},
  SyntheticsReaderClient: class {},
  TokenClient: class {},
  VestingRouterClient: class {},
  // ── Instances created by contracts.ts ────────────────────────────────────
  exchangeRouterClient: { buildCreateOrderTransaction: vi.fn(), buildBatchOrderTransaction: vi.fn(), buildCancelOrderTransaction: vi.fn() },
  syntheticsReaderClient: mockSyntheticsReader,
  referralStorageClient: {},
  orderVaultClient: {},
  sacTokenClient: { checkAllowance: vi.fn(), buildApproveTransaction: vi.fn() },
  stakingRouterClient: { getStakerInfo: vi.fn() },
  // ── Contract tx builders ──────────────────────────────────────────────
  buildBatchOrderTransaction: vi.fn(),
  buildCreateOrderTransaction: vi.fn(),
  buildCancelOrderTransaction: vi.fn(),
  buildCreateDepositTransaction: vi.fn(),
  buildCreateWithdrawalTransaction: vi.fn(),
  buildClaimRebatesTransaction: vi.fn(),
  buildRegisterCodeTransaction: vi.fn(),
  buildSetTraderReferralCodeTransaction: vi.fn(),
  buildClaimFundingFeesTransaction: vi.fn(),
  buildStakeSO4Transaction: vi.fn(),
  buildUnstakeSO4Transaction: vi.fn(),
  buildClaimRewardsTransaction: vi.fn(),
  buildCompoundTransaction: vi.fn(),
  buildDepositForVestingTransaction: vi.fn(),
  buildApproveTransaction: vi.fn(),
  // ── Token helpers ──────────────────────────────────────────────────────
  getTokenClient: () => mockTokenClient,
  checkAllowance: vi.fn(),
  // ── Error helpers ─────────────────────────────────────────────────────
  mapContractError: vi.fn(),
  parseSorobanError: vi.fn((e: unknown) => String(e)),
  mapReferralContractError: vi.fn(),
  // ── Referral helpers ──────────────────────────────────────────────────
  referralPromptStorageKey: (a: string) => `referral-prompt:${a}`,
  affiliateCodeStorageKey: (a: string) => `affiliate-code:${a}`,
  getTraderReferralCode: vi.fn(() => ""),
  readStoredReferralCode: vi.fn(() => ""),
  getTraderDiscountBps: vi.fn(),
  getReferralCodeStats: vi.fn(),
  getTraderRebateInfo: vi.fn(),
  getAffiliateCode: vi.fn(),
  saveReferralCode: vi.fn(),
  AFFILIATE_CODE_STORAGE_KEY: "so4-affiliate-code",
  REFERRAL_PROMPT_STORAGE_KEY: "so4-referral-prompt-done",
  REFERRAL_CODE_STORAGE_KEY: "so4-referral-code",
  // ── Misc ──────────────────────────────────────────────────────────────
  getGlvRouterClient: vi.fn(),
  getStakingRouterClient: vi.fn(),
  getVestingRouterClient: vi.fn(),
}))

// ── Helpers ──────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

let usePoolRowData: UsePoolRowDataType

describe("usePoolRowData", () => {
  beforeAll(async () => {
    usePoolRowData = (await import("./use-pool-row-data")).usePoolRowData
  })

  beforeEach(() => {
    vi.clearAllMocks()
    useWalletStore.setState({
      address: null,
      walletId: null,
      status: "disconnected",
      network: "testnet",
      pendingTransactionXdr: null,
    })
  })

  describe("hook data integrity", () => {
    it("returns full data when all Soroban calls succeed", async () => {
      mockSyntheticsReader.getMarket.mockResolvedValue(marketProps)
      mockSyntheticsReader.getMarketPoolValueInfo.mockResolvedValue(poolValueInfo)
      mockSyntheticsReader.getOpenInterest.mockResolvedValue(openInterest)
      mockSyntheticsReader.getFundingInfo.mockResolvedValue(fundingInfo)
      mockTokenClient.balance.mockResolvedValue(USER_GM_BALANCE)
      mockTokenClient.totalSupply.mockResolvedValue(TOTAL_SUPPLY)

      useWalletStore.setState({ address: "GABCDEF123456789", status: "connected" })

      const { result } = renderHook(() => usePoolRowData(marketConfig), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const data = result.current.data!
      expect(data.market).toEqual(marketProps)
      expect(data.poolValue).toEqual(poolValueInfo)
      expect(data.openInterest).toEqual(openInterest)
      expect(data.fundingInfo).toEqual(fundingInfo)
      expect(data.userGmBalance).toBe(USER_GM_BALANCE)
      expect(data.totalSupply).toBe(TOTAL_SUPPLY)
      expect(data.failures).toEqual([])
    })

    it("returns 0n userGmBalance when wallet is disconnected", async () => {
      mockSyntheticsReader.getMarket.mockResolvedValue(marketProps)
      mockSyntheticsReader.getMarketPoolValueInfo.mockResolvedValue(poolValueInfo)
      mockSyntheticsReader.getOpenInterest.mockResolvedValue(openInterest)
      mockSyntheticsReader.getFundingInfo.mockResolvedValue(fundingInfo)
      mockTokenClient.balance.mockResolvedValue(USER_GM_BALANCE)
      mockTokenClient.totalSupply.mockResolvedValue(TOTAL_SUPPLY)

      const { result } = renderHook(() => usePoolRowData(marketConfig), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const data = result.current.data!
      expect(data.userGmBalance).toBe(0n)
      expect(mockTokenClient.balance).not.toHaveBeenCalled()
      expect(data.failures).toEqual([])
    })

    it("reports failures when calls reject with fallback nulls", async () => {
      mockSyntheticsReader.getMarket.mockResolvedValue(marketProps)
      mockSyntheticsReader.getMarketPoolValueInfo.mockRejectedValue(new Error("RPC timeout"))
      mockSyntheticsReader.getOpenInterest.mockRejectedValue(new Error("Not found"))
      mockSyntheticsReader.getFundingInfo.mockResolvedValue(fundingInfo)
      mockTokenClient.totalSupply.mockResolvedValue(TOTAL_SUPPLY)

      const { result } = renderHook(() => usePoolRowData(marketConfig), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const data = result.current.data!
      expect(data.market).toEqual(marketProps)
      expect(data.poolValue).toBeNull()
      expect(data.openInterest).toBeNull()
      expect(data.fundingInfo).toEqual(fundingInfo)
      expect(data.userGmBalance).toBe(0n)
      expect(data.totalSupply).toBe(TOTAL_SUPPLY)
      expect(data.failures).toContain("pool value")
      expect(data.failures).toContain("open interest")
    })
  })

  describe("derived fields from fixtures", () => {
    it("computes TVL (liquidity) as $500k from poolValue fixture", () => {
      const tvl = getPoolTvlUsd(poolValueInfo)
      expect(tvl).toBe(500_000)
    })

    it("computes estimated APY from TVL", () => {
      const tvl = getPoolTvlUsd(poolValueInfo)
      expect(tvl).toBeGreaterThan(0)
      const apy = getEstimatedApy(poolValueInfo)
      expect(apy).not.toBeNull()
      expect(apy!).toBeGreaterThan(0)
      expect(apy!).toBeLessThanOrEqual(18)
    })

    it("returns null APY when pool value is unavailable", () => {
      expect(getEstimatedApy(null)).toBeNull()
      expect(getEstimatedApy(undefined)).toBeNull()
    })

    it("computes open interest USD from long + short", () => {
      const oi = getOpenInterestUsd(openInterest)
      // long = 1_000_000_000_000_000_000_000_000_000_000n at USD_DECIMALS(30) => 1_000_000
      // short = 500_000_000_000_000_000_000_000_000_000n at USD_DECIMALS(30) => 500_000
      expect(oi).toBe(1_500_000)
    })

    it("returns 0 open interest when null", () => {
      expect(getOpenInterestUsd(null)).toBe(0)
      expect(getOpenInterestUsd(undefined)).toBe(0)
    })

    it("computes hourly funding rate as percentage", () => {
      // fundingFactorPerSecond = 1_000_000_000_000_000_000_00n
      // at USD_DECIMALS(30): 1e-10 per second
      // * 3600 seconds = 3.6e-7 => * 100 = 3.6e-5 %
      const rate = getFundingRatePerHourPct(fundingInfo.fundingFactorPerSecond)
      expect(rate).toBeCloseTo(0.000036, 6)
    })

    it("returns 0 funding rate when factor is null", () => {
      expect(getFundingRatePerHourPct(null)).toBe(0)
      expect(getFundingRatePerHourPct(undefined)).toBe(0)
    })

    it("computes pool composition with equal long/short split", () => {
      const comp = getComposition(poolValueInfo)
      expect(comp.longPct).toBeCloseTo(50, 0)
      expect(comp.shortPct).toBeCloseTo(50, 0)
      expect(comp.source).toBe("usd")
    })

    it("falls back to 50/50 split when pool value is null", () => {
      const comp = getComposition(null)
      expect(comp.longPct).toBe(50)
      expect(comp.shortPct).toBe(50)
      expect(comp.source).toBe("empty")
    })

    it("exposes token symbols from market config", () => {
      expect(marketConfig.longSymbol).toBe("TWBTC")
      expect(marketConfig.shortSymbol).toBe("TUSDC")
      expect(marketConfig.label).toBe("TWBTC/TUSDC")
      expect(marketConfig.displayName).toBe("BTC/USD")
    })
  })
})
