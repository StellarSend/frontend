import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Send,
  History,
  Settings,
  Zap,
  Menu,
  X,
  Repeat,
  Layers,
  FileText,
  Lock,
} from 'lucide-react'
import { useState } from 'react'
import { ConnectWallet } from '@/components/wallet/ConnectWallet'
import { WalletInfo } from '@/components/wallet/WalletInfo'
import { DarkModeToggle } from '@/components/common/DarkModeToggle'
import { NetworkBadge } from '@/components/ui/Badge'
import { useWallet } from '@/hooks/useWallet'
import { cn } from '@/lib/utils'

// Kept here only for the mobile/tablet dropdown below `lg` — the Sidebar
// is the single source of navigation at `lg` and up, so this list must
// not also render as a second desktop nav bar (previously duplicated).
const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/send', label: 'Send', icon: Send },
  { to: '/batch', label: 'Batch', icon: Layers },
  { to: '/subscriptions', label: 'Subscriptions', icon: Repeat },
  { to: '/requests', label: 'Requests', icon: FileText },
  { to: '/escrow', label: 'Escrow', icon: Lock },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Navbar() {
  const { isConnected, publicKey, network } = useWallet()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-navy-700/50 bg-navy-900/90 backdrop-blur-md">
      <nav className="max-w-7xl mx-auto flex items-center gap-4 px-4 md:px-6 h-16">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 mr-2 shrink-0"
          onClick={() => setMobileOpen(false)}
        >
          <div className="w-8 h-8 rounded-xl bg-stellar-gradient flex items-center justify-center shadow-stellar">
            <Zap size={17} className="text-white" fill="white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            Stellar<span className="text-stellar-400">Send</span>
          </span>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side: network + theme toggle + address — the Sidebar owns navigation */}
        <div className="hidden lg:flex items-center gap-3">
          <DarkModeToggle />
          {isConnected && <NetworkBadge network={network} />}
          {isConnected && publicKey ? <WalletInfo /> : <ConnectWallet />}
        </div>

        {/* Mobile/tablet menu toggle — covers the gap below the Sidebar's `lg` breakpoint */}
        <button
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile/tablet dropdown — the only place these links render below `lg` */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-navy-700/50 bg-navy-900 px-4 py-4 space-y-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-stellar-500/15 text-stellar-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5',
                )
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
          <div className="pt-3 border-t border-navy-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Theme:</span>
              <DarkModeToggle />
            </div>
            {isConnected && publicKey ? <WalletInfo /> : <ConnectWallet fullWidth />}
          </div>
        </div>
      )}
    </header>
  )
}
