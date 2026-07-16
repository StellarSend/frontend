import React, { useState } from 'react'
import { Eye, EyeOff, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Spinner'
import { NetworkBadge } from '@/components/ui/Badge'
import { useWallet } from '@/hooks/useWallet'
import { formatXLM, formatAmount } from '@/lib/stellar'

export function BalanceCard() {
  const { account, xlmBalance, usdcBalance, network, refreshAccount } = useWallet()
  const [hidden, setHidden] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshAccount()
    } finally {
      setRefreshing(false)
    }
  }

  const mask = (_val: string) => '••••••'

  return (
    <Card glow className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-stellar-600/5 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-4 w-32 h-32 rounded-full bg-indigo-600/5 blur-2xl pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-400">Total Balance</span>
            <NetworkBadge network={network} />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setHidden(!hidden)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              aria-label={hidden ? 'Show balances' : 'Hide balances'}
            >
              {hidden ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
            <button
              onClick={handleRefresh}
              className="p-1.5 rounded-lg text-slate-400 hover:text-stellar-400 hover:bg-white/5 transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* XLM balance (primary) */}
        <div className="mb-5">
          {xlmBalance == null ? (
            <Skeleton className="h-9 w-48 mb-1" />
          ) : (
            <p className="text-4xl font-bold text-white tracking-tight tabular-nums">
              {hidden ? mask(xlmBalance) : formatXLM(xlmBalance)}
            </p>
          )}
          <p className="text-xs text-slate-500 mt-1">Stellar Lumens</p>
        </div>

        {/* Other balances */}
        <div className="grid grid-cols-2 gap-3">
          <BalancePill
            label="USDC"
            value={usdcBalance}
            format={(v) => (hidden ? '••••' : formatAmount(v, 2) + ' USDC')}
          />
          {account?.balances
            .filter((b) => b.asset.code !== 'XLM' && b.asset.code !== 'USDC')
            .slice(0, 2)
            .map((b) => (
              <BalancePill
                key={`${b.asset.code}-${b.asset.issuer}`}
                label={b.asset.code}
                value={b.balance}
                format={(v) => (hidden ? '••••' : formatAmount(v, 2) + ' ' + b.asset.code)}
              />
            ))}
        </div>

        {/* Account stats */}
        {account && (
          <div className="mt-4 pt-4 border-t border-navy-700/40 grid grid-cols-2 gap-3 text-sm">
            <Stat
              label="Subentries"
              value={String(account.subentryCount)}
              icon={<TrendingUp size={13} />}
            />
            <Stat
              label="Sequence"
              value={account.sequence.slice(-6)}
              icon={<TrendingDown size={13} />}
            />
          </div>
        )}
      </div>
    </Card>
  )
}

function BalancePill({
  label,
  value,
  format,
}: {
  label: string
  value: string | null
  format: (v: string) => string
}) {
  return (
    <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-navy-900/50 border border-navy-700/30">
      <span className="text-xs text-slate-500">{label}</span>
      {value == null ? (
        <Skeleton className="h-4 w-20" />
      ) : (
        <span className="text-sm font-semibold text-white tabular-nums">{format(value)}</span>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 text-slate-400">
      <span className="text-stellar-500">{icon}</span>
      <span className="text-xs">{label}:</span>
      <span className="text-xs font-mono text-slate-300">{value}</span>
    </div>
  )
}
