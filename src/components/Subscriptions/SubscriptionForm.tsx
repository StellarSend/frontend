import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Repeat, ChevronRight, User } from 'lucide-react'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { isValidStellarAddress } from '@/lib/stellar'
import type { SubscriptionFormValues } from '@/types'

// ─── Validation schema ────────────────────────────────────────────────────────

const todayISODate = () => new Date().toISOString().slice(0, 10)

const subscriptionSchema = z.object({
  destinationAddress: z
    .string()
    .min(1, 'Recipient address is required')
    .refine(isValidStellarAddress, 'Invalid Stellar address'),
  assetCode: z.string().min(1),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Amount must be a positive number'),
  interval: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  startDate: z
    .string()
    .min(1, 'Start date is required')
    .refine((v) => v >= todayISODate(), 'Start date cannot be in the past'),
  memo: z.string().max(28, 'Memo must be ≤ 28 characters').optional().default(''),
})

interface SubscriptionFormProps {
  onSubmit: (values: SubscriptionFormValues) => void
  isLoading?: boolean
  supportedAssets: { code: string; name: string }[]
  defaultValues?: Partial<SubscriptionFormValues>
}

const intervalOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

export function SubscriptionForm({
  onSubmit,
  isLoading = false,
  supportedAssets,
  defaultValues,
}: SubscriptionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    mode: 'onChange',
    defaultValues: {
      destinationAddress: '',
      assetCode: 'XLM',
      amount: '',
      interval: 'monthly',
      startDate: todayISODate(),
      memo: '',
      ...defaultValues,
    },
  })

  const assetOptions = supportedAssets.map((a) => ({ value: a.code, label: a.code }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat size={18} className="text-stellar-400" />
          New Recurring Payment
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Input
          label="Recipient Stellar Address"
          placeholder="G..."
          error={errors.destinationAddress?.message}
          leftIcon={<User size={15} />}
          fullWidth
          {...register('destinationAddress')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Asset"
            options={assetOptions}
            fullWidth
            {...register('assetCode')}
          />
          <Input
            label="Amount per payment"
            placeholder="0.0000"
            type="number"
            min="0"
            step="0.0000001"
            error={errors.amount?.message}
            fullWidth
            {...register('amount')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Repeats"
            options={intervalOptions}
            fullWidth
            {...register('interval')}
          />
          <Input
            label="Start date"
            type="date"
            min={todayISODate()}
            error={errors.startDate?.message}
            fullWidth
            {...register('startDate')}
          />
        </div>

        <Input
          label="Memo (optional)"
          placeholder="Payment reference, ID, or note"
          hint="Up to 28 characters. Applied to every scheduled run."
          error={errors.memo?.message}
          fullWidth
          {...register('memo')}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={isLoading}
          disabled={!isValid}
          iconRight={<ChevronRight size={18} />}
        >
          Review Subscription
        </Button>
      </form>
    </Card>
  )
}
