import { useQuery } from "@tanstack/react-query"
import type { TierLevel } from "@/lib/contracts"
import { referralStorageClient } from "@/lib/contracts"
import { getTierFromVolume } from "../data/tiers"
import type { TimePeriod } from "../hooks/use-referrals-data"
import { queryKeys } from "@/shared/lib/query-keys"

export type ReferralStats = {
  /** Number of traders who registered under the code. */
  totalTraders: number
  /** Volume traded by referees in the last 24h, in USD. */
  volume24hUsd: number
  /** All-time volume traded by referees, in USD. */
  totalVolumeUsd: number
  /** Total rebates/commissions earned by the affiliate, in USD. */
  totalRebatesUsd: number
  /** Claimable rebate balance for traders (USD). */
  claimableRebateUsd: number
  /** Affiliate tier derived from referred volume. */
  tier: TierLevel
}

/**
 * Aggregate stats for an affiliate `code` (#57): total traders, 24h and
 * all-time referred volume, total rebates earned, and tier. Drives
 * `affiliates-tab.tsx` and trader rebate views in `traders-tab.tsx`.
 */
export function useReferralStats(code: string | null, period: TimePeriod = "total") {
  return useQuery<ReferralStats>({
    queryKey: queryKeys.referrals.stats(code, period),
    queryFn: async (): Promise<ReferralStats> => {
      const client = referralStorageClient
      const onChain = await client.getStatsForCode(code as string, period)

      const tier =
        onChain.totalVolumeUsd > 0
          ? (getTierFromVolume(onChain.totalVolumeUsd).level as TierLevel)
          : onChain.tier

      return {
        totalTraders: onChain.totalTraders,
        volume24hUsd: onChain.volume24hUsd,
        totalVolumeUsd: onChain.totalVolumeUsd,
        totalRebatesUsd: onChain.totalRebatesUsd,
        claimableRebateUsd: onChain.totalRebatesUsd,
        tier,
      }
    },
    enabled: !!code,
    staleTime: 60_000,
  })
}
