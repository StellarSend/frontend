import React from 'react'
import { useParams } from 'react-router-dom'
import { AlertCircle, FileText } from 'lucide-react'
import { SendForm } from '@/components/send/SendForm'
import { QuoteCard } from '@/components/send/QuoteCard'
import { ConfirmModal } from '@/components/send/ConfirmModal'
import { SuccessScreen } from '@/components/send/SuccessScreen'
import { ConnectWalletScreen } from '@/components/wallet/ConnectWallet'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/common/Skeleton'
import { NetworkError } from '@/components/common/NetworkError'
import { formatAmount } from '@/lib/stellar'
import { usePaymentRequest } from '@/hooks/usePaymentRequests'
import { useSendPayment } from '@/hooks/useSendPayment'
import { useWallet } from '@/hooks/useWallet'

export default function PayRequest() {
  const { id } = useParams<{ id: string }>()
  const { isConnected, network } = useWallet()
  const { data: paymentRequest, isLoading, isError, refetch } = usePaymentRequest(id)

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

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto mt-8">
        <Card>
          <Skeleton rows={4} className="h-6 w-full" />
        </Card>
      </div>
    )
  }

  if (isError || !paymentRequest) {
    return (
      <div className="max-w-lg mx-auto mt-8">
        <Card>
          <NetworkError onRetry={() => refetch()} message="This payment request could not be found" />
        </Card>
      </div>
    )
  }

  if (paymentRequest.status !== 'open') {
    return (
      <div className="max-w-lg mx-auto mt-8">
        <Card>
          <div className="flex items-start gap-3 p-2">
            <AlertCircle size={18} className="text-warning-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white mb-1">
                This request is {paymentRequest.status}
              </p>
              <p className="text-xs text-slate-400">
                It can no longer be paid. Ask the requester for a new link if you still owe this
                payment.
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

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
    <div className="max-w-lg mx-auto space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={18} className="text-stellar-400" />
            Payment Request
          </CardTitle>
          <Badge variant="warning" size="xs">
            open
          </Badge>
        </CardHeader>
        <div className="text-center py-2">
          <p className="text-3xl font-bold text-white tabular-nums">
            {formatAmount(paymentRequest.amount, 4)}
          </p>
          <p className="text-sm text-slate-400 mt-1">{paymentRequest.assetCode} requested</p>
          {paymentRequest.memo && (
            <p className="text-xs text-slate-500 mt-2 font-mono">{paymentRequest.memo}</p>
          )}
        </div>
      </Card>

      {state.step === 'error' && state.error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-danger-500/10 border border-danger-500/20">
          <AlertCircle size={18} className="text-danger-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400 flex-1">{state.error}</p>
        </div>
      )}

      {(state.step === 'form' || state.step === 'error') && (
        <SendForm
          onSubmit={requestQuote}
          isLoading={isQuoting}
          supportedAssets={supportedAssets}
          defaultValues={{
            destinationAddress: paymentRequest.requesterPublicKey,
            amount: paymentRequest.amount,
            sourceAssetCode: paymentRequest.assetCode,
            destinationAssetCode: paymentRequest.assetCode,
            memo: paymentRequest.memo ?? '',
          }}
        />
      )}

      {state.step === 'review' && state.quote && (
        <QuoteCard quote={state.quote} isLoading={isQuoting} onBack={goBack} onConfirm={confirmSend} isSending={isSending} />
      )}

      {state.quote && state.formValues && (
        <ConfirmModal
          isOpen={state.step === 'review' || state.step === 'signing' || state.step === 'submitting'}
          onClose={goBack}
          onConfirm={confirmSend}
          quote={state.quote}
          formValues={state.formValues}
          isLoading={isSending}
          step={
            state.step === 'signing' ? 'signing' : state.step === 'submitting' ? 'submitting' : 'review'
          }
        />
      )}
    </div>
  )
}
