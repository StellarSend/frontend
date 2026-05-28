import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { createIncreaseOrder, createSwapOrder } from "../../lib/stellar"
import { formatUsd } from "../../lib/trade-math"
import type { useTradeState } from "../../hooks/useTradeState"
import { queryKeys } from "../../lib/query-keys"
import { useWalletStore } from "@/features/wallet/store/wallet-store"

type Props = {
  open: boolean
  onClose: () => void
  tradeState: ReturnType<typeof useTradeState>
  sizeUsd: number
  entryPrice: number
  liquidationPrice: number
  totalFeesUsd: number
}

export function ConfirmationDialog({
  open,
  onClose,
  tradeState,
  sizeUsd,
  entryPrice,
  liquidationPrice,
  totalFeesUsd,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()
  const account = useWalletStore((state) => state.address)

  const { tradeFlags, toTokenAddress, collateralAddress, leverage, fromAmount } = tradeState

  async function handleConfirm() {
    setIsSubmitting(true)
    try {
      if (tradeFlags.isSwap) {
        // TODO: Pass real account from wallet context
        await createSwapOrder({
          account: "GDUMMY...STELLAR",
          fromToken: tradeState.fromTokenAddress,
          toToken: toTokenAddress,
          amountIn: Number(fromAmount),
          minAmountOut: 0,          // TODO: compute from price + slippage
          swapPath: [],             // TODO: compute optimal swap path through liquidity pools
        })
      } else {
        await createIncreaseOrder({
          account: account ?? "GDUMMY...STELLAR",
          marketAddress: tradeState.marketAddress,
          collateralToken: collateralAddress,
          collateralAmount: Number(fromAmount),
          sizeDeltaUsd: sizeUsd,
          isLong: tradeFlags.isLong,
          acceptablePrice: entryPrice,    // TODO: apply slippage via applySlippageToPrice()
          orderType: tradeFlags.isMarket ? "MarketIncrease" : "LimitIncrease",
          leverage,
        })
        if (account) {
          await queryClient.invalidateQueries({ queryKey: queryKeys.positions("stellar-mainnet", account) })
        }
      }
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const typeLabel = tradeFlags.isSwap ? "Swap" : tradeFlags.isLong ? "Long" : "Short"

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Confirm {typeLabel} {!tradeFlags.isSwap && toTokenAddress}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          {!tradeFlags.isSwap && (
            <>
              <Row label="Size" value={formatUsd(sizeUsd)} />
              <Row label="Leverage" value={`${leverage}×`} />
              <Row label="Entry price" value={entryPrice > 0 ? formatUsd(entryPrice) : "—"} />
              <Row label="Liq. price" value={liquidationPrice > 0 ? formatUsd(liquidationPrice) : "—"} />
            </>
          )}
          <Row label="Collateral" value={`${fromAmount || "0"} ${collateralAddress}`} />
          <div className="border-t border-border pt-2">
            <Row label="Total fees" value={formatUsd(totalFeesUsd)} bold />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || sizeUsd <= 0}
            className={
              tradeFlags.isLong
                ? "bg-green-600 hover:bg-green-700"
                : tradeFlags.isShort
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
            }
          >
            {isSubmitting ? "Submitting…" : `Confirm ${typeLabel}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-medium" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  )
}
