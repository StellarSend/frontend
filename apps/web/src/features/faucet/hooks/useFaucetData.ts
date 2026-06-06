import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/shared/lib/query-keys"
import { FAUCET_TOKENS, type FaucetTokenSymbol } from "../data/tokens"
import {
  createFaucetClient,
  createTokenClient,
  fromContractAmount,
} from "../lib/clients"

export type FaucetData = {
  balances: Record<FaucetTokenSymbol, number>
  claimAmounts: Record<FaucetTokenSymbol, number>
  lastClaimLedgers: Record<FaucetTokenSymbol, number | null>
  cooldownLedgers: number
}

async function fetchFaucetData(address: string | null): Promise<FaucetData> {
  const sourceKey = address ?? undefined
  const faucet = createFaucetClient(sourceKey)

  const [claimTxs, cooldownTx, balanceTxs, lastClaimTxs] = await Promise.all([
    Promise.all(
      FAUCET_TOKENS.map((token) => faucet.claim_amount({ token: token.contractId })),
    ),
    faucet.cooldown_ledgers(),
    address
      ? Promise.all(
          FAUCET_TOKENS.map((token) =>
            createTokenClient(token.contractId, sourceKey).balance({ id: address }),
          ),
        )
      : Promise.resolve([]),
    address
      ? Promise.all(
          FAUCET_TOKENS.map((token) =>
            faucet.last_claim_ledger({ account: address, token: token.contractId }),
          ),
        )
      : Promise.resolve([]),
  ])

  const balances = {} as Record<FaucetTokenSymbol, number>
  const claimAmounts = {} as Record<FaucetTokenSymbol, number>
  const lastClaimLedgers = {} as Record<FaucetTokenSymbol, number | null>

  FAUCET_TOKENS.forEach((token, index) => {
    const balanceTx = balanceTxs[index]
    const lastClaimTx = lastClaimTxs[index]
    balances[token.symbol] = fromContractAmount((balanceTx?.result as bigint | undefined) ?? 0n)
    claimAmounts[token.symbol] = fromContractAmount(claimTxs[index]?.result as bigint)
    lastClaimLedgers[token.symbol] = lastClaimTx ? Number(lastClaimTx.result) : null
  })

  return {
    balances,
    claimAmounts,
    lastClaimLedgers,
    cooldownLedgers: Number(cooldownTx.result),
  }
}

export function useFaucetData(address: string | null) {
  return useQuery<FaucetData>({
    queryKey: queryKeys.faucet.data(address),
    queryFn: () => fetchFaucetData(address),
    staleTime: 20_000,
    refetchInterval: 30_000,
  })
}
