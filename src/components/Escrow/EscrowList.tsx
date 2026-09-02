import React, { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/common/Skeleton'
import { NetworkError } from '@/components/common/NetworkError'
import { EscrowItem } from './EscrowItem'
import type { Escrow } from '@/types'

interface EscrowListProps {
  escrows: Escrow[] | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  currentPublicKey: string | null
  onRelease: (id: string) => void
  onRefund: (id: string) => void
  // A Set of every currently in-flight id, not a single scalar — two
  // different escrows can be releasing/refunding at once (#52).
  releasingIds?: Set<string>
  refundingIds?: Set<string>
}

export function EscrowList({
  escrows,
  isLoading,
  isError,
  onRetry,
  currentPublicKey,
  onRelease,
  onRefund,
  releasingIds,
  refundingIds,
}: EscrowListProps) {
  // Periodically tick wall-clock time so EscrowItem re-evaluates unlockTime (#40)
  const [now, setNow] = useState<Date>(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, 10_000)
    return () => clearInterval(timer)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock size={18} className="text-stellar-400" />
          Your Escrows
        </CardTitle>
      </CardHeader>

      {isLoading && <Skeleton rows={3} className="h-16 w-full" />}

      {!isLoading && isError && (
        <NetworkError onRetry={onRetry} message="Failed to load escrows" />
      )}

      {!isLoading && !isError && (!escrows || escrows.length === 0) && (
        <div className="text-center py-10">
          <Lock size={28} className="text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-300">No escrows yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Create one above to lock funds for a beneficiary.
          </p>
        </div>
      )}

      {!isLoading && !isError && escrows && escrows.length > 0 && (
        <div>
          {escrows.map((e) => (
            <EscrowItem
              key={e.id}
              escrow={e}
              currentPublicKey={currentPublicKey}
              onRelease={onRelease}
              onRefund={onRefund}
              isReleasing={releasingIds?.has(e.id) ?? false}
              isRefunding={refundingIds?.has(e.id) ?? false}
              now={now}
            />
          ))}
        </div>
      )}
    </Card>
  )
}
