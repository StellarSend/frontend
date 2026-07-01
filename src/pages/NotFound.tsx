import React from 'react'
import { Link } from 'react-router-dom'
import { Zap, Home, ArrowLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-6 text-center">
      {/* Background decoration */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-stellar-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative space-y-6 max-w-md">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-navy-800 border border-navy-600/50 flex items-center justify-center">
            <Search size={36} className="text-slate-500" />
          </div>
        </div>

        {/* 404 number */}
        <div>
          <p className="text-8xl font-extrabold text-navy-700 select-none mb-2">404</p>
          <h1 className="text-2xl font-bold text-white">Page Not Found</h1>
          <p className="text-slate-400 mt-2 text-sm leading-relaxed">
            The page you're looking for doesn't exist or has been moved. Let's get you back
            on track.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/" className="flex-1">
            <Button variant="primary" fullWidth icon={<Home size={15} />}>
              Go Home
            </Button>
          </Link>
          <Link to="/dashboard" className="flex-1">
            <Button variant="secondary" fullWidth icon={<ArrowLeft size={15} />}>
              Dashboard
            </Button>
          </Link>
        </div>

        {/* Quick links */}
        <div className="border-t border-navy-700/40 pt-5">
          <p className="text-xs text-slate-500 mb-3">Quick links</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { to: '/send', label: 'Send Money' },
              { to: '/history', label: 'History' },
              { to: '/settings', label: 'Settings' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="px-3 py-1.5 rounded-lg text-xs text-stellar-400 border border-stellar-500/20 hover:bg-stellar-500/10 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Branding */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <div className="w-5 h-5 rounded-lg bg-stellar-gradient flex items-center justify-center">
            <Zap size={11} className="text-white" fill="white" />
          </div>
          <span className="text-sm font-semibold text-slate-400">StellarSend</span>
        </div>
      </div>
    </div>
  )
}
