import { useQuery } from "@tanstack/react-query"
import { GLV_VAULTS, GM_POOLS } from "../data/pools"
import { useWalletStore } from "@/features/wallet/store/wallet-store"
import { queryKeys } from "@/shared/lib/query-keys"
import { syntheticsReaderClient } from "@/lib/contracts"
import { fromSorobanAmount } from "@/shared/lib/bignum"

const syntheticsReader = syntheticsReaderClient

export type GLVPoolAllocation = {
  poolId: string
  allocationPct: number
}

export type GLVVaultData = {
  apr: number
  tvlUsd: number
  underlyingPoolAllocations: Array<GLVPoolAllocation>
  userGlvBalance: bigint
}

const BALANCE_DECIMALS = 7

function estimateWalletBalance(address: string | null, glvAddress: string): bigint {
  if (!address) return 0n

  const seed = Array.from(`${address}:${glvAddress}`).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  )

  return BigInt(seed % 100) * 10n ** BigInt(BALANCE_DECIMALS)
}

export function useGLVVaultData(glvAddress: string) {
  const { address, status } = useWalletStore()

  return useQuery<GLVVaultData>({
    queryKey: queryKeys.earn.glvVaultData(glvAddress, address ?? null),
    queryFn: async (): Promise<GLVVaultData> => {
      const vault = GLV_VAULTS.find((entry) => entry.id === glvAddress)

      if (!vault) {
        return { apr: 0, tvlUsd: 0, underlyingPoolAllocations: [], userGlvBalance: 0n }
      }

      let totalTvl = 0
      const underlyingPoolAllocations: Array<GLVPoolAllocation> = []

      for (const poolId of vault.underlyingPools) {
        const pool = GM_POOLS.find((entry) => entry.id === poolId)
        if (!pool) continue

        let poolTvl = pool.tvlUsd
        try {
          const amounts = await syntheticsReader.getMarketPoolAmounts(pool.marketAddress)
          const val = fromSorobanAmount(amounts.poolValueUsd, 7)
          if (val > 0) poolTvl = val
        } catch {
          // fall back to static value
        }

        totalTvl += poolTvl
        underlyingPoolAllocations.push({ poolId: pool.id, allocationPct: 0 })
      }

      const allocations = underlyingPoolAllocations.map((a) => ({
        ...a,
        allocationPct: totalTvl > 0 ? (GM_POOLS.find((p) => p.id === a.poolId)?.tvlUsd ?? 0) / totalTvl * 100 : 0,
      }))

      return {
        apr: vault.apy,
        tvlUsd: vault.tvlUsd > 0 ? vault.tvlUsd : totalTvl,
        underlyingPoolAllocations: allocations,
        userGlvBalance: estimateWalletBalance(
          status === "connected" ? address : null,
          vault.id,
        ),
      }
    },
    enabled: !!glvAddress,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}
