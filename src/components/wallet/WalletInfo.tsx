import React, { useState } from 'react'
import {
  Copy,
  ExternalLink,
  LogOut,
  RefreshCw,
  ChevronDown,
  Wallet,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge, NetworkBadge } from '@/components/ui/Badge'
import { useWallet } from '@/hooks/useWallet'
import { truncateAddress, formatXLM, formatAmount } from '@/lib/stellar'
import { copyToClipboard } from '@/lib/utils'

export function WalletInfo() {
  const {
    publicKey,
    network,
    account,
    xlmBalance,
    usdcBalance,
    disconnect,
    refreshAccount,
  } = useWallet()

  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  if (!publicKey) return null

  const handleCopy = async () => {
    await copyToClipboard(publicKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshAccount()
    } finally {
      setRefreshing(false)
    }
  }

  const explorerUrl =
    network === 'testnet'
      ? `https://stellar.expert/explorer/testnet/account/${publicKey}`
      : `https://stellar.expert/explorer/public/account/${publicKey}`

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-navy-700 border border-navy-600/60 hover:border-stellar-500/40 transition-all duration-200 group"
      >
        <div className="w-7 h-7 rounded-lg bg-stellar-gradient flex items-center justify-center shrink-0">
          <Wallet size={14} className="text-white" />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs font-mono text-slate-300 leading-none">
            {truncateAddress(publicKey, 4)}
          </span>
          {xlmBalance && (
            <span className="text-[10px] text-slate-500 leading-none mt-0.5">
              {parseFloat(xlmBalance).toFixed(2)} XLM
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform ml-1 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-72 bg-navy-800 border border-navy-600/50 rounded-2xl shadow-2xl z-40 animate-slide-up overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-navy-700/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-white">Connected Wallet</span>
                <NetworkBadge network={network} />
              </div>

              {/* Address */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-navy-900/60 border border-navy-700/40">
                <span className="text-xs font-mono text-slate-300 flex-1 truncate">
                  {publicKey}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={handleCopy}
                    className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                    title="Copy address"
                  >
                    {copied ? (
                      <Check size={13} className="text-success-400" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                    title="View on explorer"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>

            {/* Balances */}
            <div className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Balances</span>
                <button
                  onClick={handleRefresh}
                  className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-stellar-400 transition-colors"
                  title="Refresh balances"
                >
                  <RefreshCw
                    size={12}
                    className={refreshing ? 'animate-spin' : ''}
                  />
                </button>
              </div>

              <BalanceRow
                label="XLM"
                value={xlmBalance ? formatXLM(xlmBalance) : '—'}
                subLabel="Stellar Lumens"
                color="bg-stellar-gradient"
                abbr="X"
              />

              <BalanceRow
                label="USDC"
                value={usdcBalance ? formatAmount(usdcBalance, 2, 'USDC') : '—'}
                subLabel="USD Coin"
                color="bg-success-gradient"
                abbr="U"
              />

              {account && account.balances.filter(
                (b) => b.asset.code !== 'XLM' && b.asset.code !== 'USDC',
              ).map((b) => (
                <BalanceRow
                  key={`${b.asset.code}-${b.asset.issuer}`}
                  label={b.asset.code}
                  value={formatAmount(b.balance, 2, b.asset.code)}
                  subLabel="Custom asset"
                  color="bg-purple-600"
                  abbr={b.asset.code.slice(0, 1)}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 pt-0 border-t border-navy-700/50">
              <Button
                variant="ghost"
                fullWidth
                size="sm"
                icon={<LogOut size={14} />}
                onClick={() => {
                  disconnect()
                  setIsOpen(false)
                }}
                className="text-danger-400 hover:text-danger-300 hover:bg-danger-500/10 justify-start"
              >
                Disconnect Wallet
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function BalanceRow({
  label,
  value,
  subLabel,
  color,
  abbr,
}: {
  label: string
  value: string
  subLabel: string
  color: string
  abbr: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shrink-0 text-white text-xs font-bold`}
      >
        {abbr}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">{label}</span>
          <span className="text-sm font-semibold text-white tabular-nums">{value}</span>
        </div>
        <span className="text-xs text-slate-500">{subLabel}</span>
      </div>
    </div>
  )
}
