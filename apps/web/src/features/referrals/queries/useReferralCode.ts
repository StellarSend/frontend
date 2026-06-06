import { useQuery } from "@tanstack/react-query"
import { useWalletStore } from "@/features/wallet/store/wallet-store"
import { referralStorageClient } from "@/lib/contracts"
import { readStoredAffiliateCode } from "../lib/referrals"
import { queryKeys } from "@/shared/lib/query-keys"

/**
 * Reads the affiliate code owned by the connected wallet.
 * Checks local registration cache first, then on-chain trader code as fallback.
 */
export function useReferralCode() {
  const address = useWalletStore((state) => state.address)

  return useQuery<string | null>({
    queryKey: queryKeys.referrals.code(address ?? null),
    queryFn: async (): Promise<string | null> => {
      const stored = readStoredAffiliateCode(address as string)
      if (stored) return stored

      const client = referralStorageClient
      const info = await client.getReferralInfo(address as string)
      return info.code
    },
    enabled: !!address,
    staleTime: 60_000,
  })
}
