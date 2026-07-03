import React, { useState } from 'react'
import { FileText, QrCode, Copy, Check } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatAmount } from '@/lib/stellar'
import { copyToClipboard } from '@/lib/utils'
import { buildPaymentRequestLink } from '@/hooks/usePaymentRequests'
import { RequestQRCode } from './RequestQRCode'
import type { PaymentRequest } from '@/types'

interface RequestItemProps {
  request: PaymentRequest
}

const statusVariant: Record<PaymentRequest['status'], 'success' | 'neutral' | 'danger' | 'warning'> = {
  open: 'warning',
  paid: 'success',
  expired: 'neutral',
  cancelled: 'danger',
}

export function RequestItem({ request }: RequestItemProps) {
  const [showQr, setShowQr] = useState(false)
  const [copied, setCopied] = useState(false)
  const link = buildPaymentRequestLink(request.id)

  const handleCopy = async () => {
    await copyToClipboard(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="py-4 border-b border-navy-700/40 last:border-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-stellar-500/10 border border-stellar-500/20 flex items-center justify-center shrink-0">
            <FileText size={15} className="text-stellar-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white truncate">
                {formatAmount(request.amount, 4)} {request.assetCode}
              </p>
              <Badge variant={statusVariant[request.status]} size="xs">
                {request.status}
              </Badge>
            </div>
            {request.memo && (
              <p className="text-xs text-slate-400 truncate">{request.memo}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="xs"
            icon={copied ? <Check size={13} className="text-success-400" /> : <Copy size={13} />}
            onClick={handleCopy}
          >
            {copied ? 'Copied' : 'Copy link'}
          </Button>
          <Button
            variant="ghost"
            size="xs"
            icon={<QrCode size={13} />}
            onClick={() => setShowQr((v) => !v)}
          >
            QR
          </Button>
        </div>
      </div>

      {showQr && (
        <div className="mt-3 flex justify-center">
          <RequestQRCode value={link} size={160} />
        </div>
      )}
    </div>
  )
}
