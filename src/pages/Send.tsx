import React from 'react'
import { AlertCircle, Info } from 'lucide-react'
import { SendForm } from '@/components/send/SendForm'
import { QuoteCard } from '@/components/send/QuoteCard'
import { ConfirmModal } from '@/components/send/ConfirmModal'
import { SuccessScreen } from '@/components/send/SuccessScreen'
import { ConnectWalletScreen } from '@/components/wallet/ConnectWallet'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useSendPayment } from '@/hooks/useSendPayment'
import { useWallet } from '@/hooks/useWallet'

// ─── Network info sidebar ─────────────────────────────────────────────────────

function SendInfo() {
  const { network } = useWallet()
  return (
    <div className="space-y-4">
      <Card padding="sm">
        <div className="flex items-start gap-2.5">
          <Info size={15} className="text-stellar-400 mt-0.5 shrink-0" />
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-white">How payments work</p>
            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
              <li>Enter a Stellar G... address or federation address</li>
              <li>Choose assets and amount</li>
              <li>Review the live exchange quote</li>
              <li>Sign with Freighter (your keys, always)</li>
              <li>Confirm in 3–5 seconds on-chain</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card padding="sm">
        <div className="flex items-start gap-2.5">
          <AlertCircle size={15} className="text-warning-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-white mb-1">
              {network === 'testnet' ? 'Testnet Mode' : 'Mainnet Mode'}
            </p>
            <p className="text-xs text-slate-400">
              {network === 'testnet'
                ? 'You\'re on testnet. Transactions use test funds only. Switch to mainnet in Settings.'
                : 'You\'re on mainnet. Transactions are real and irreversible.'}
            </p>
          </div>
        </div>
      </Card>

      <Card padding="sm">
        <p className="text-xs font-semibold text-white mb-2">Minimum amounts</p>
        <div className="space-y-1.5 text-xs text-slate-400">
          <div className="flex justify-between">
            <span>XLM reserve</span>
            <span className="font-mono text-slate-300">1.5 XLM</span>
          </div>
          <div className="flex justify-between">
            <span>Min send amount</span>
            <span className="font-mono text-slate-300">0.0000001</span>
          </div>
          <div className="flex justify-between">
            <span>Network fee</span>
            <span className="font-mono text-slate-300">~0.00001 XLM</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Send() {
  const { isConnected, network } = useWallet()
  const {
    state,
    requestQuote,
    confirmSend,
    reset,
    goBack,
    isQuoting,
    isSending,
    supportedAssets,
  } = useSendPayment()

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <ConnectWalletScreen />
        </Card>
      </div>
    )
  }

  // Success screen
  if (state.step === 'success' && state.result && state.quote) {
    return (
      <div className="max-w-lg mx-auto animate-slide-up">
        <SuccessScreen
          result={state.result}
          quote={state.quote}
          network={network}
          onSendAnother={reset}
        />
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Send Money</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Transfer assets to any Stellar address globally
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form / quote area */}
        <div className="lg:col-span-2 space-y-5">
          {/* Error state */}
          {state.step === 'error' && state.error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-danger-500/10 border border-danger-500/20 animate-fade-in">
              <AlertCircle size={18} className="text-danger-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-danger-300 mb-1">
                  Transaction Failed
                </p>
                <p className="text-xs text-slate-400">{state.error}</p>
              </div>
              <Button variant="ghost" size="xs" onClick={reset}>
                Try Again
              </Button>
            </div>
          )}

          {/* Show form when on form / error step */}
          {(state.step === 'form' || state.step === 'error') && (
            <SendForm
              onSubmit={requestQuote}
              isLoading={isQuoting}
              supportedAssets={supportedAssets}
              defaultValues={state.formValues ?? undefined}
            />
          )}

          {/* Show quote when on review step */}
          {(state.step === 'review' || state.step === 'quoting') &&
            state.quote && (
              <QuoteCard
                quote={state.quote}
                isLoading={isQuoting}
                onBack={goBack}
                onConfirm={confirmSend}
                isSending={isSending}
              />
            )}

          {/* Loading quote */}
          {state.step === 'quoting' && !state.quote && (
            <QuoteCard
              quote={{
                id: '',
                expiresAt: new Date(Date.now() + 30_000).toISOString(),
                sourceAsset: supportedAssets[0],
                destinationAsset: supportedAssets[0],
                sendAmount: '0',
                receiveAmount: '0',
                exchangeRate: '1',
                networkFee: '0.00001',
                serviceFee: '0',
                totalFee: '0.00001',
                estimatedSeconds: 5,
                path: [],
                slippageTolerance: '0.5',
                priceImpact: '0',
              }}
              isLoading
            />
          )}
        </div>

        {/* Sidebar info */}
        <div>
          <SendInfo />
        </div>
      </div>

      {/* Confirm modal */}
      {state.quote && state.formValues && (
        <ConfirmModal
          isOpen={
            state.step === 'review' ||
            state.step === 'signing' ||
            state.step === 'submitting'
          }
          onClose={goBack}
          onConfirm={confirmSend}
          quote={state.quote}
          formValues={state.formValues}
          isLoading={isSending}
          step={
            state.step === 'signing'
              ? 'signing'
              : state.step === 'submitting'
                ? 'submitting'
                : 'review'
          }
        />
      )}
    </>
  )
}
