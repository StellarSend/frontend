import React from 'react'
import { ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { truncateAddress, formatAmount } from '@/lib/stellar'
import type { BatchPaymentFormValues } from '@/types'

interface BatchConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  formValues: BatchPaymentFormValues
  totalAmount: number
  isLoading: boolean
  step: 'signing' | 'submitting' | 'review'
}

export function BatchConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  formValues,
  totalAmount,
  isLoading,
  step,
}: BatchConfirmModalProps) {
  const stepLabel =
    step === 'signing'
      ? 'Waiting for Freighter signature...'
      : step === 'submitting'
        ? 'Submitting batch to Stellar network...'
        : null

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? undefined : onClose}
      title="Confirm Batch Payment"
      description={`Review all ${formValues.recipients.length} recipients before signing a single transaction.`}
      size="md"
    >
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-stellar-gradient flex items-center justify-center shadow-glow">
            <ShieldCheck size={28} className="text-white" />
          </div>
        </div>

        <div className="rounded-xl bg-navy-900/60 border border-navy-700/40 divide-y divide-navy-700/40 max-h-56 overflow-y-auto">
          {formValues.recipients.map((r, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5 gap-3">
              <span className="font-mono text-xs text-slate-400">
                {truncateAddress(r.destinationAddress, 6)}
              </span>
              <span className="text-sm font-semibold text-white tabular-nums">
                {formatAmount(r.amount, 4)} {formValues.assetCode}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="text-sm text-slate-400">Total</span>
          <span className="text-lg font-bold text-stellar-400 tabular-nums">
            {totalAmount.toFixed(4)} {formValues.assetCode}
          </span>
        </div>

        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-warning-500/8 border border-warning-500/20">
          <AlertTriangle size={15} className="text-warning-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed">
            All payments are sent as <strong className="text-warning-300">one atomic transaction</strong>
            {' '}— either every recipient is paid, or none are.
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
            {isLoading ? stepLabel?.split('...')[0] || 'Processing' : 'Sign & Send Batch'}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  )
}
