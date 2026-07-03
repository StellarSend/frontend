import React from 'react'
import { FileText } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/common/Skeleton'
import { NetworkError } from '@/components/common/NetworkError'
import { RequestItem } from './RequestItem'
import type { PaymentRequest } from '@/types'

interface RequestListProps {
  requests: PaymentRequest[] | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

export function RequestList({ requests, isLoading, isError, onRetry }: RequestListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText size={18} className="text-stellar-400" />
          Your Payment Requests
        </CardTitle>
      </CardHeader>

      {isLoading && <Skeleton rows={3} className="h-14 w-full" />}

      {!isLoading && isError && (
        <NetworkError onRetry={onRetry} message="Failed to load payment requests" />
      )}

      {!isLoading && !isError && (!requests || requests.length === 0) && (
        <div className="text-center py-10">
          <FileText size={28} className="text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-300">No payment requests yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Create a request above to get a shareable link and QR code.
          </p>
        </div>
      )}

      {!isLoading && !isError && requests && requests.length > 0 && (
        <div>
          {requests.map((r) => (
            <RequestItem key={r.id} request={r} />
          ))}
        </div>
      )}
    </Card>
  )
}
