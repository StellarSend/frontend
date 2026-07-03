import React from 'react'
import { AlertCircle } from 'lucide-react'
import { EscrowForm } from '@/components/Escrow/EscrowForm'
import { ConfirmEscrowModal } from '@/components/Escrow/ConfirmEscrowModal'
import { EscrowList } from '@/components/Escrow/EscrowList'
import { ConnectWalletScreen } from '@/components/wallet/ConnectWallet'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  useCreateEscrow,
  useEscrowList,
  useReleaseEscrow,
  useRefundEscrow,
} from '@/hooks/useEscrows'
import { useWallet } from '@/hooks/useWallet'

export default function EscrowPage() {
  const { isConnected, publicKey } = useWallet()
  const { state, reviewEscrow, confirmCreate, goBack, reset, isSubmitting, supportedAssets } =
    useCreateEscrow()

  const { data: escrows, isLoading, isError, refetch } = useEscrowList()
  const releaseMutation = useReleaseEscrow()
  const refundMutation = useRefundEscrow()

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <ConnectWalletScreen />
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Escrow / Conditional Transfers</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Lock funds until a beneficiary (or arbiter) releases them, or reclaim them yourself after
          the unlock time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {state.step === 'error' && state.error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-danger-500/10 border border-danger-500/20 animate-fade-in">
              <AlertCircle size={18} className="text-danger-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-danger-300 mb-1">
                  Could Not Create Escrow
                </p>
                <p className="text-xs text-slate-400">{state.error}</p>
              </div>
              <Button variant="ghost" size="xs" onClick={reset}>
                Try Again
              </Button>
            </div>
          )}

          {state.step === 'success' && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-success-500/10 border border-success-500/20 animate-fade-in">
              <div className="flex-1">
                <p className="text-sm font-semibold text-success-300 mb-1">Escrow Funded</p>
                <p className="text-xs text-slate-400">
                  Funds are locked until release or the unlock time passes.
                </p>
              </div>
              <Button variant="ghost" size="xs" onClick={reset}>
                Create Another
              </Button>
            </div>
          )}

          {(state.step === 'form' || state.step === 'error') && (
            <EscrowForm onSubmit={reviewEscrow} supportedAssets={supportedAssets} />
          )}

          <EscrowList
            escrows={escrows}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            currentPublicKey={publicKey}
            onRelease={(id) => releaseMutation.mutate(id)}
            onRefund={(id) => refundMutation.mutate(id)}
            releasingId={releaseMutation.isPending ? releaseMutation.variables ?? null : null}
            refundingId={refundMutation.isPending ? refundMutation.variables ?? null : null}
          />
        </div>

        <div>
          <Card padding="sm">
            <p className="text-xs font-semibold text-white mb-2">Release rules</p>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Beneficiary or arbiter can release funds at any time</li>
              <li>Depositor can only reclaim funds after the unlock time</li>
              <li>An arbiter is optional — omit it for a simple two-party escrow</li>
            </ul>
          </Card>
        </div>
      </div>

      {state.formValues && (
        <ConfirmEscrowModal
          isOpen={state.step === 'review' || state.step === 'signing' || state.step === 'submitting'}
          onClose={goBack}
          onConfirm={confirmCreate}
          formValues={state.formValues}
          isLoading={isSubmitting}
          step={
            state.step === 'signing' ? 'signing' : state.step === 'submitting' ? 'submitting' : 'review'
          }
        />
      )}
    </>
  )
}
