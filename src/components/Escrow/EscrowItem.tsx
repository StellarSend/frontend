import React from 'react'
import { Lock, Unlock, RotateCcw, Clock, Scale } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { truncateAddress, formatAmount } from '@/lib/stellar'
import { formatDateTime } from '@/lib/utils'
import { getEscrowPermissions } from '@/types'
import type { Escrow } from '@/types'

interface EscrowItemProps {
  escrow: Escrow
  currentPublicKey: string | null
  onRelease: (id: string) => void
  onRefund: (id: string) => void
  isReleasing?: boolean
  isRefunding?: boolean
  now?: Date
}

const statusVariant: Record<Escrow['status'], 'success' | 'neutral' | 'danger' | 'warning'> = {
  funded: 'warning',
  released: 'success',
  refunded: 'neutral',
  cancelled: 'danger',
}

const roleLabel: Record<string, string> = {
  depositor: 'Depositor',
  beneficiary: 'Beneficiary',
  arbiter: 'Arbiter',
}

export function EscrowItem({
  escrow,
  currentPublicKey,
  onRelease,
  onRefund,
  isReleasing,
  isRefunding,
  now,
}: EscrowItemProps) {
  const { canRelease, canRefund, role } = getEscrowPermissions(escrow, currentPublicKey, now)
  const unlocked = new Date(escrow.unlockTime).getTime() <= (now ?? new Date()).getTime()

  return (
    <div className="py-4 border-b border-navy-700/40 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-stellar-500/10 border border-stellar-500/20 flex items-center justify-center shrink-0">
            <Lock size={15} className="text-stellar-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-white truncate">
                {formatAmount(escrow.amount, 4)} {escrow.assetCode}
              </p>
              <Badge variant={statusVariant[escrow.status]} size="xs">
                {escrow.status}
              </Badge>
              {role && (
                <Badge variant="info" size="xs">
                  You: {roleLabel[role]}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono truncate">
              beneficiary {truncateAddress(escrow.beneficiaryPublicKey, 6)}
              {escrow.arbiterPublicKey && (
                <>
                  {' '}
                  &middot; arbiter {truncateAddress(escrow.arbiterPublicKey, 6)}
                </>
              )}
            </p>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <Clock size={10} />
              {unlocked ? 'Unlocked since' : 'Unlocks'} {formatDateTime(escrow.unlockTime)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {canRelease && (
            <Button
              variant="secondary"
              size="xs"
              icon={<Unlock size={13} />}
              loading={isReleasing}
              onClick={() => onRelease(escrow.id)}
            >
              Release
            </Button>
          )}
          {canRefund && (
            <Button
              variant="ghost"
              size="xs"
              icon={<RotateCcw size={13} />}
              loading={isRefunding}
              onClick={() => onRefund(escrow.id)}
              className="text-warning-400 hover:text-warning-300 hover:bg-warning-500/10"
            >
              Refund
            </Button>
          )}
          {role === 'depositor' && !unlocked && escrow.status === 'funded' && (
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Scale size={11} />
              Refund available after unlock
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
