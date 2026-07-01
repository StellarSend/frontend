import React from 'react'
import { Link } from 'react-router-dom'
import { Send, History, Settings, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { BalanceCard } from '@/components/dashboard/BalanceCard'
import { QuickStats } from '@/components/dashboard/QuickStats'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { ConnectWalletScreen } from '@/components/wallet/ConnectWallet'
import { useWallet } from '@/hooks/useWallet'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useRecentTransactions } from '@/hooks/useTransactions'

// ─── Activity chart ───────────────────────────────────────────────────────────

function ActivityChart() {
  const { data } = useRecentTransactions(50)
  const transactions = data?.transactions ?? []

  // Group by day (last 7 days)
  const days: Record<string, { sent: number; received: number }> = {}
  const now = Date.now()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000)
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    days[key] = { sent: 0, received: 0 }
  }

  transactions.forEach((tx) => {
    const key = new Date(tx.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    if (days[key]) {
      if (tx.direction === 'sent') days[key].sent += parseFloat(tx.amount || '0')
      else days[key].received += parseFloat(tx.amount || '0')
    }
  })

  const chartData = Object.entries(days).map(([date, vals]) => ({
    date,
    sent: parseFloat(vals.sent.toFixed(4)),
    received: parseFloat(vals.received.toFixed(4)),
  }))

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Activity (7 days)</h3>
          <p className="text-xs text-slate-500 mt-0.5">XLM sent and received</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-danger-400 inline-block" />
            <span className="text-slate-400">Sent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-success-400 inline-block" />
            <span className="text-slate-400">Received</span>
          </div>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
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
              cursor={{ stroke: 'rgba(45,106,255,0.3)', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="sent"
              stroke="#f87171"
              strokeWidth={2}
              fill="url(#colorSent)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="received"
              stroke="#34d399"
              strokeWidth={2}
              fill="url(#colorReceived)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

// ─── Quick actions ────────────────────────────────────────────────────────────

function QuickActions() {
  const actions = [
    { label: 'Send Money', to: '/send', icon: <Send size={18} />, color: 'bg-stellar-gradient' },
    { label: 'History', to: '/history', icon: <History size={18} />, color: 'bg-navy-700' },
    { label: 'Settings', to: '/settings', icon: <Settings size={18} />, color: 'bg-navy-700' },
  ]

  return (
    <div className="flex gap-3">
      {actions.map((a) => (
        <Link key={a.to} to={a.to} className="flex-1">
          <button
            className={`w-full flex flex-col items-center gap-2 p-4 rounded-xl border border-navy-600/40 text-white hover:border-stellar-500/30 transition-all ${a.color} hover:brightness-110`}
          >
            {a.icon}
            <span className="text-xs font-medium">{a.label}</span>
          </button>
        </Link>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
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
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Overview of your Stellar account
          </p>
        </div>
        <Link to="/send">
          <Button icon={<Send size={15} />} iconRight={<ArrowRight size={14} />}>
            Send Money
          </Button>
        </Link>
      </div>

      {/* Balance + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <BalanceCard />
        </div>
        <div className="flex flex-col gap-4">
          <QuickActions />
        </div>
      </div>

      {/* Stats */}
      <QuickStats />

      {/* Activity chart + Recent transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ActivityChart />
        </div>
        <div>
          <RecentTransactions />
        </div>
      </div>
    </div>
  )
}
