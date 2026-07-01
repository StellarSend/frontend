import React, { useState } from 'react'
import { Wallet, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useWallet } from '@/hooks/useWallet'

interface ConnectWalletProps {
  asButton?: boolean
  className?: string
  fullWidth?: boolean
}

export function ConnectWallet({ asButton = true, className, fullWidth }: ConnectWalletProps) {
  const { connect, isConnecting, isFreighterInstalled, error, isConnected } = useWallet()
  const [showModal, setShowModal] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleConnect = async () => {
    if (!isFreighterInstalled) {
      setShowModal(true)
      return
    }
    setLocalError(null)
    try {
      await connect()
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Failed to connect')
    }
  }

  if (isConnected) return null

  return (
    <>
      {asButton ? (
        <Button
          onClick={handleConnect}
          loading={isConnecting}
          icon={<Wallet size={16} />}
          fullWidth={fullWidth}
          className={className}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      ) : (
        <button onClick={handleConnect} className={className}>
          Connect Wallet
        </button>
      )}

      {/* Installation guide modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Install Freighter Wallet"
        description="Freighter is the Stellar wallet extension needed to use StellarSend."
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-stellar-500/10 border border-stellar-500/20 rounded-xl">
            <AlertCircle size={18} className="text-stellar-400 mt-0.5 shrink-0" />
            <div className="text-sm text-slate-300">
              Freighter is a browser extension that lets you interact with the Stellar
              network securely. Your private keys never leave your device.
            </div>
          </div>

          <div className="space-y-2">
            {[
              'Open the Chrome / Firefox extension store',
              'Search for "Freighter Wallet" by Stellar Development Foundation',
              'Install and create/import your Stellar account',
              'Return here and click Connect Wallet',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="w-5 h-5 rounded-full bg-stellar-600/30 border border-stellar-500/30 text-stellar-400 text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              icon={<ExternalLink size={14} />}
              onClick={() => {
                window.open('https://www.freighter.app/', '_blank', 'noopener')
                setShowModal(false)
              }}
            >
              Get Freighter
            </Button>
          </div>
        </div>
      </Modal>

      {/* Inline error */}
      {(error || localError) && (
        <p className="text-xs text-danger-400 mt-1 flex items-center gap-1">
          <AlertCircle size={12} />
          {error || localError}
        </p>
      )}
    </>
  )
}

// ─── Full connect screen ──────────────────────────────────────────────────────

export function ConnectWalletScreen() {
  const { connect, isConnecting, isFreighterInstalled, error } = useWallet()

  return (
    <div className="flex flex-col items-center justify-center min-h-64 p-8 text-center">
      <div className="w-20 h-20 rounded-2xl bg-stellar-gradient flex items-center justify-center mb-6 shadow-glow">
        <Wallet size={36} className="text-white" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        Connect Your Wallet
      </h3>
      <p className="text-sm text-slate-400 max-w-xs mb-6">
        Connect your Freighter wallet to send money, view your balance, and track
        transactions.
      </p>

      {!isFreighterInstalled ? (
        <div className="space-y-3 w-full max-w-xs">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-warning-500/10 border border-warning-500/20 text-warning-400 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>Freighter wallet is not installed</span>
          </div>
          <Button
            fullWidth
            icon={<ExternalLink size={16} />}
            onClick={() => window.open('https://www.freighter.app/', '_blank', 'noopener')}
          >
            Install Freighter
          </Button>
        </div>
      ) : (
        <div className="space-y-3 w-full max-w-xs">
          <Button
            fullWidth
            size="lg"
            loading={isConnecting}
            icon={isConnecting ? undefined : <CheckCircle2 size={18} />}
            onClick={connect}
          >
            {isConnecting ? 'Connecting...' : 'Connect Freighter'}
          </Button>
          {error && (
            <p className="text-xs text-danger-400 flex items-center gap-1 justify-center">
              <AlertCircle size={12} />
              {error}
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-slate-500 mt-6 max-w-xs">
        By connecting, you agree to our{' '}
        <a href="#" className="text-stellar-400 hover:underline">Terms of Service</a>{' '}
        and{' '}
        <a href="#" className="text-stellar-400 hover:underline">Privacy Policy</a>.
      </p>
    </div>
  )
}
