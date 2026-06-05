import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "../lib/query-keys"
import { MARKETS } from "../data/markets"
import { useWalletStore } from "@/features/wallet/store/wallet-store"
import { SyntheticsReaderClient } from "@/lib/contracts/synthetics-reader"
import type { PositionInfo } from "@/lib/contracts/synthetics-reader"
import { fromSorobanAmount } from "@/shared/lib/bignum"

export type Position = {
  key: string
  account: string
  marketAddress: string
  marketName: string
  indexToken: string
  collateralToken: string
  collateralAmount: number
  sizeUsd: number
  entryPrice: number
  markPrice: number
  liquidationPrice: number
  leverage: number
  pnl: number
  pnlPercent: number
  isLong: boolean
  pnlAfterFees: number
  fundingFeeUsd: number
}

const CHAIN_ID = "stellar-mainnet"
const USD_DECIMALS = 30
const TOKEN_DECIMALS_DEFAULT = 7

async function fetchPositions(account: string): Promise<Array<Position>> {
  const reader = new SyntheticsReaderClient()
  const rawPositions = await reader.getAccountPositions(account)

  return rawPositions
    .filter((p: PositionInfo) => p.position.sizeInUsd > 0n)
    .map((p: PositionInfo): Position => {
      const props = p.position
      const market = MARKETS.find((m) => m.address === props.market)

      // Collateral token decimals — use 7 (XLM/USDC native on Stellar)
      const collateralAmount = fromSorobanAmount(props.collateralAmount, TOKEN_DECIMALS_DEFAULT)
      const sizeUsd          = fromSorobanAmount(props.sizeInUsd,        USD_DECIMALS)

      // entry price derived from size_in_tokens: price = size_usd / size_in_tokens
      const sizeInTokens = fromSorobanAmount(props.sizeInTokens, TOKEN_DECIMALS_DEFAULT)
      const entryPrice   = sizeInTokens > 0 ? sizeUsd / sizeInTokens : 0

      const pnlUsd         = fromSorobanAmount(p.pnlUsd,           USD_DECIMALS)
      const fundingFeeUsd  = fromSorobanAmount(p.fundingFeeUsd,     USD_DECIMALS)
      const liquidationPrice = fromSorobanAmount(p.liquidationPrice, USD_DECIMALS)

      // Leverage = sizeUsd / (collateralAmount as USD equivalent — approximated here)
      // A more precise value requires the collateral price from oracle.
      const leverage = collateralAmount > 0 ? Math.round(sizeUsd / (collateralAmount || 1)) : 0

      const pnlAfterFees = pnlUsd - fundingFeeUsd
      const collateralUsd = sizeUsd / Math.max(leverage, 1)
      const pnlPercent = collateralUsd > 0 ? (pnlAfterFees / collateralUsd) * 100 : 0

      // Mark price isn't returned directly by the Reader — use entry as proxy until
      // useMarkPrice feeds it in.
      const markPrice = entryPrice

      return {
        key: `${props.account}-${props.market}-${props.collateralToken}-${props.isLong}`,
        account: props.account,
        marketAddress: props.market,
        marketName: market?.name ?? props.market,
        indexToken: market?.indexTokenAddress ?? "",
        collateralToken: props.collateralToken,
        collateralAmount,
        sizeUsd,
        entryPrice,
        markPrice,
        liquidationPrice,
        leverage,
        pnl: pnlUsd,
        pnlPercent,
        isLong: props.isLong,
        pnlAfterFees,
        fundingFeeUsd,
      }
    })
}

export function usePositions() {
  const account = useWalletStore((state) => state.address)

  return useQuery<Array<Position>>({
    queryKey: queryKeys.trade.positions(CHAIN_ID, account ?? ""),
    queryFn: () => fetchPositions(account!),
    enabled: !!account,
    staleTime: 10_000,
    refetchInterval: 15_000,
  })
}
