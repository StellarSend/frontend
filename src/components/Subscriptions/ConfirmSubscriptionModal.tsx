import React from 'react'
import { ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { truncateAddress, formatAmount } from '@/lib/stellar'
import type { SubscriptionFormValues } from '@/types'

interface ConfirmSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  formValues: SubscriptionFormValues
  isLoading: boolean
  step: 'signing' | 'submitting' | 'review'
}

const intervalLabel: Record<SubscriptionFormValues['interval'], string> = {
  daily: 'Every day',
  weekly: 'Every week',
  monthly: 'Every month',
  yearly: 'Every year',
}

export function ConfirmSubscriptionModal({
  isOpen,
  onClose,
  onConfirm,
  formValues,
  isLoading,
  step,
}: ConfirmSubscriptionModalProps) {
  const stepLabel =
    step === 'signing'
      ? 'Waiting for Freighter signature...'
      : step === 'submitting'
        ? 'Registering schedule...'
        : null

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? undefined : onClose}
      title="Confirm Recurring Payment"
      description="Review the schedule below before signing with Freighter."
      size="md"
    >
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-stellar-gradient flex items-center justify-center shadow-glow">
            <ShieldCheck size={28} className="text-white" />
          </div>
        </div>

        <div className="rounded-xl bg-navy-900/60 border border-navy-700/40 divide-y divide-navy-700/40">
          <Row label="Amount">
            <span className="font-bold text-white tabular-nums">
              {formatAmount(formValues.amount, 4)} {formValues.assetCode}
            </span>
          </Row>
          <Row label="Frequency">
            <span className="text-slate-200">{intervalLabel[formValues.interval]}</span>
          </Row>
          <Row label="Starts">
            <span className="text-slate-200">{formValues.startDate}</span>
          </Row>
          <Row label="To">
            <span className="font-mono text-sm text-slate-300">
              {truncateAddress(formValues.destinationAddress, 8)}
            </span>
          </Row>
          {formValues.memo && (
            <Row label="Memo">
              <span className="text-slate-300 font-mono text-sm">{formValues.memo}</span>
            </Row>
          )}
        </div>

        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-warning-500/8 border border-warning-500/20">
          <AlertTriangle size={15} className="text-warning-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed">
            You authorize this schedule with your own wallet. You can{' '}
            <strong className="text-warning-300">cancel it any time</strong> from the
            Subscriptions page.
          </p>
        </div>

        {isLoading && stepLabel && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-stellar-500/10 border border-stellar-500/20">
            <Loader2 size={16} className="text-stellar-400 animate-spin shrink-0" />
            <p className="text-sm text-stellar-300">{stepLabel}</p>
          </div>
        )}

        <ModalFooter>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            loading={isLoading}
            onClick={onConfirm}
            disabled={isLoading}
            icon={<ShieldCheck size={15} />}
          >
            {isLoading ? stepLabel?.split('...')[0] || 'Processing' : 'Sign & Create'}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-3">
      <span className="text-sm text-slate-400 shrink-0">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  )
}
