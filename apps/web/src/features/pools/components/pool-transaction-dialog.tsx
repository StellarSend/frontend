import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { NumberInput } from "@/shared/components/NumberInput"
import { TokenIcon } from "@/shared/components/TokenIcon"
import { formatSorobanAmount, toSorobanAmount } from "@/shared/lib/bignum"
import { formatToken } from "@/shared/lib/format"
import { getTokenClient } from "@/lib/contracts"
import type { PoolMarketConfig } from "../data/markets"
import { submitPoolDeposit, submitPoolWithdrawal } from "../lib/pool-transactions"

type PoolTransactionMode = "deposit" | "withdraw"

type PoolTransactionDialogProps = {
  open: boolean
  mode: PoolTransactionMode
  market: PoolMarketConfig
  account: string
  userGmBalance: bigint
  onClose: () => void
  onQueued: (tx: { mode: PoolTransactionMode; hash: string; expectedAmount: bigint | null }) => void
}

type TokenBalances = {
  long: bigint
  short: bigint
}

const DECIMALS = 7

export function PoolTransactionDialog({
  open,
  mode,
  market,
  account,
  userGmBalance,
  onClose,
  onQueued,
}: PoolTransactionDialogProps) {
  const [longAmount, setLongAmount] = useState("")
  const [shortAmount, setShortAmount] = useState("")
  const [gmAmount, setGmAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: tokenBalances } = useQuery<TokenBalances>({
    queryKey: ["pools", "depositBalances", market.marketToken, account],
    queryFn: async () => {
      const [long, short] = await Promise.all([
        getTokenClient(market.longToken, account).balance(account),
        getTokenClient(market.shortToken, account).balance(account),
      ])
      return { long, short }
    },
    enabled: open && mode === "deposit" && !!account,
    staleTime: 15_000,
  })

  const longRaw = useMemo(() => parseAmount(longAmount), [longAmount])
  const shortRaw = useMemo(() => parseAmount(shortAmount), [shortAmount])
  const gmRaw = useMemo(() => parseAmount(gmAmount), [gmAmount])
  const hasDepositAmount = (longRaw ?? 0n) > 0n || (shortRaw ?? 0n) > 0n
  const hasWithdrawAmount = (gmRaw ?? 0n) > 0n
  const depositBalanceError =
    mode === "deposit"
      ? (longRaw ?? 0n) > (tokenBalances?.long ?? 0n)
        ? `Insufficient ${market.longSymbol} balance.`
        : (shortRaw ?? 0n) > (tokenBalances?.short ?? 0n)
          ? `Insufficient ${market.shortSymbol} balance.`
          : null
      : null
  const withdrawBalanceError =
    mode === "withdraw" && (gmRaw ?? 0n) > userGmBalance
      ? "Insufficient GM balance."
      : null
  const parseError =
    (mode === "deposit" && (longRaw == null || shortRaw == null)) ||
    (mode === "withdraw" && gmRaw == null)
      ? "Enter amounts with no more than 7 decimal places."
      : null
  const validationError = parseError ?? depositBalanceError ?? withdrawBalanceError
  const canSubmit =
    !validationError &&
    (mode === "deposit" ? hasDepositAmount : hasWithdrawAmount) &&
    !isSubmitting

  async function handleSubmit() {
    if (!canSubmit) return

    setIsSubmitting(true)
    setError(null)

    try {
      const result =
        mode === "deposit"
          ? await submitPoolDeposit({
              account,
              market,
              longTokenAmount: longRaw ?? 0n,
              shortTokenAmount: shortRaw ?? 0n,
              minMarketTokens: 0n,
            })
          : await submitPoolWithdrawal({
              account,
              market,
              marketTokenAmount: gmRaw ?? 0n,
              minLongTokenAmount: 0n,
              minShortTokenAmount: 0n,
            })

      onQueued({ mode, ...result })
      setLongAmount("")
      setShortAmount("")
      setGmAmount("")
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Transaction failed.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = mode === "deposit" ? `Deposit ${market.label}` : `Withdraw ${market.label}`

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "deposit"
              ? "Queue a pool deposit. The keeper executes it after this transaction lands."
              : "Queue a withdrawal. The keeper returns the underlying tokens after this transaction lands."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <TokenIcon symbol={market.longSymbol.replace(/^T/, "")} size={28} />
                <TokenIcon symbol={market.shortSymbol.replace(/^T/, "")} size={28} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{market.label}</p>
                <p className="text-xs text-muted-foreground">{market.displayName}</p>
              </div>
            </div>
          </div>

          {mode === "deposit" ? (
            <div className="space-y-3">
              <TokenAmountField
                label={market.longSymbol}
                value={longAmount}
                balance={tokenBalances?.long ?? 0n}
                onChange={setLongAmount}
                onMax={() => setLongAmount(formatSorobanAmount(tokenBalances?.long ?? 0n, DECIMALS))}
              />
              <TokenAmountField
                label={market.shortSymbol}
                value={shortAmount}
                balance={tokenBalances?.short ?? 0n}
                onChange={setShortAmount}
                onMax={() => setShortAmount(formatSorobanAmount(tokenBalances?.short ?? 0n, DECIMALS))}
              />
            </div>
          ) : (
            <TokenAmountField
              label="GM"
              value={gmAmount}
              balance={userGmBalance}
              onChange={setGmAmount}
              onMax={() => setGmAmount(formatSorobanAmount(userGmBalance, DECIMALS))}
            />
          )}

          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
            After approval and queue creation, keeper execution usually completes within about 60 seconds.
          </div>

          {validationError ? <p className="text-xs text-red-500">{validationError}</p> : null}
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting
              ? "Submitting..."
              : mode === "deposit"
                ? "Queue Deposit"
                : "Queue Withdrawal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TokenAmountField({
  label,
  value,
  balance,
  onChange,
  onMax,
}: {
  label: string
  value: string
  balance: bigint
  onChange: (value: string) => void
  onMax: () => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {formatToken(Number(formatSorobanAmount(balance, DECIMALS, 4)), label, { decimals: 4 })}
        </span>
      </div>
      <NumberInput
        value={value}
        onValueChange={onChange}
        onMax={onMax}
        placeholder="0.0"
        className="font-mono"
      />
    </div>
  )
}

function parseAmount(value: string): bigint | null {
  if (!value.trim()) return 0n

  try {
    const parsed = toSorobanAmount(value, DECIMALS)
    return parsed >= 0n ? parsed : null
  } catch {
    return null
  }
}
