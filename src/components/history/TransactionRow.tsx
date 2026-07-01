import React from 'react'
import {
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { truncateAddress, formatAmount } from '@/lib/stellar'
import { timeAgo, copyToClipboard } from '@/lib/utils'
import type { Transaction } from '@/types'
import { useState } from 'react'

interface TransactionRowProps {
  tx: Transaction
  network: 'testnet' | 'mainnet'
}

export function TransactionRow({ tx, network }: TransactionRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const isSent = tx.direction === 'sent'

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await copyToClipboard(tx.hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const explorerUrl =
    network === 'testnet'
      ? `https://stellar.expert/explorer/testnet/tx/${tx.hash}`
      : `https://stellar.expert/explorer/public/tx/${tx.hash}`

  return (
    <div className="border-b border-navy-700/30 last:border-0">
      {/* Main row */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/2 transition-colors text-left group"
      >
        {/* Direction icon */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isSent
              ? 'bg-danger-500/10 border border-danger-500/20 text-danger-400'
              : 'bg-success-500/10 border border-success-500/20 text-success-400'
          }`}
        >
          {isSent ? <ArrowUpRight size={17} /> : <ArrowDownLeft size={17} />}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">
              {isSent ? 'Sent' : 'Received'}
            </span>
            <StatusBadge status={tx.status} size="xs" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSent ? 'To' : 'From'}{' '}
            <span className="font-mono text-slate-400">
              {truncateAddress(tx.counterparty, 5)}
            </span>
            {' · '}
            {timeAgo(tx.createdAt)}
          </p>
        </div>

        {/* Amount */}
        <div className="text-right shrink-0">
          <p
            className={`text-sm font-semibold tabular-nums ${
              isSent ? 'text-danger-400' : 'text-success-400'
            }`}
          >
            {isSent ? '-' : '+'}{formatAmount(tx.amount, 4)} {tx.assetCode}
          </p>
          <p className="text-xs text-slate-500">
            Fee: {formatAmount(tx.fee, 7)} XLM
          </p>
        </div>

        {/* Expand toggle */}
        <div className="text-slate-500 group-hover:text-slate-300 transition-colors">
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 bg-navy-900/30">
          <div className="rounded-xl border border-navy-700/40 divide-y divide-navy-700/30 overflow-hidden text-sm">
            <DetailRow label="Hash">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-slate-300 truncate max-w-[180px]">
                  {tx.hash}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-white transition-colors shrink-0"
                >
                  {copied ? (
                    <Check size={12} className="text-success-400" />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              </div>
            </DetailRow>
            <DetailRow label="Ledger">
              <span className="text-slate-300 font-mono">#{tx.ledger.toLocaleString()}</span>
            </DetailRow>
            <DetailRow label="Source">
              <span className="text-slate-300 font-mono text-xs">
                {truncateAddress(tx.sourceAccount, 8)}
              </span>
            </DetailRow>
            <DetailRow label="Destination">
              <span className="text-slate-300 font-mono text-xs">
                {truncateAddress(tx.destinationAccount, 8)}
              </span>
            </DetailRow>
            {tx.memo && (
              <DetailRow label="Memo">
                <span className="text-slate-300">{tx.memo}</span>
              </DetailRow>
            )}
            <DetailRow label="Type">
              <span className="text-slate-400 capitalize">{tx.type.replace('_', ' ')}</span>
            </DetailRow>
            <DetailRow label="Date">
              <span className="text-slate-300">
                {new Date(tx.createdAt).toLocaleString()}
              </span>
            </DetailRow>
          </div>

          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-stellar-400 hover:text-stellar-300 hover:underline transition-colors"
          >
            <ExternalLink size={12} />
            View on Stellar Expert
          </a>
        </div>
      )}
    </div>
  )
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <span className="text-slate-500 shrink-0">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  )
}
