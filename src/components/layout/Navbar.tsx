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
} from 'lucide-react'
import { useState } from 'react'
import { ConnectWallet } from '@/components/wallet/ConnectWallet'
import { WalletInfo } from '@/components/wallet/WalletInfo'
import { NetworkBadge } from '@/components/ui/Badge'
import { useWallet } from '@/hooks/useWallet'
import { cn } from '@/lib/utils'

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/send', label: 'Send', icon: Send },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Navbar() {
  const { isConnected, network } = useWallet()
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

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1 ml-2">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-stellar-500/15 text-stellar-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5',
                )
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {isConnected && <NetworkBadge network={network} />}
          {isConnected ? <WalletInfo /> : <ConnectWallet />}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-navy-700/50 bg-navy-900 px-4 py-4 space-y-1">
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
          <div className="pt-3 border-t border-navy-700/50">
            {isConnected ? <WalletInfo /> : <ConnectWallet fullWidth />}
          </div>
        </div>
      )}
    </header>
  )
}
