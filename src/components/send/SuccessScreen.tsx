import React from 'react'
import { CheckCircle2, ExternalLink, Copy, Send, RotateCcw, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { copyToClipboard } from '@/lib/utils'
import { formatAmount } from '@/lib/stellar'
import type { SendPaymentResult, Quote } from '@/types'
import { useState } from 'react'

interface SuccessScreenProps {
  result: SendPaymentResult
  quote: Quote
  network: 'testnet' | 'mainnet'
  onSendAnother: () => void
}

export function SuccessScreen({ result, quote, network, onSendAnother }: SuccessScreenProps) {
  const [copied, setCopied] = useState(false)

  const explorerUrl =
    network === 'testnet'
      ? `https://stellar.expert/explorer/testnet/tx/${result.transactionHash}`
      : `https://stellar.expert/explorer/public/tx/${result.transactionHash}`

  const handleCopy = async () => {
    await copyToClipboard(result.transactionHash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Success hero */}
      <div className="flex flex-col items-center text-center py-8">
        <div className="relative mb-6">
          {/* Outer ring */}
          <div className="w-28 h-28 rounded-full bg-success-500/10 border-2 border-success-500/30 flex items-center justify-center">
            {/* Inner circle */}
            <div className="w-20 h-20 rounded-full bg-success-500/20 border border-success-500/40 flex items-center justify-center">
              <CheckCircle2 size={44} className="text-success-400" />
            </div>
          </div>
          {/* Glow */}
          <div className="absolute inset-0 rounded-full bg-success-500/5 animate-pulse-slow" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Payment Sent!</h2>
        <p className="text-slate-400 max-w-xs">
          Your transaction has been confirmed on the Stellar network.
        </p>
      </div>

      {/* Summary card */}
      <Card>
        <div className="space-y-3">
          <div className="text-center pb-3 border-b border-navy-700/50">
            <p className="text-3xl font-bold text-stellar-400 tabular-nums">
              {formatAmount(quote.sendAmount, 4)}
            </p>
            <p className="text-sm text-slate-400 mt-1">{quote.sourceAsset.code} sent</p>
          </div>

          <SummaryRow label="Recipient received">
            <span className="font-semibold text-success-400 tabular-nums">
              {formatAmount(quote.receiveAmount, 4)} {quote.destinationAsset.code}
            </span>
          </SummaryRow>
          <SummaryRow label="Network fee">
            <span className="text-slate-300">
              {formatAmount(result.fee, 7)} XLM
            </span>
          </SummaryRow>
          <SummaryRow label="Ledger">
            <span className="text-slate-300 font-mono">
              #{result.ledger.toLocaleString()}
            </span>
          </SummaryRow>
          <SummaryRow label="Confirmed at">
            <span className="text-slate-300">
              {new Date(result.createdAt).toLocaleString()}
            </span>
          </SummaryRow>
        </div>
      </Card>

      {/* Transaction hash */}
      <Card padding="sm">
        <p className="text-xs text-slate-400 mb-2 font-medium">Transaction Hash</p>
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-navy-900/60 border border-navy-700/40">
          <span className="text-xs font-mono text-slate-300 flex-1 break-all">
            {result.transactionHash}
          </span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors shrink-0"
            title="Copy hash"
          >
            {copied ? (
              <Check size={13} className="text-success-400" />
            ) : (
              <Copy size={13} />
            )}
          </button>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          fullWidth
          icon={<ExternalLink size={15} />}
          onClick={() => window.open(explorerUrl, '_blank', 'noopener')}
        >
          View on Stellar Explorer
        </Button>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            icon={<RotateCcw size={14} />}
            onClick={onSendAnother}
          >
            Send Another
          </Button>
          <Link to="/history" className="flex-1">
            <Button variant="ghost" fullWidth icon={<Send size={14} />}>
              View History
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-400">{label}</span>
      {children}
    </div>
  )
}
