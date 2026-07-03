import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Send,
  History,
  Settings,
  HelpCircle,
  ExternalLink,
  TrendingUp,
  ChevronRight,
  Repeat,
  Layers,
  FileText,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWallet } from '@/hooks/useWallet'
import { NetworkBadge } from '@/components/ui/Badge'
import { truncateAddress, formatXLM } from '@/lib/stellar'

const primaryLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/send', label: 'Send Money', icon: Send },
  { to: '/batch', label: 'Batch Payments', icon: Layers },
  { to: '/subscriptions', label: 'Subscriptions', icon: Repeat },
  { to: '/requests', label: 'Payment Requests', icon: FileText },
  { to: '/escrow', label: 'Escrow', icon: Lock },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const externalLinks = [
  {
    href: 'https://stellar.org',
    label: 'Stellar Network',
    icon: ExternalLink,
  },
  {
    href: 'https://stellar.expert',
    label: 'Explorer',
    icon: TrendingUp,
  },
  {
    href: 'https://www.freighter.app',
    label: 'Freighter Wallet',
    icon: ExternalLink,
  },
]

export function Sidebar() {
  const { isConnected, publicKey, network, xlmBalance } = useWallet()

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 min-h-screen bg-navy-900 border-r border-navy-700/50">
      {/* Primary nav */}
      <nav className="flex-1 p-4 pt-6 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 px-3 mb-2">
          Navigation
        </p>
        {primaryLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-stellar-500/15 text-stellar-400 shadow-inner-glow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={17}
                  className={cn(
                    'shrink-0 transition-colors',
                    isActive ? 'text-stellar-400' : 'text-slate-500 group-hover:text-slate-300',
                  )}
                />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <ChevronRight size={13} className="text-stellar-500 opacity-60" />
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* External links */}
        <div className="pt-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 px-3 mb-2">
            Resources
          </p>
          {externalLinks.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
            >
              <Icon size={15} className="shrink-0" />
              {label}
              <ExternalLink size={11} className="ml-auto opacity-0 group-hover:opacity-50" />
            </a>
          ))}
        </div>
      </nav>

      {/* Wallet summary at bottom */}
      {isConnected && publicKey && (
        <div className="p-4 border-t border-navy-700/50">
          <div className="rounded-xl bg-navy-800/60 border border-navy-600/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Wallet</span>
              <NetworkBadge network={network} />
            </div>
            <p className="text-xs font-mono text-slate-300 truncate">
              {truncateAddress(publicKey, 6)}
            </p>
            {xlmBalance && (
              <p className="text-sm font-semibold text-white">
                {formatXLM(xlmBalance)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Help */}
      <div className="p-4 pt-0">
        <a
          href="https://stellar.org/learn"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
        >
          <HelpCircle size={14} />
          Help & Documentation
        </a>
      </div>
    </aside>
  )
}
