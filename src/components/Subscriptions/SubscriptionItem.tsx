import React from 'react'
import { Repeat, Calendar, X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { truncateAddress, formatAmount } from '@/lib/stellar'
import { formatDate } from '@/lib/utils'
import type { Subscription } from '@/types'

interface SubscriptionItemProps {
  subscription: Subscription
  onCancel: (id: string) => void
  isCancelling?: boolean
}

const statusVariant: Record<Subscription['status'], 'success' | 'neutral' | 'danger' | 'info'> = {
  active: 'success',
  paused: 'neutral',
  cancelled: 'danger',
  completed: 'info',
}

export function SubscriptionItem({ subscription, onCancel, isCancelling }: SubscriptionItemProps) {
  const canCancel = subscription.status === 'active' || subscription.status === 'paused'

  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-navy-700/40 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-stellar-500/10 border border-stellar-500/20 flex items-center justify-center shrink-0">
          <Repeat size={15} className="text-stellar-400" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white truncate">
              {formatAmount(subscription.amount, 4)} {subscription.asset.code}
            </p>
            <Badge variant={statusVariant[subscription.status]} size="xs">
              {subscription.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 font-mono truncate">
            to {truncateAddress(subscription.destinationAddress, 6)} &middot; {subscription.interval}
          </p>
          {subscription.nextRunAt && subscription.status === 'active' && (
            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <Calendar size={10} />
              Next run {formatDate(subscription.nextRunAt)}
            </p>
          )}
        </div>
      </div>

      {canCancel && (
        <Button
          variant="ghost"
          size="xs"
          icon={<X size={13} />}
          loading={isCancelling}
          onClick={() => onCancel(subscription.id)}
          className="shrink-0 text-danger-400 hover:text-danger-300 hover:bg-danger-500/10"
        >
          Cancel
        </Button>
      )}
    </div>
  )
}
