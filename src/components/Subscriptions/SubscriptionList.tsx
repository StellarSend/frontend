import React from 'react'
import { Repeat } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/common/Skeleton'
import { NetworkError } from '@/components/common/NetworkError'
import { SubscriptionItem } from './SubscriptionItem'
import type { Subscription } from '@/types'

interface SubscriptionListProps {
  subscriptions: Subscription[] | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onCancel: (id: string) => void
  cancellingId?: string | null
}

export function SubscriptionList({
  subscriptions,
  isLoading,
  isError,
  onRetry,
  onCancel,
  cancellingId,
}: SubscriptionListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat size={18} className="text-stellar-400" />
          Your Subscriptions
        </CardTitle>
      </CardHeader>

      {isLoading && <Skeleton rows={3} className="h-14 w-full" />}

      {!isLoading && isError && <NetworkError onRetry={onRetry} message="Failed to load subscriptions" />}

      {!isLoading && !isError && (!subscriptions || subscriptions.length === 0) && (
        <div className="text-center py-10">
          <Repeat size={28} className="text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-300">No subscriptions yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Create a recurring payment above to see it listed here.
          </p>
        </div>
      )}

      {!isLoading && !isError && subscriptions && subscriptions.length > 0 && (
        <div>
          {subscriptions.map((s) => (
            <SubscriptionItem
              key={s.id}
              subscription={s}
              onCancel={onCancel}
              isCancelling={cancellingId === s.id}
            />
          ))}
        </div>
      )}
    </Card>
  )
}
