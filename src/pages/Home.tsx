import React from 'react'
import { Link } from 'react-router-dom'
import {
  Zap,
  Globe,
  Shield,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConnectWallet } from '@/components/wallet/ConnectWallet'
import { useWallet } from '@/hooks/useWallet'

const features = [
  {
    icon: <Zap size={24} />,
    title: 'Instant Transfers',
    description:
      'Transactions confirm in 3–5 seconds on the Stellar network, compared to days with traditional wire transfers.',
    color: 'text-warning-400 bg-warning-500/10 border-warning-500/20',
  },
  {
    icon: <Globe size={24} />,
    title: 'Truly Global',
    description:
      'Send to anyone on the Stellar network anywhere in the world — no bank account required.',
    color: 'text-stellar-400 bg-stellar-500/10 border-stellar-500/20',
  },
  {
    icon: <DollarSign size={24} />,
    title: 'Minimal Fees',
    description:
      'Network fees are a fraction of a cent (0.00001 XLM). No hidden charges or currency conversion markups.',
    color: 'text-success-400 bg-success-500/10 border-success-500/20',
  },
  {
    icon: <Shield size={24} />,
    title: 'Non-Custodial',
    description:
      'Your keys, your funds. StellarSend never holds your assets — all transactions go directly through your wallet.',
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  },
  {
    icon: <TrendingUp size={24} />,
    title: 'Best Exchange Rates',
    description:
      'Path payments intelligently route through Stellar\'s DEX to give you the best exchange rate.',
    color: 'text-stellar-400 bg-stellar-500/10 border-stellar-500/20',
  },
  {
    icon: <Users size={24} />,
    title: 'Multi-Asset',
    description:
      'Send XLM, USDC, or any Stellar-based asset. The recipient can choose what they receive.',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
]

const steps = [
  {
    n: '01',
    title: 'Connect Freighter',
    desc: 'Install the Freighter browser extension and connect your Stellar wallet.',
  },
  {
    n: '02',
    title: 'Enter Recipient',
    desc: 'Paste the recipient\'s Stellar address (G...) or Federation address.',
  },
  {
    n: '03',
    title: 'Choose Asset & Amount',
    desc: 'Select the asset and amount to send. Enable path payment for cross-asset transfers.',
  },
  {
    n: '04',
    title: 'Review Quote',
    desc: 'Review the exchange rate, fees, and estimated arrival before confirming.',
  },
  {
    n: '05',
    title: 'Sign & Send',
    desc: 'Freighter signs the transaction client-side. Your keys never leave your device.',
  },
]

export default function Home() {
  const { isConnected } = useWallet()

  return (
    <div className="min-h-screen bg-navy-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-hero-gradient opacity-60" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-stellar-600/20 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 md:px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stellar-500/15 border border-stellar-500/30 text-stellar-300 text-sm font-medium mb-8">
            <Zap size={13} fill="currentColor" />
            Built on the Stellar Blockchain
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
            Send Money{' '}
            <span className="bg-stellar-gradient bg-clip-text text-transparent">
              Anywhere
            </span>
            <br />
            in Seconds
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            StellarSend lets you transfer any Stellar asset globally — instantly and at
            near-zero cost. Non-custodial, open-source, and powered by the Stellar
            blockchain.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {isConnected ? (
              <Link to="/send">
                <Button size="xl" iconRight={<ArrowRight size={20} />}>
                  Send Money Now
                </Button>
              </Link>
            ) : (
              <ConnectWallet asButton className="h-13 px-7 text-lg rounded-2xl" />
            )}
            <Link to="/dashboard">
              <Button size="xl" variant="secondary">
                Go to Dashboard
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-slate-500">
            {['3-5 sec confirmation', '< $0.001 fees', 'Non-custodial', 'Open source'].map(
              (badge) => (
                <div key={badge} className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-success-500" />
                  {badge}
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-navy-700/50 bg-navy-900/50 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Avg. Confirmation', value: '4.2s', icon: <Clock size={16} /> },
            { label: 'Transaction Fee', value: '~$0.001', icon: <DollarSign size={16} /> },
            { label: 'Supported Assets', value: '200+', icon: <TrendingUp size={16} /> },
            { label: 'Countries', value: 'Worldwide', icon: <Globe size={16} /> },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center text-center gap-1">
              <div className="text-stellar-400 mb-1">{s.icon}</div>
              <span className="text-2xl font-bold text-white">{s.value}</span>
              <span className="text-xs text-slate-500">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">
            Why StellarSend?
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto">
            Modern cross-border payments built on next-generation blockchain infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <Card key={f.title} className="hover:border-navy-500/50 transition-colors">
              <div
                className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${f.color}`}
              >
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-navy-900/40 border-y border-navy-700/40">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">How It Works</h2>
            <p className="text-slate-400">Five simple steps to send money globally.</p>
          </div>

          <div className="space-y-4">
            {steps.map((step, i) => (
              <div
                key={step.n}
                className="flex items-start gap-5 p-5 rounded-2xl bg-navy-800/50 border border-navy-700/40 hover:border-stellar-600/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-stellar-gradient flex items-center justify-center shrink-0 font-bold text-white text-sm shadow-stellar">
                  {step.n}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">{step.title}</h4>
                  <p className="text-sm text-slate-400">{step.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight size={16} className="text-slate-600 mt-3 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-20 text-center">
        <div className="relative rounded-3xl bg-card-gradient border border-navy-600/50 p-12 overflow-hidden">
          <div className="absolute inset-0 bg-stellar-gradient opacity-5" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to send your first payment?
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Connect your Freighter wallet and experience instant, low-cost global transfers.
            </p>
            {isConnected ? (
              <Link to="/send">
                <Button size="xl" iconRight={<ArrowRight size={18} />}>
                  Start Sending
                </Button>
              </Link>
            ) : (
              <ConnectWallet asButton className="h-13 px-7 text-base rounded-2xl mx-auto" />
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-700/40 py-8 px-4 md:px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-stellar-gradient flex items-center justify-center">
              <Zap size={13} className="text-white" fill="white" />
            </div>
            <span className="text-sm font-semibold text-white">StellarSend</span>
          </div>
          <p className="text-xs text-slate-500">
            MIT License · Built with the Stellar SDK · Not affiliated with SDF
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <a href="https://stellar.org" className="hover:text-slate-300 transition-colors" target="_blank" rel="noopener noreferrer">
              Stellar.org
            </a>
            <a href="https://www.freighter.app" className="hover:text-slate-300 transition-colors" target="_blank" rel="noopener noreferrer">
              Freighter
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
