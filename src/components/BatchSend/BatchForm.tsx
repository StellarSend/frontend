import React from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layers, Plus, Trash2, ChevronRight, AlertTriangle } from 'lucide-react'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { isValidStellarAddress, calculateBatchTotal, MAX_BATCH_RECIPIENTS } from '@/lib/stellar'
import type { BatchPaymentFormValues } from '@/types'

// ─── Validation schema ────────────────────────────────────────────────────────

const recipientSchema = z.object({
  destinationAddress: z
    .string()
    .min(1, 'Required')
    .refine(isValidStellarAddress, 'Invalid Stellar address'),
  amount: z
    .string()
    .min(1, 'Required')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Must be > 0'),
  memo: z.string().max(28).optional().default(''),
})

const batchSchema = z
  .object({
    assetCode: z.string().min(1),
    recipients: z
      .array(recipientSchema)
      .min(1, 'Add at least one recipient')
      .max(MAX_BATCH_RECIPIENTS, `Batch supports at most ${MAX_BATCH_RECIPIENTS} recipients`),
  })
  .superRefine((data, ctx) => {
    const seen = new Map<string, number>()
    data.recipients.forEach((r, idx) => {
      const addr = r.destinationAddress.trim()
      if (!addr) return
      if (seen.has(addr)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Duplicate recipient address in batch',
          path: ['recipients', idx, 'destinationAddress'],
        })
      } else {
        seen.set(addr, idx)
      }
    })
  })

interface BatchFormProps {
  onSubmit: (values: BatchPaymentFormValues) => void
  isLoading?: boolean
  supportedAssets: { code: string; name: string }[]
  defaultValues?: Partial<BatchPaymentFormValues>
  senderPublicKey?: string | null
}

export function BatchForm({
  onSubmit,
  isLoading = false,
  supportedAssets,
  defaultValues,
  senderPublicKey,
}: BatchFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isValid },
  } = useForm<BatchPaymentFormValues>({
    resolver: zodResolver(batchSchema),
    mode: 'onChange',
    defaultValues: {
      assetCode: 'XLM',
      recipients: [{ destinationAddress: '', amount: '', memo: '' }],
      ...defaultValues,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'recipients' })
  const recipients = watch('recipients')
  const assetCode = watch('assetCode')

  const total = calculateBatchTotal(recipients)
  const hasSelfSend =
    senderPublicKey &&
    recipients.some(
      (r) => r.destinationAddress.trim().toUpperCase() === senderPublicKey.trim().toUpperCase(),
    )

  const assetOptions = supportedAssets.map((a) => ({ value: a.code, label: a.code }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers size={18} className="text-stellar-400" />
          Batch / Split Payment
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Select label="Asset" options={assetOptions} fullWidth {...register('assetCode')} />

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-start gap-2 p-3 rounded-xl border border-navy-600/50 bg-navy-900/30"
            >
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="G... recipient address"
                  fullWidth
                  error={errors.recipients?.[index]?.destinationAddress?.message}
                  {...register(`recipients.${index}.destinationAddress` as const)}
                />
                <Input
                  placeholder="Amount"
                  type="number"
                  min="0"
                  step="0.0000001"
                  fullWidth
                  error={errors.recipients?.[index]?.amount?.message}
                  {...register(`recipients.${index}.amount` as const)}
                />
              </div>
              <button
                type="button"
                aria-label={`Remove recipient ${index + 1}`}
                onClick={() => remove(index)}
                disabled={fields.length <= 1}
                className="mt-1 p-2 rounded-lg text-slate-500 hover:text-danger-400 hover:bg-danger-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}

          {typeof errors.recipients?.message === 'string' && (
            <p className="text-xs text-danger-400">{errors.recipients.message}</p>
          )}

          {hasSelfSend && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-warning-500/10 border border-warning-500/20 text-warning-300 text-xs">
              <AlertTriangle size={14} className="shrink-0 text-warning-400" />
              <span>One or more recipients match your connected wallet address (self-send).</span>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => append({ destinationAddress: '', amount: '', memo: '' })}
            disabled={fields.length >= MAX_BATCH_RECIPIENTS}
          >
            Add recipient
          </Button>
        </div>

        <div className="flex items-center justify-between px-1 pt-1 border-t border-navy-700/40">
          <span className="text-sm text-slate-400">Total ({fields.length} recipients)</span>
          <span className="text-lg font-bold text-white tabular-nums">
            {total.toFixed(4)} {assetCode}
          </span>
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={isLoading}
          disabled={!isValid}
          iconRight={<ChevronRight size={18} />}
        >
          Review Batch
        </Button>
      </form>
    </Card>
  )
}
