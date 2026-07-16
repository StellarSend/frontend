import React, { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, ChevronRight, User, Scale } from 'lucide-react'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { isValidStellarAddress } from '@/lib/stellar'
import type { EscrowFormValues } from '@/types'

const minUnlockLocal = () => {
  const d = new Date(Date.now() + 60_000) // at least 1 minute out
  d.setSeconds(0, 0)
  return d.toISOString().slice(0, 16)
}

function buildEscrowSchema(depositorPublicKey: string | null) {
  return z
    .object({
      beneficiaryPublicKey: z
        .string()
        .min(1, 'Beneficiary address is required')
        .refine(isValidStellarAddress, 'Invalid Stellar address'),
      arbiterPublicKey: z
        .string()
        .optional()
        .default('')
        .refine((v) => v === '' || isValidStellarAddress(v), 'Invalid Stellar address'),
      assetCode: z.string().min(1),
      amount: z
        .string()
        .min(1, 'Amount is required')
        .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Amount must be a positive number'),
      unlockDate: z.string().min(1, 'Unlock time is required'),
    })
    .refine((v) => new Date(v.unlockDate).getTime() > Date.now(), {
      message: 'Unlock time must be in the future',
      path: ['unlockDate'],
    })
    .refine(
      (v) =>
        !depositorPublicKey ||
        v.beneficiaryPublicKey === '' ||
        v.beneficiaryPublicKey !== depositorPublicKey,
      {
        message: 'Beneficiary cannot be your own wallet address (self-escrow is not allowed)',
        path: ['beneficiaryPublicKey'],
      },
    )
    .refine(
      (v) =>
        !depositorPublicKey || v.arbiterPublicKey === '' || v.arbiterPublicKey !== depositorPublicKey,
      {
        message: 'Arbiter cannot be your own wallet address',
        path: ['arbiterPublicKey'],
      },
    )
    .refine(
      (v) =>
        v.arbiterPublicKey === '' ||
        v.beneficiaryPublicKey === '' ||
        v.arbiterPublicKey !== v.beneficiaryPublicKey,
      {
        message: 'Arbiter cannot be the same address as the beneficiary',
        path: ['arbiterPublicKey'],
      },
    )
}

interface EscrowFormProps {
  onSubmit: (values: EscrowFormValues) => void
  isLoading?: boolean
  supportedAssets: { code: string; name: string }[]
  depositorPublicKey?: string | null
}

export function EscrowForm({
  onSubmit,
  isLoading = false,
  supportedAssets,
  depositorPublicKey = null,
}: EscrowFormProps) {
  const escrowSchema = useMemo(() => buildEscrowSchema(depositorPublicKey), [depositorPublicKey])

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<EscrowFormValues>({
    resolver: zodResolver(escrowSchema),
    mode: 'onChange',
    defaultValues: {
      beneficiaryPublicKey: '',
      arbiterPublicKey: '',
      assetCode: 'XLM',
      amount: '',
      unlockDate: minUnlockLocal(),
    },
  })

  const assetOptions = supportedAssets.map((a) => ({ value: a.code, label: a.code }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock size={18} className="text-stellar-400" />
          New Escrow
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Input
          label="Beneficiary Stellar Address"
          placeholder="G..."
          error={errors.beneficiaryPublicKey?.message}
          leftIcon={<User size={15} />}
          fullWidth
          {...register('beneficiaryPublicKey')}
        />

        <Input
          label="Arbiter Address (optional)"
          placeholder="G... — can release or refund early on dispute"
          hint="Leave blank if there's no third-party arbiter for this escrow."
          error={errors.arbiterPublicKey?.message}
          leftIcon={<Scale size={15} />}
          fullWidth
          {...register('arbiterPublicKey')}
        />

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
          label="Unlock Time"
          type="datetime-local"
          error={errors.unlockDate?.message}
          hint="The depositor can reclaim funds after this time if they haven't been released."
          fullWidth
          {...register('unlockDate')}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={isLoading}
          disabled={!isValid}
          iconRight={<ChevronRight size={18} />}
        >
          Review Escrow
        </Button>
      </form>
    </Card>
  )
}
