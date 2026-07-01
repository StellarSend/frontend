import React, { useEffect, useState } from 'react'
import {
  Clock,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatAmount } from '@/lib/stellar'
import type { Quote } from '@/types'

interface QuoteCardProps {
  quote: Quote
  isLoading?: boolean
  onRefresh?: () => void
  onConfirm?: () => void
  onBack?: () => void
  isSending?: boolean
}

export function QuoteCard({
  quote,
  isLoading = false,
  onRefresh,
  onConfirm,
  onBack,
  isSending = false,
}: QuoteCardProps) {
  const [timeLeft, setTimeLeft] = useState(0)
  const [showPath, setShowPath] = useState(false)

  // Countdown to quote expiry
  useEffect(() => {
    const expiry = new Date(quote.expiresAt).getTime()
    const update = () => {
      const diff = Math.max(0, Math.floor((expiry - Date.now()) / 1000))
      setTimeLeft(diff)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [quote.expiresAt])

  const isExpired = timeLeft === 0
  const isExpiring = timeLeft < 10 && timeLeft > 0

  const exchangeRate = parseFloat(quote.exchangeRate)
  const totalFee =
    parseFloat(quote.networkFee) + parseFloat(quote.serviceFee)

  return (
    <Card glow className="space-y-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp size={18} className="text-stellar-400" />
          Exchange Quote
        </CardTitle>

        {/* Expiry timer */}
        <div
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
            isExpired
              ? 'text-danger-400 border-danger-500/30 bg-danger-500/10'
              : isExpiring
                ? 'text-warning-400 border-warning-500/30 bg-warning-500/10 animate-pulse'
                : 'text-slate-400 border-navy-600/40 bg-navy-900/40'
          }`}
        >
          <Clock size={12} />
          {isExpired ? 'Expired' : `${timeLeft}s`}
        </div>
      </CardHeader>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Spinner size="lg" label="Fetching best rate..." />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Amount flow */}
          <div className="rounded-xl bg-navy-900/60 border border-navy-700/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-white tabular-nums">
                  {formatAmount(quote.sendAmount, 4)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  {quote.sourceAsset.code}
                </p>
              </div>

              <div className="flex flex-col items-center gap-1">
                <ArrowRight size={18} className="text-stellar-400" />
                <span className="text-[10px] text-slate-500">rate</span>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-stellar-400 tabular-nums">
                  {formatAmount(quote.receiveAmount, 4)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  {quote.destinationAsset.code}
                </p>
              </div>
            </div>
          </div>

          {/* Rate details */}
          <div className="space-y-2.5">
            <QuoteRow
              label="Exchange Rate"
              value={
                exchangeRate > 0
                  ? `1 ${quote.sourceAsset.code} = ${formatAmount(exchangeRate, 6)} ${quote.destinationAsset.code}`
                  : '—'
              }
            />
            <QuoteRow
              label="Network Fee"
              value={formatAmount(quote.networkFee, 7, 'XLM')}
              sub="≈ $0.001"
            />
            <QuoteRow
              label="Service Fee"
              value={
                parseFloat(quote.serviceFee) === 0
                  ? 'Free'
                  : formatAmount(quote.serviceFee, 4, quote.sourceAsset.code)
              }
              highlight={parseFloat(quote.serviceFee) === 0}
            />
            <QuoteRow
              label="Price Impact"
              value={`${quote.priceImpact}%`}
              warn={parseFloat(quote.priceImpact) > 1}
            />
            <QuoteRow
              label="Estimated Arrival"
              value={
                quote.estimatedSeconds < 10
                  ? '< 10 seconds'
                  : `~${Math.ceil(quote.estimatedSeconds / 60)} minutes`
              }
              icon={<Clock size={12} />}
            />

            {/* Divider */}
            <div className="border-t border-navy-700/40 pt-2.5">
              <QuoteRow
                label="You Pay (total)"
                value={formatAmount(
                  parseFloat(quote.sendAmount) + totalFee,
                  4,
                  quote.sourceAsset.code,
                )}
                bold
              />
              <QuoteRow
                label="They Receive (min)"
                value={formatAmount(
                  parseFloat(quote.receiveAmount) *
                    (1 - parseFloat(quote.slippageTolerance) / 100),
                  4,
                  quote.destinationAsset.code,
                )}
                sub={`with ${quote.slippageTolerance}% slippage`}
                bold
              />
            </div>
          </div>

          {/* Path (collapsible) */}
          {quote.path.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPath(!showPath)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
            >
              <span>
                Route path ({quote.path.length} hop{quote.path.length !== 1 ? 's' : ''})
              </span>
              {showPath ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
          {showPath && quote.path.length > 0 && (
            <div className="flex items-center flex-wrap gap-1.5 px-3 pb-1">
              <span className="text-xs font-mono text-stellar-400">
                {quote.sourceAsset.code}
              </span>
              {quote.path.map((hop, i) => (
                <React.Fragment key={i}>
                  <ArrowRight size={12} className="text-slate-600" />
                  <span className="text-xs font-mono text-slate-400">{hop.assetCode}</span>
                </React.Fragment>
              ))}
              <ArrowRight size={12} className="text-slate-600" />
              <span className="text-xs font-mono text-stellar-400">
                {quote.destinationAsset.code}
              </span>
            </div>
          )}

          {/* Expired warning */}
          {isExpired && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-warning-500/10 border border-warning-500/20">
              <AlertTriangle size={14} className="text-warning-400 shrink-0" />
              <p className="text-xs text-warning-300">
                This quote has expired. Please refresh to get a new rate.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            {onBack && (
              <Button variant="secondary" onClick={onBack} className="flex-1">
                Back
              </Button>
            )}
            {onRefresh && (
              <Button
                variant="outline"
                onClick={onRefresh}
                icon={<RefreshCw size={14} />}
                disabled={isSending}
              >
                Refresh
              </Button>
            )}
            {onConfirm && (
              <Button
                fullWidth
                loading={isSending}
                disabled={isExpired || isSending}
                onClick={onConfirm}
                className="flex-1"
              >
                {isSending ? 'Signing...' : 'Confirm & Sign'}
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

// ─── Quote row ────────────────────────────────────────────────────────────────

function QuoteRow({
  label,
  value,
  sub,
  bold = false,
  highlight = false,
  warn = false,
  icon,
}: {
  label: string
  value: string
  sub?: string
  bold?: boolean
  highlight?: boolean
  warn?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-sm">
      <span className="text-slate-400 shrink-0">{label}</span>
      <div className="text-right">
        <span
          className={`${bold ? 'font-semibold text-white' : 'text-slate-200'} ${highlight ? 'text-success-400' : ''} ${warn ? 'text-warning-400' : ''} flex items-center gap-1 justify-end`}
        >
          {icon}
          {value}
        </span>
        {sub && <span className="text-[11px] text-slate-500">{sub}</span>}
      </div>
    </div>
  )
}
