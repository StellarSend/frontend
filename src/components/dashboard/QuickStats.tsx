import React from 'react'
import { TrendingUp, ArrowUpRight, Activity, Zap } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Spinner'
import { formatAmount } from '@/lib/stellar'
import { useRecentTransactions } from '@/hooks/useTransactions'

export function QuickStats() {
  const { data, isLoading } = useRecentTransactions(50)

  const transactions = data?.transactions ?? []
  const sent = transactions.filter((t) => t.direction === 'sent')
  const received = transactions.filter((t) => t.direction === 'received')

  const totalSent = sent
    .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0)
    .toFixed(4)

  const totalReceived = received
    .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0)
    .toFixed(4)

  const avgFee = transactions.length
    ? (
        transactions.reduce((s, t) => s + parseFloat(t.fee || '0'), 0) /
        transactions.length /
        10_000_000
      ).toFixed(7)
    : '0'

  const stats = [
    {
      label: 'Total Sent',
      value: formatAmount(totalSent, 4),
      unit: 'XLM',
      icon: <ArrowUpRight size={18} />,
      color: 'text-danger-400',
      bg: 'bg-danger-500/10 border-danger-500/20',
    },
    {
      label: 'Total Received',
      value: formatAmount(totalReceived, 4),
      unit: 'XLM',
      icon: <TrendingUp size={18} />,
      color: 'text-success-400',
      bg: 'bg-success-500/10 border-success-500/20',
    },
    {
      label: 'Transactions',
      value: String(transactions.length),
      unit: 'total',
      icon: <Activity size={18} />,
      color: 'text-stellar-400',
      bg: 'bg-stellar-500/10 border-stellar-500/20',
    },
    {
      label: 'Average Fee',
      value: avgFee,
      unit: 'XLM',
      icon: <Zap size={18} />,
      color: 'text-warning-400',
      bg: 'bg-warning-500/10 border-warning-500/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} padding="sm">
          <div className="flex items-start justify-between mb-3">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center ${stat.bg} ${stat.color}`}
            >
              {stat.icon}
            </div>
          </div>
          {isLoading ? (
            <>
              <Skeleton className="h-6 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </>
          ) : (
            <>
              <p className={`text-xl font-bold tabular-nums ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {stat.label} <span className="text-slate-600">({stat.unit})</span>
              </p>
            </>
          )}
        </Card>
      ))}
    </div>
  )
}
