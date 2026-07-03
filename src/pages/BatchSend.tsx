import React from 'react'
import { AlertCircle, CheckCircle2, ExternalLink, RotateCcw } from 'lucide-react'
import { BatchForm } from '@/components/BatchSend/BatchForm'
import { BatchConfirmModal } from '@/components/BatchSend/BatchConfirmModal'
import { ConnectWalletScreen } from '@/components/wallet/ConnectWallet'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useBatchPayment } from '@/hooks/useBatchPayment'
import { useWallet } from '@/hooks/useWallet'

export default function BatchSend() {
  const { isConnected, network } = useWallet()
  const {
    state,
    reviewBatch,
    confirmBatch,
    goBack,
    reset,
    isSending,
    totalAmount,
    supportedAssets,
  } = useBatchPayment()

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <ConnectWalletScreen />
        </Card>
      </div>
    )
  }

  if (state.step === 'success' && state.result) {
    const explorerUrl =
      network === 'testnet'
        ? `https://stellar.expert/explorer/testnet/tx/${state.result.transactionHash}`
        : `https://stellar.expert/explorer/public/tx/${state.result.transactionHash}`

    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <div className="flex flex-col items-center text-center py-8">
          <CheckCircle2 size={56} className="text-success-400 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Batch Sent!</h2>
          <p className="text-slate-400 max-w-xs">
            {state.result.recipientCount} payments totaling {state.result.totalAmount} were sent
            in a single transaction.
          </p>
        </div>
        <Card padding="sm" className="mb-4">
          <p className="text-xs text-slate-400 mb-2 font-medium">Transaction Hash</p>
          <p className="text-xs font-mono text-slate-300 break-all">
            {state.result.transactionHash}
          </p>
        </Card>
        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            fullWidth
            icon={<ExternalLink size={15} />}
            onClick={() => window.open(explorerUrl, '_blank', 'noopener')}
          >
            View on Stellar Explorer
          </Button>
          <Button variant="secondary" fullWidth icon={<RotateCcw size={14} />} onClick={reset}>
            Send Another Batch
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Batch / Split Payments</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Pay multiple recipients atomically in a single transaction
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {state.step === 'error' && state.error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-danger-500/10 border border-danger-500/20 animate-fade-in">
              <AlertCircle size={18} className="text-danger-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-danger-300 mb-1">Batch Failed</p>
                <p className="text-xs text-slate-400">{state.error}</p>
              </div>
              <Button variant="ghost" size="xs" onClick={reset}>
                Try Again
              </Button>
            </div>
          )}

          {(state.step === 'form' || state.step === 'error') && (
            <BatchForm
              onSubmit={reviewBatch}
              supportedAssets={supportedAssets}
              defaultValues={state.formValues ?? undefined}
            />
          )}
        </div>

        <div>
          <Card padding="sm">
            <p className="text-xs font-semibold text-white mb-2">How it works</p>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Add each recipient and amount</li>
              <li>Review the combined transaction</li>
              <li>Sign once with Freighter — all payments settle atomically</li>
            </ul>
          </Card>
        </div>
      </div>

      {state.formValues && (
        <BatchConfirmModal
          isOpen={state.step === 'review' || state.step === 'signing' || state.step === 'submitting'}
          onClose={goBack}
          onConfirm={confirmBatch}
          formValues={state.formValues}
          totalAmount={totalAmount}
          isLoading={isSending}
          step={
            state.step === 'signing' ? 'signing' : state.step === 'submitting' ? 'submitting' : 'review'
          }
        />
      )}
    </>
  )
}
