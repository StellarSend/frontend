import React from 'react'
import { Card } from '@/components/ui/Card'
import { ConnectWalletScreen } from '@/components/wallet/ConnectWallet'
import { TransactionTable } from '@/components/history/TransactionTable'
import { useWallet } from '@/hooks/useWallet'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import { useRecentTransactions } from '@/hooks/useTransactions'
import { Card as CardComp } from '@/components/ui/Card'
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react'
import { formatAmount } from '@/lib/stellar'

// ─── Chart panel ─────────────────────────────────────────────────────────────

function HistoryChart() {
  const { data } = useRecentTransactions(100)
  const transactions = data?.transactions ?? []

  const days: Record<string, { sent: number; received: number; fees: number }> = {}
  const now = Date.now()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000)
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    days[key] = { sent: 0, received: 0, fees: 0 }
  }

  transactions.forEach((tx) => {
    const key = new Date(tx.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    if (days[key]) {
      if (tx.direction === 'sent') days[key].sent += parseFloat(tx.amount || '0')
      else days[key].received += parseFloat(tx.amount || '0')
      days[key].fees += parseFloat(tx.fee || '0') / 10_000_000
    }
  })

  const chartData = Object.entries(days).map(([date, v]) => ({
    date,
    Sent: +v.sent.toFixed(4),
    Received: +v.received.toFixed(4),
    Fees: +v.fees.toFixed(7),
  }))

  return (
    <CardComp className="mb-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Volume (30 days)</h3>
        <p className="text-xs text-slate-500 mt-0.5">XLM sent and received over time</p>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0e1a3a',
                border: '1px solid rgba(45,106,255,0.2)',
                borderRadius: 12,
                color: '#f1f5f9',
                fontSize: 12,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
              iconType="circle"
              iconSize={8}
            />
            <Bar dataKey="Sent" fill="#f87171" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Received" fill="#34d399" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardComp>
  )
}

// ─── Summary stats ────────────────────────────────────────────────────────────

function HistorySummary() {
  const { data } = useRecentTransactions(50)
  const txs = data?.transactions ?? []

  const totalSent = txs.filter((t) => t.direction === 'sent').reduce((s, t) => s + parseFloat(t.amount || '0'), 0)
  const totalReceived = txs.filter((t) => t.direction === 'received').reduce((s, t) => s + parseFloat(t.amount || '0'), 0)
  const totalFees = txs.reduce((s, t) => s + parseFloat(t.fee || '0') / 10_000_000, 0)
  const successRate = txs.length
    ? Math.round((txs.filter((t) => t.status === 'success').length / txs.length) * 100)
    : 100

  const stats = [
    {
      label: 'Total Sent',
      value: formatAmount(totalSent, 4) + ' XLM',
      icon: <TrendingDown size={16} />,
      color: 'text-danger-400',
      bg: 'bg-danger-500/10',
    },
    {
      label: 'Total Received',
      value: formatAmount(totalReceived, 4) + ' XLM',
      icon: <TrendingUp size={16} />,
      color: 'text-success-400',
      bg: 'bg-success-500/10',
    },
    {
      label: 'Total Fees',
      value: formatAmount(totalFees, 7) + ' XLM',
      icon: <DollarSign size={16} />,
      color: 'text-warning-400',
      bg: 'bg-warning-500/10',
    },
    {
      label: 'Success Rate',
      value: successRate + '%',
      icon: <Activity size={16} />,
      color: 'text-stellar-400',
      bg: 'bg-stellar-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      {stats.map((s) => (
        <CardComp key={s.label} padding="sm">
          <div className={`w-8 h-8 rounded-lg ${s.bg} ${s.color} flex items-center justify-center mb-3`}>
            {s.icon}
          </div>
          <p className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
        </CardComp>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function History() {
  const { isConnected } = useWallet()

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <ConnectWalletScreen />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-0 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Transaction History</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          All your Stellar payments and receipts
        </p>
      </div>

      <HistorySummary />
      <HistoryChart />
      <TransactionTable />
    </div>
  )
}
