import React, { useState, useEffect } from 'react'
import {
  Globe,
  Sliders,
  Bell,
  Shield,
  Save,
  RotateCcw,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { NetworkBadge } from '@/components/ui/Badge'
import { ConnectWallet } from '@/components/wallet/ConnectWallet'
import { useWallet } from '@/hooks/useWallet'
import { truncateAddress, formatXLM } from '@/lib/stellar'
import { copyToClipboard } from '@/lib/utils'
import type { Network, AppSettings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'

function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('stellarsend_settings')
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
    } catch {
      // corrupted or unavailable localStorage — fall back to defaults
    }
    return DEFAULT_SETTINGS
  })

  const save = (next: AppSettings) => {
    setSettings(next)
    localStorage.setItem('stellarsend_settings', JSON.stringify(next))
  }

  const reset = () => save(DEFAULT_SETTINGS)

  return { settings, save, reset }
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function SettingsSection({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-stellar-400">{icon}</span>
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <div className="space-y-4">{children}</div>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Settings() {
  const { isConnected, publicKey, network, account, xlmBalance, setNetwork, disconnect } =
    useWallet()
  const { settings, save, reset } = useSettings()
  const [localSettings, setLocalSettings] = useState(settings)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleSave = () => {
    save(localSettings)
    // Apply network change
    if (localSettings.network !== network) {
      setNetwork(localSettings.network)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleCopy = async () => {
    if (!publicKey) return
    await copyToClipboard(publicKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const update = (key: keyof AppSettings, value: unknown) =>
    setLocalSettings((s) => ({ ...s, [key]: value }))

  const horizonUrl =
    localSettings.network === 'testnet'
      ? 'https://horizon-testnet.stellar.org'
      : 'https://horizon.stellar.org'

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-slate-400 mt-0.5">Configure StellarSend preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" icon={<RotateCcw size={13} />} onClick={reset}>
            Reset
          </Button>
          <Button
            size="sm"
            icon={saved ? <Check size={13} /> : <Save size={13} />}
            onClick={handleSave}
            variant={saved ? 'secondary' : 'primary'}
          >
            {saved ? 'Saved!' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Account */}
      <SettingsSection title="Account" icon={<Shield size={17} />}>
        {isConnected && publicKey ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-navy-900/50 border border-navy-700/40">
              <div>
                <p className="text-xs text-slate-400 mb-1">Connected Address</p>
                <p className="text-sm font-mono text-slate-200">
                  {truncateAddress(publicKey, 10)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  {copied ? <Check size={14} className="text-success-400" /> : <Copy size={14} />}
                </button>
                <a
                  href={
                    network === 'testnet'
                      ? `https://stellar.expert/explorer/testnet/account/${publicKey}`
                      : `https://stellar.expert/explorer/public/account/${publicKey}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {xlmBalance && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">XLM Balance</span>
                <span className="text-sm font-semibold text-white">{formatXLM(xlmBalance)}</span>
              </div>
            )}
            {account && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Sequence</span>
                <span className="text-xs font-mono text-slate-300">{account.sequence}</span>
              </div>
            )}

            <Button
              variant="danger"
              size="sm"
              fullWidth
              onClick={disconnect}
            >
              Disconnect Wallet
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-sm text-slate-400">No wallet connected</p>
            <ConnectWallet />
          </div>
        )}
      </SettingsSection>

      {/* Network */}
      <SettingsSection title="Network" icon={<Globe size={17} />}>
        <div className="space-y-3">
          {(['testnet', 'mainnet'] as Network[]).map((net) => (
            <button
              key={net}
              onClick={() => update('network', net)}
              className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-all ${
                localSettings.network === net
                  ? 'border-stellar-500/40 bg-stellar-500/8'
                  : 'border-navy-600/50 bg-navy-900/30 hover:border-navy-500/60'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                  localSettings.network === net
                    ? 'border-stellar-500 bg-stellar-500'
                    : 'border-slate-600'
                }`}
              >
                {localSettings.network === net && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <div className="text-left flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white capitalize">{net}</span>
                  <NetworkBadge network={net} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {net === 'testnet'
                    ? 'Safe testing environment with fake assets'
                    : 'Real Stellar network with real assets'}
                </p>
              </div>
            </button>
          ))}

          {localSettings.network === 'mainnet' && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-warning-500/8 border border-warning-500/20">
              <AlertTriangle size={15} className="text-warning-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-400">
                Mainnet uses <strong className="text-white">real funds</strong>. Transactions are
                irreversible. Make sure your wallet has real XLM before proceeding.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Horizon URL</span>
            <a
              href={horizonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-stellar-400 hover:underline flex items-center gap-1"
            >
              {horizonUrl.replace('https://', '')}
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </SettingsSection>

      {/* Transaction preferences */}
      <SettingsSection title="Transaction Preferences" icon={<Sliders size={17} />}>
        <Input
          label="Slippage Tolerance (%)"
          type="number"
          min="0.1"
          max="5"
          step="0.1"
          value={localSettings.slippageTolerance}
          onChange={(e) => update('slippageTolerance', e.target.value)}
          hint="Maximum price deviation before transaction reverts (0.1% – 5%)"
          fullWidth
        />
        <Input
          label="Default Memo"
          placeholder="Optional default memo for all transactions"
          value={localSettings.defaultMemo}
          onChange={(e) => update('defaultMemo', e.target.value)}
          hint="Will be pre-filled on the send form"
          fullWidth
        />
        <Select
          label="Auto-Refresh Interval (seconds)"
          options={[
            { value: '10', label: '10 seconds' },
            { value: '30', label: '30 seconds' },
            { value: '60', label: '1 minute' },
            { value: '300', label: '5 minutes' },
          ]}
          value={String(localSettings.autoRefreshInterval)}
          onChange={(e) => update('autoRefreshInterval', parseInt(e.target.value, 10))}
          fullWidth
        />
      </SettingsSection>

      {/* Notifications (UI only) */}
      <SettingsSection title="Display" icon={<Bell size={17} />}>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium text-slate-200">Show testnet banner</p>
            <p className="text-xs text-slate-500">
              Display a warning banner when using testnet
            </p>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={localSettings.showTestnetWarning}
              onChange={(e) => update('showTestnetWarning', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-navy-700 border border-navy-600 rounded-full peer-checked:bg-stellar-600 peer-checked:border-stellar-500 transition-all" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-slate-400 rounded-full peer-checked:translate-x-4 peer-checked:bg-white transition-all" />
          </div>
        </label>
      </SettingsSection>

      {/* Save button (bottom) */}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" fullWidth onClick={reset}>
          Reset to Defaults
        </Button>
        <Button
          fullWidth
          onClick={handleSave}
          icon={saved ? <Check size={15} /> : <Save size={15} />}
        >
          {saved ? 'Settings Saved!' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
