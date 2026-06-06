/**
 * Centralised TanStack Query key registry.
 *
 * Every `useQuery` / `useInfiniteQuery` call in the app must derive its key
 * from this object. Raw string arrays as query keys are not allowed in feature
 * code — use the appropriate namespace below instead.
 *
 * Key shape conventions
 *  - First segment = namespace (wallet | trade | earn | faucet | pools | referrals)
 *  - Second segment = entity name
 *  - Remaining segments = discriminating arguments (address, chainId, etc.)
 */
export const queryKeys = {
  wallet: {
    balance: (addr: string) => ["wallet", "balance", addr] as const,
  },

  trade: {
    markets:       ()                                               => ["trade", "markets"] as const,
    marketsInfo:   (chainId: string)                               => ["trade", "marketsInfo", chainId] as const,
    positions:     (chainId: string, addr: string)                 => ["trade", "positions", chainId, addr] as const,
    orders:        (chainId: string, addr: string)                 => ["trade", "orders", chainId, addr] as const,
    fundingRate:   (chainId: string)                               => ["trade", "funding", chainId] as const,
    tokenPrices:   (chainId: string)                               => ["trade", "tokenPrices", chainId] as const,
    priceDelta24h: (symbol: string)                                => ["trade", "priceDelta24h", symbol] as const,
    oracleCandles: (symbol: string, period: string)                => ["trade", "oracleCandles", symbol, period] as const,
    feeConfig:     (chainId: string, marketAddress: string)        => ["trade", "feeConfig", chainId, marketAddress] as const,
    tradeHistory:  (chainId: string, addr: string, page: number)   => ["trade", "history", chainId, addr, page] as const,
    tokenBalances: (chainId: string, addr: string)                 => ["trade", "tokenBalances", chainId, addr] as const,
    openInterest:  (marketAddress: string)                         => ["trade", "openInterest", marketAddress] as const,
  },

  earn: {
    stakingInfo:       (addr: string)                       => ["earn", "staking", addr] as const,
    poolData:          (pool: string)                       => ["earn", "pool", pool] as const,
    marketPoolAmounts: (marketAddress: string)              => ["earn", "marketPoolAmounts", marketAddress] as const,
    gmPoolData:        (pool: string, addr: string | null)  => ["earn", "gmPoolData", pool, addr] as const,
    glvVaultData:      (vault: string, addr: string | null) => ["earn", "glvVaultData", vault, addr] as const,
    rewardsAccrued:    (addr: string)                       => ["earn", "rewardsAccrued", addr] as const,
    vestingSchedule:   (addr: string)                       => ["earn", "vestingSchedule", addr] as const,
  },

  faucet: {
    data: (addr: string | null) => ["faucet", "data", addr] as const,
  },

  pools: {
    list: () => ["pools", "list"] as const,
    row: (marketToken: string, addr: string | null) => ["pools", "row", marketToken, addr] as const,
    userBalance: (marketToken: string, addr: string | null) =>
      ["pools", "userBalance", marketToken, addr] as const,
  },

  referrals: {
    code:  (addr: string | null)                        => ["referrals", "code", addr] as const,
    stats: (code: string | null, period?: string)       => ["referrals", "stats", code, period] as const,
    tier:  (addr: string | null)                        => ["referrals", "tier", addr] as const,
  },
}
