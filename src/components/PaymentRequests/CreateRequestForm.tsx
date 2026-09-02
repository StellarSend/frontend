import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileText, ChevronRight } from 'lucide-react'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import type { PaymentRequestFormValues } from '@/types'

const requestSchema = z.object({
  assetCode: z.string().min(1),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Amount must be a positive number'),
  memo: z.string().max(28, 'Memo must be ≤ 28 characters').optional().default(''),
  memoType: z.enum(['text', 'id']).default('text'),
  expiresInHours: z
    .string()
    .optional()
    .default('')
    .refine((v) => v === '' || (!isNaN(parseFloat(v)) && parseFloat(v) > 0), 'Must be a positive number'),
}).refine(
  (data) => {
    // If memo type is 'id', validate that memo contains only digits and fits in uint64
    if (data.memoType === 'id' && data.memo.trim()) {
      const trimmed = data.memo.trim()
      if (!/^\d+$/.test(trimmed)) {
        return false
      }
      try {
        const bigIntValue = BigInt(trimmed)
        const maxUint64 = BigInt('18446744073709551615')
        if (bigIntValue > maxUint64) {
          return false
        }
      } catch {
        return false
      }
    }
    return true
  },
  {
    message: 'Memo ID must be numeric and not exceed 18446744073709551615',
    path: ['memo'],
  },
)

interface CreateRequestFormProps {
  onSubmit: (values: PaymentRequestFormValues) => void
  isLoading?: boolean
  supportedAssets: { code: string; name: string }[]
}

const expiryOptions = [
  { value: '', label: 'Never' },
  { value: '1', label: '1 hour' },
  { value: '24', label: '1 day' },
  { value: '168', label: '1 week' },
]

export function CreateRequestForm({
  onSubmit,
  isLoading = false,
  supportedAssets,
}: CreateRequestFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<PaymentRequestFormValues>({
    resolver: zodResolver(requestSchema),
    mode: 'onChange',
    defaultValues: {
      assetCode: 'XLM',
      amount: '',
      memo: '',
      memoType: 'text',
      expiresInHours: '',
    },
  })

  const assetOptions = supportedAssets.map((a) => ({ value: a.code, label: a.code }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText size={18} className="text-stellar-400" />
          Request a Payment
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Asset" options={assetOptions} fullWidth {...register('assetCode')} />
          <Input
            label="Amount"
            placeholder="0.0000"
            type="number"
            min="0"
            step="0.0000001"
            error={errors.amount?.message}
            fullWidth
            {...register('amount')}
          />
        </div>

        <Input
          label="Memo (optional)"
          placeholder="Invoice #, reason for payment..."
          hint="Up to 28 characters, shown to the payer."
          error={errors.memo?.message}
          fullWidth
          {...register('memo')}
        />

        <Select
          label="Memo Type"
          options={[
            { value: 'text', label: 'Text' },
            { value: 'id', label: 'ID' },
          ]}
          hint="Text: Any alphanumeric value. ID: Numeric value only."
          fullWidth
          {...register('memoType')}
        />

        <Select
          label="Expires"
          options={expiryOptions}
          hint="After this time the request can no longer be paid."
          fullWidth
          {...register('expiresInHours')}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={isLoading}
          disabled={!isValid}
          iconRight={<ChevronRight size={18} />}
        >
          Create Request
        </Button>
      </form>
    </Card>
  )
}
