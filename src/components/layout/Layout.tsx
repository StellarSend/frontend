import React from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { useWallet } from '@/hooks/useWallet'

export function Layout() {
  const { network } = useWallet()

  return (
    <div className="min-h-screen bg-navy-950 text-white flex flex-col">
      {/* Testnet banner */}
      {network === 'testnet' && (
        <div className="bg-warning-500/15 border-b border-warning-500/20 px-4 py-1.5 text-center">
          <p className="text-xs text-warning-400 font-medium">
            You are on <strong>Testnet</strong> — transactions use test assets only. Switch to
            Mainnet in Settings when ready.
          </p>
        </div>
      )}

      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
