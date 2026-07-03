import React from 'react'
import { AlertCircle } from 'lucide-react'
import { SubscriptionForm } from '@/components/Subscriptions/SubscriptionForm'
import { ConfirmSubscriptionModal } from '@/components/Subscriptions/ConfirmSubscriptionModal'
import { SubscriptionList } from '@/components/Subscriptions/SubscriptionList'
import { ConnectWalletScreen } from '@/components/wallet/ConnectWallet'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  useCreateSubscription,
  useSubscriptionList,
  useCancelSubscription,
} from '@/hooks/useSubscriptions'
import { useWallet } from '@/hooks/useWallet'

export default function Subscriptions() {
  const { isConnected } = useWallet()
  const {
    state,
    reviewSubscription,
    confirmCreate,
    goBack,
    reset,
    isSubmitting,
    supportedAssets,
  } = useCreateSubscription()

  const { data: subscriptions, isLoading, isError, refetch } = useSubscriptionList()
  const cancelMutation = useCancelSubscription()

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
        <h1 className="text-2xl font-bold text-white">Scheduled & Recurring Payments</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Automate recurring transfers to any Stellar address
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {state.step === 'error' && state.error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-danger-500/10 border border-danger-500/20 animate-fade-in">
              <AlertCircle size={18} className="text-danger-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-danger-300 mb-1">
                  Could Not Create Subscription
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
                <p className="text-sm font-semibold text-success-300 mb-1">
                  Subscription Created
                </p>
                <p className="text-xs text-slate-400">
                  Your recurring payment has been scheduled.
                </p>
              </div>
              <Button variant="ghost" size="xs" onClick={reset}>
                Create Another
              </Button>
            </div>
          )}

          {(state.step === 'form' || state.step === 'error') && (
            <SubscriptionForm
              onSubmit={reviewSubscription}
              supportedAssets={supportedAssets}
              defaultValues={state.formValues ?? undefined}
            />
          )}

          <SubscriptionList
            subscriptions={subscriptions}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            onCancel={(id) => cancelMutation.mutate(id)}
            cancellingId={cancelMutation.isPending ? cancelMutation.variables ?? null : null}
          />
        </div>

        <div>
          <Card padding="sm">
            <p className="text-xs font-semibold text-white mb-2">How it works</p>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Set a recipient, amount, asset, and interval</li>
              <li>Authorize the schedule once with Freighter</li>
              <li>Cancel anytime — no funds are held upfront</li>
            </ul>
          </Card>
        </div>
      </div>

      {state.formValues && (
        <ConfirmSubscriptionModal
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
