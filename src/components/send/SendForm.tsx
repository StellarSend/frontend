import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Send,
  ArrowRightLeft,
  Info,
  ChevronRight,
  User,
} from 'lucide-react'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { isValidStellarAddress } from '@/lib/stellar'
import type { SendFormValues } from '@/types'

// ─── Validation schema ────────────────────────────────────────────────────────

const sendSchema = z.object({
  destinationAddress: z
    .string()
    .min(1, 'Destination address is required')
    .refine(isValidStellarAddress, 'Invalid Stellar address'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine(
      (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
      'Amount must be a positive number',
    )
    .refine(
      (v) => parseFloat(v) >= 0.0000001,
      'Amount must be at least 0.0000001',
    ),
  sourceAssetCode: z.string().min(1),
  destinationAssetCode: z.string().min(1),
  amountType: z.enum(['send', 'receive']),
  usePathPayment: z.boolean(),
  memo: z.string().max(28, 'Memo must be ≤ 28 characters').optional().default(''),
})

// ─── Props ────────────────────────────────────────────────────────────────────

interface SendFormProps {
  onSubmit: (values: SendFormValues) => void
  isLoading?: boolean
  supportedAssets: { code: string; name: string }[]
  defaultValues?: Partial<SendFormValues>
}

export function SendForm({
  onSubmit,
  isLoading = false,
  supportedAssets,
  defaultValues,
}: SendFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isValid },
  } = useForm<SendFormValues>({
    resolver: zodResolver(sendSchema),
    mode: 'onChange',
    defaultValues: {
      destinationAddress: '',
      amount: '',
      sourceAssetCode: 'XLM',
      destinationAssetCode: 'XLM',
      amountType: 'send',
      usePathPayment: false,
      memo: '',
      ...defaultValues,
    },
  })

  const sourceAsset = watch('sourceAssetCode')
  const destAsset = watch('destinationAssetCode')
  const usePathPayment = watch('usePathPayment')
  const amountType = watch('amountType')

  const assetOptions = supportedAssets.map((a) => ({ value: a.code, label: a.code }))

  const swapAssets = () => {
    setValue('sourceAssetCode', destAsset)
    setValue('destinationAssetCode', sourceAsset)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send size={18} className="text-stellar-400" />
          Send Money
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Destination */}
        <Input
          label="Recipient Stellar Address"
          placeholder="G..."
          error={errors.destinationAddress?.message}
          leftIcon={<User size={15} />}
          fullWidth
          {...register('destinationAddress')}
        />

        {/* Asset selection + amount */}
        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Select
                label="From"
                options={assetOptions}
                fullWidth
                {...register('sourceAssetCode')}
              />
            </div>

            <button
              type="button"
              onClick={swapAssets}
              className="mb-0.5 p-2.5 rounded-xl bg-navy-700 border border-navy-600 hover:border-stellar-500/40 hover:bg-navy-600 text-slate-400 hover:text-stellar-400 transition-all"
              title="Swap assets"
            >
              <ArrowRightLeft size={16} />
            </button>

            <div className="flex-1">
              <Select
                label="To"
                options={assetOptions}
                fullWidth
                {...register('destinationAssetCode')}
              />
            </div>
          </div>

          {/* Amount + type toggle */}
          <div className="relative">
            <Input
              label={amountType === 'send' ? 'You Send' : 'They Receive'}
              placeholder="0.0000"
              type="number"
              min="0"
              step="0.0000001"
              error={errors.amount?.message}
              fullWidth
              rightElement={
                <div className="flex">
                  <button
                    type="button"
                    onClick={() =>
                      setValue('amountType', amountType === 'send' ? 'receive' : 'send')
                    }
                    className="text-xs text-stellar-400 hover:text-stellar-300 font-medium px-2 py-1 rounded-lg hover:bg-stellar-500/10 transition-all"
                  >
                    {amountType === 'send' ? '⇌ receive' : '⇌ send'}
                  </button>
                </div>
              }
              {...register('amount')}
            />
          </div>
        </div>

        {/* Path payment toggle */}
        <Controller
          control={control}
          name="usePathPayment"
          render={({ field }) => (
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-navy-600/50 bg-navy-900/30 cursor-pointer hover:border-stellar-500/30 transition-all group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-navy-700 border border-navy-600 rounded-full peer-checked:bg-stellar-600 peer-checked:border-stellar-500 transition-all" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-slate-400 rounded-full peer-checked:translate-x-4 peer-checked:bg-white transition-all" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                  Use Path Payment
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automatically finds the best exchange rate across Stellar's DEX
                </p>
              </div>
            </label>
          )}
        />

        {/* Memo (optional) */}
        <Input
          label="Memo (optional)"
          placeholder="Payment reference, ID, or note"
          hint="Up to 28 characters. Required by some exchanges."
          error={errors.memo?.message}
          fullWidth
          {...register('memo')}
        />

        {/* Path payment info */}
        {usePathPayment && sourceAsset !== destAsset && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-stellar-500/8 border border-stellar-500/20">
            <Info size={15} className="text-stellar-400 mt-0.5 shrink-0" />
            <p className="text-xs text-stellar-300">
              Path payments route your {sourceAsset} through the Stellar DEX to deliver{' '}
              {destAsset} to the recipient. A small slippage tolerance (0.5%) is applied.
            </p>
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={isLoading}
          disabled={!isValid}
          iconRight={<ChevronRight size={18} />}
        >
          {isLoading ? 'Getting Quote...' : 'Get Quote & Review'}
        </Button>
      </form>
    </Card>
  )
}
