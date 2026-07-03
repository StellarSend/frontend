import React, { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { CreateRequestForm } from '@/components/PaymentRequests/CreateRequestForm'
import { RequestList } from '@/components/PaymentRequests/RequestList'
import { RequestQRCode, ShareableLink } from '@/components/PaymentRequests/RequestQRCode'
import { ConnectWalletScreen } from '@/components/wallet/ConnectWallet'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  useCreatePaymentRequest,
  usePaymentRequestList,
  buildPaymentRequestLink,
} from '@/hooks/usePaymentRequests'
import { useSupportedAssets } from '@/hooks/useSendPayment'
import { useWallet } from '@/hooks/useWallet'
import type { PaymentRequestFormValues } from '@/types'

export default function PaymentRequests() {
  const { isConnected, publicKey } = useWallet()
  const supportedAssets = useSupportedAssets()
  const createMutation = useCreatePaymentRequest()
  const { data: requests, isLoading, isError, refetch } = usePaymentRequestList()
  const [createdLink, setCreatedLink] = useState<string | null>(null)

  if (!isConnected || !publicKey) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <ConnectWalletScreen />
        </Card>
      </div>
    )
  }

  const handleSubmit = (values: PaymentRequestFormValues) => {
    const asset = supportedAssets.find((a) => a.code === values.assetCode) ?? supportedAssets[0]
    createMutation.mutate(
      {
        requesterPublicKey: publicKey,
        assetCode: asset.code,
        assetIssuer: asset.issuer,
        amount: values.amount,
        memo: values.memo || undefined,
        expiresAt: values.expiresInHours
          ? new Date(Date.now() + parseFloat(values.expiresInHours) * 3_600_000).toISOString()
          : undefined,
      },
      {
        onSuccess: (created) => setCreatedLink(buildPaymentRequestLink(created.id)),
      },
    )
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Payment Requests</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Invoice anyone with a shareable link or QR code
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {createMutation.isError && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-danger-500/10 border border-danger-500/20 animate-fade-in">
              <AlertCircle size={18} className="text-danger-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-danger-300 mb-1">
                  Could Not Create Request
                </p>
                <p className="text-xs text-slate-400">
                  {createMutation.error?.message || 'Please try again.'}
                </p>
              </div>
              <Button variant="ghost" size="xs" onClick={() => createMutation.reset()}>
                Dismiss
              </Button>
            </div>
          )}

          {createdLink ? (
            <Card>
              <p className="text-sm font-semibold text-white mb-4">
                Request created — share this link or QR code
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <RequestQRCode value={createdLink} />
                <div className="flex-1 w-full space-y-3">
                  <ShareableLink link={createdLink} />
                  <Button variant="secondary" fullWidth onClick={() => setCreatedLink(null)}>
                    Create Another Request
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <CreateRequestForm
              onSubmit={handleSubmit}
              isLoading={createMutation.isPending}
              supportedAssets={supportedAssets}
            />
          )}

          <RequestList
            requests={requests}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
          />
        </div>

        <div>
          <Card padding="sm">
            <p className="text-xs font-semibold text-white mb-2">How it works</p>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Set an amount, optional memo, and expiry</li>
              <li>Share the link or QR code with the payer</li>
              <li>They open it and pay directly from their own wallet</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  )
}
