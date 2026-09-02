import { useMutation } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { batchPaymentApi, isNetworkLayerError } from '@/lib/api'
import { buildBatchPaymentTransaction, submitTransaction } from '@/lib/stellar'
import { useWallet } from './useWallet'
import { useSupportedAssets } from './useSendPayment'
import { useInvalidateTransactions } from './useTransactions'
import type { BatchPaymentFormValues, BatchPaymentResult } from '@/types'

export type BatchPaymentStep =
  | 'form'
  | 'review'
  | 'signing'
  | 'submitting'
  | 'success'
  | 'error'

interface BatchPaymentState {
  step: BatchPaymentStep
  formValues: BatchPaymentFormValues | null
  result: BatchPaymentResult | null
  error: string | null
}

export function useBatchPayment() {
  const { publicKey, network, signTransaction, isConnected, refreshAccount } = useWallet()
  const invalidateTxs = useInvalidateTransactions()
  const supportedAssets = useSupportedAssets()

  const [state, setState] = useState<BatchPaymentState>({
    step: 'form',
    formValues: null,
    result: null,
    error: null,
  })

  const totalAmount = state.formValues
    ? state.formValues.recipients.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
    : 0

  const mutation = useMutation<BatchPaymentResult, Error, void>({
    mutationFn: async () => {
      if (!publicKey || !state.formValues) {
        throw new Error('Missing required data to send a batch payment')
      }
      const values = state.formValues
      const asset =
        supportedAssets.find((a) => a.code === values.assetCode) ?? supportedAssets[0]

      setState((s) => ({ ...s, step: 'signing' }))

      const xdr = await buildBatchPaymentTransaction({
        sourcePublicKey: publicKey,
        asset,
        recipients: values.recipients,
        network,
      })

      const signedXdr = await signTransaction(xdr)

      setState((s) => ({ ...s, step: 'submitting' }))

      try {
        return await batchPaymentApi.send({
          sourcePublicKey: publicKey,
          assetCode: asset.code,
          assetIssuer: asset.issuer,
          recipients: values.recipients,
          signedXdr,
        })
      } catch (err) {
        // Only fall back to a direct Horizon submission when the error is a
        // pure network-layer failure (no HTTP response arrived at all).  In
        // that case the backend certainly never received the payload, so
        // resubmitting directly is safe.
        //
        // Errors that *did* receive an HTTP response (4xx validation, 5xx
        // server fault, 502 gateway) are re-thrown unchanged:
        //   - On a 4xx the backend explicitly rejected the payload; pushing
        //     the XDR straight to Horizon would bypass that validation.
        //   - On a 5xx the backend *may* have already broadcast the
        //     transaction; blind resubmission risks a tx_bad_seq confusion
        //     or double-spend on a fresh retry.
        if (!isNetworkLayerError(err)) {
          throw err
        }

        const { hash } = await submitTransaction(signedXdr, network)
        return {
          batchId: hash,
          transactionHash: hash,
          status: 'success',
          recipientCount: values.recipients.length,
          totalAmount: totalAmount.toFixed(7),
          createdAt: new Date().toISOString(),
        }
      }
    },
    onSuccess: (result) => {
      setState((s) => ({ ...s, step: 'success', result, error: null }))
      invalidateTxs()
      refreshAccount()
    },
    onError: (err) => {
      setState((s) => ({
        ...s,
        step: 'error',
        error: err.message || 'Batch payment failed. Please try again.',
      }))
    },
  })

  const reviewBatch = useCallback(
    (values: BatchPaymentFormValues) => {
      if (!isConnected || !publicKey) {
        setState((s) => ({ ...s, error: 'Please connect your wallet first' }))
        return
      }
      setState((s) => ({ ...s, step: 'review', formValues: values, error: null }))
    },
    [isConnected, publicKey],
  )

  const confirmBatch = useCallback(() => {
    mutation.mutate()
  }, [mutation])

  const goBack = useCallback(() => {
    setState((s) => ({ ...s, step: 'form', error: null }))
  }, [])

  const reset = useCallback(() => {
    setState({ step: 'form', formValues: null, result: null, error: null })
    mutation.reset()
  }, [mutation])

  return {
    state,
    reviewBatch,
    confirmBatch,
    goBack,
    reset,
    isSending: mutation.isPending,
    totalAmount,
    supportedAssets,
  }
}
