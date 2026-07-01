import React from 'react'
import { ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { truncateAddress, formatAmount } from '@/lib/stellar'
import type { Quote, SendFormValues } from '@/types'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  quote: Quote
  formValues: SendFormValues
  isLoading: boolean
  step: 'signing' | 'submitting' | 'review'
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  quote,
  formValues,
  isLoading,
  step,
}: ConfirmModalProps) {
  const stepLabel =
    step === 'signing'
      ? 'Waiting for Freighter signature...'
      : step === 'submitting'
        ? 'Submitting to Stellar network...'
        : null

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? undefined : onClose}
      title="Confirm Transaction"
      description="Review the details below before signing with Freighter."
      size="md"
    >
      <div className="space-y-4">
        {/* Shield icon */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-stellar-gradient flex items-center justify-center shadow-glow">
            <ShieldCheck size={28} className="text-white" />
          </div>
        </div>

        {/* Amount summary */}
        <div className="rounded-xl bg-navy-900/60 border border-navy-700/40 divide-y divide-navy-700/40">
          <ConfirmRow label="You Send">
            <span className="font-bold text-white tabular-nums">
              {formatAmount(quote.sendAmount, 4)} {quote.sourceAsset.code}
            </span>
          </ConfirmRow>
          <ConfirmRow label="They Receive">
            <span className="font-bold text-stellar-400 tabular-nums">
              {formatAmount(quote.receiveAmount, 4)} {quote.destinationAsset.code}
            </span>
          </ConfirmRow>
          <ConfirmRow label="To">
            <span className="font-mono text-sm text-slate-300">
              {truncateAddress(formValues.destinationAddress, 8)}
            </span>
          </ConfirmRow>
          <ConfirmRow label="Network Fee">
            <span className="text-slate-300">
              {formatAmount(quote.networkFee, 7)} XLM
            </span>
          </ConfirmRow>
          {formValues.memo && (
            <ConfirmRow label="Memo">
              <span className="text-slate-300 font-mono text-sm">
                {formValues.memo}
              </span>
            </ConfirmRow>
          )}
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-warning-500/8 border border-warning-500/20">
          <AlertTriangle size={15} className="text-warning-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed">
            Stellar transactions are <strong className="text-warning-300">irreversible</strong>.
            Double-check the destination address and amount before confirming.
          </p>
        </div>

        {/* Loading state */}
        {isLoading && stepLabel && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-stellar-500/10 border border-stellar-500/20">
            <Loader2 size={16} className="text-stellar-400 animate-spin shrink-0" />
            <p className="text-sm text-stellar-300">{stepLabel}</p>
          </div>
        )}

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            loading={isLoading}
            onClick={onConfirm}
            disabled={isLoading}
            icon={<ShieldCheck size={15} />}
          >
            {isLoading ? stepLabel?.split('...')[0] || 'Processing' : 'Sign & Send'}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  )
}

function ConfirmRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-3">
      <span className="text-sm text-slate-400 shrink-0">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  )
}
