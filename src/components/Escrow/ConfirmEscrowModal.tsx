import React from 'react'
import { ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { truncateAddress, formatAmount } from '@/lib/stellar'
import type { EscrowFormValues } from '@/types'

interface ConfirmEscrowModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  formValues: EscrowFormValues
  isLoading: boolean
  step: 'signing' | 'submitting' | 'review'
}

export function ConfirmEscrowModal({
  isOpen,
  onClose,
  onConfirm,
  formValues,
  isLoading,
  step,
}: ConfirmEscrowModalProps) {
  const stepLabel =
    step === 'signing'
      ? 'Waiting for Freighter signature...'
      : step === 'submitting'
        ? 'Funding escrow on-chain...'
        : null

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? undefined : onClose}
      title="Confirm Escrow"
      description="Funds will be locked in the escrow contract until released or refunded."
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
          <Row label="Beneficiary">
            <span className="font-mono text-sm text-slate-300">
              {truncateAddress(formValues.beneficiaryPublicKey, 8)}
            </span>
          </Row>
          <Row label="Arbiter">
            <span className="font-mono text-sm text-slate-300">
              {formValues.arbiterPublicKey
                ? truncateAddress(formValues.arbiterPublicKey, 8)
                : 'None'}
            </span>
          </Row>
          <Row label="Unlocks">
            <span className="text-slate-200">
              {new Date(formValues.unlockDate).toLocaleString()}
            </span>
          </Row>
        </div>

        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-warning-500/8 border border-warning-500/20">
          <AlertTriangle size={15} className="text-warning-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed">
            Once funded, only the beneficiary{formValues.arbiterPublicKey ? ' or arbiter' : ''} can
            release these funds. You (the depositor) can reclaim them yourself only{' '}
            <strong className="text-warning-300">after the unlock time</strong> if they haven't
            been released.
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
            {isLoading ? stepLabel?.split('...')[0] || 'Processing' : 'Sign & Fund Escrow'}
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
