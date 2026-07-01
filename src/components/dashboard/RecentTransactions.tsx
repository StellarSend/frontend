import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Inbox,
  AlertCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { SkeletonRow } from '@/components/ui/Spinner'
import { useRecentTransactions } from '@/hooks/useTransactions'
import { useWallet } from '@/hooks/useWallet'
import { truncateAddress, formatAmount } from '@/lib/stellar'
import { timeAgo } from '@/lib/utils'
import type { Transaction } from '@/types'

export function RecentTransactions() {
  const { network } = useWallet()
  const { data, isLoading, isError, error } = useRecentTransactions(5)

  const transactions = data?.transactions ?? []

  return (
    <Card padding="none">
      <div className="p-5 pb-4 border-b border-navy-700/40">
        <CardHeader className="mb-0">
          <CardTitle>Recent Activity</CardTitle>
          <Link to="/history">
            <Button variant="ghost" size="sm" iconRight={<ChevronRight size={13} />}>
              View All
            </Button>
          </Link>
        </CardHeader>
      </div>

      {isLoading ? (
        <div>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center gap-2 p-5 text-danger-400">
          <AlertCircle size={16} />
          <span className="text-sm">{error?.message || 'Failed to load'}</span>
        </div>
      ) : transactions.length === 0 ? (
        <EmptyTransactions />
      ) : (
        <div>
          {transactions.slice(0, 5).map((tx) => (
            <RecentTxRow key={tx.id || tx.hash} tx={tx} network={network} />
          ))}
        </div>
      )}
    </Card>
  )
}

function RecentTxRow({
  tx,
  network,
}: {
  tx: Transaction
  network: 'testnet' | 'mainnet'
}) {
  const isSent = tx.direction === 'sent'
  const explorerUrl =
    network === 'testnet'
      ? `https://stellar.expert/explorer/testnet/tx/${tx.hash}`
      : `https://stellar.expert/explorer/public/tx/${tx.hash}`

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3.5 border-b border-navy-700/30 last:border-0 hover:bg-white/2 transition-colors group"
    >
      {/* Icon */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
          isSent
            ? 'bg-danger-500/10 border border-danger-500/20 text-danger-400'
            : 'bg-success-500/10 border border-success-500/20 text-success-400'
        }`}
      >
        {isSent ? <ArrowUpRight size={15} /> : <ArrowDownLeft size={15} />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">
            {isSent ? 'Sent' : 'Received'}
          </span>
          <StatusBadge status={tx.status} size="xs" />
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">
          {isSent ? 'To' : 'From'}{' '}
          <span className="font-mono">{truncateAddress(tx.counterparty, 4)}</span>
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
          {isSent ? '-' : '+'}{formatAmount(tx.amount, 2)} {tx.assetCode}
        </p>
        <p className="text-xs text-slate-600 group-hover:text-slate-400 transition-colors">
          view ↗
        </p>
      </div>
    </a>
  )
}

function EmptyTransactions() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-navy-700/50 border border-navy-600/40 flex items-center justify-center">
        <Inbox size={20} className="text-slate-500" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-300">No transactions yet</p>
        <p className="text-xs text-slate-500 mt-0.5">
          Send your first payment to get started
        </p>
      </div>
      <Link to="/send">
        <Button size="sm" icon={<ArrowUpRight size={13} />}>
          Send Money
        </Button>
      </Link>
    </div>
  )
}
