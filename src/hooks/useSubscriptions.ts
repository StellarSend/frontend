import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { subscriptionApi } from '@/lib/api'
import { buildPaymentTransaction } from '@/lib/stellar'
import { useWallet } from './useWallet'
import { useSupportedAssets } from './useSendPayment'
import type { Subscription, SubscriptionFormValues, CreateSubscriptionRequest } from '@/types'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  list: (pubKey: string) => [...subscriptionKeys.all, 'list', pubKey] as const,
}

// ─── List ─────────────────────────────────────────────────────────────────────

export function useSubscriptionList() {
  const { publicKey, isConnected } = useWallet()

  return useQuery<Subscription[], Error>({
    queryKey: subscriptionKeys.list(publicKey ?? ''),
    queryFn: () => subscriptionApi.list(publicKey!),
    enabled: isConnected && !!publicKey,
    staleTime: 30_000,
  })
}

// ─── Create flow (form -> review -> signing -> submitting -> success/error) ──

export type CreateSubscriptionStep =
  | 'form'
  | 'review'
  | 'signing'
  | 'submitting'
  | 'success'
  | 'error'

interface CreateSubscriptionState {
  step: CreateSubscriptionStep
  formValues: SubscriptionFormValues | null
  result: Subscription | null
  error: string | null
}

export function useCreateSubscription() {
  const { publicKey, network, signTransaction, isConnected } = useWallet()
  const queryClient = useQueryClient()
  const supportedAssets = useSupportedAssets()

  const [state, setState] = useState<CreateSubscriptionState>({
    step: 'form',
    formValues: null,
    result: null,
    error: null,
  })

  const mutation = useMutation<Subscription, Error, void>({
    mutationFn: async () => {
      if (!publicKey || !state.formValues) {
        throw new Error('Missing required data to create a subscription')
      }
      const values = state.formValues
      const asset = supportedAssets.find((a) => a.code === values.assetCode) ?? supportedAssets[0]

      const request: CreateSubscriptionRequest = {
        sourcePublicKey: publicKey,
        destinationAddress: values.destinationAddress,
        assetCode: asset.code,
        assetIssuer: asset.issuer,
        amount: values.amount,
        interval: values.interval,
        startDate: values.startDate,
        memo: values.memo || undefined,
      }

      setState((s) => ({ ...s, step: 'signing' }))

      let xdr: string
      try {
        const built = await subscriptionApi.buildCreateTransaction(request)
        xdr = built.xdr
      } catch {
        // Backend not available yet — fall back to building a plain first
        // payment locally so the sign/submit flow can still be exercised.
        xdr = await buildPaymentTransaction({
          sourcePublicKey: publicKey,
          destinationAddress: values.destinationAddress,
          asset,
          amount: values.amount,
          memo: values.memo || undefined,
          network,
        })
      }

      const signedXdr = await signTransaction(xdr)

      setState((s) => ({ ...s, step: 'submitting' }))
      return subscriptionApi.create({ ...request, signedXdr })
    },
    onSuccess: (result) => {
      setState((s) => ({ ...s, step: 'success', result, error: null }))
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
    },
    onError: (err) => {
      setState((s) => ({
        ...s,
        step: 'error',
        error: err.message || 'Failed to create subscription',
      }))
    },
  })

  const reviewSubscription = useCallback(
    (values: SubscriptionFormValues) => {
      if (!isConnected || !publicKey) {
        setState((s) => ({ ...s, error: 'Please connect your wallet first' }))
        return
      }
      setState((s) => ({ ...s, step: 'review', formValues: values, error: null }))
    },
    [isConnected, publicKey],
  )

  const confirmCreate = useCallback(() => {
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
    reviewSubscription,
    confirmCreate,
    goBack,
    reset,
    isSubmitting: mutation.isPending,
    supportedAssets,
  }
}

// ─── Cancel ───────────────────────────────────────────────────────────────────

export function useCancelSubscription() {
  const { signTransaction } = useWallet()
  const queryClient = useQueryClient()

  return useMutation<Subscription, Error, string>({
    mutationFn: async (subscriptionId: string) => {
      // Some cancellations require an on-chain authorization (e.g. revoking a
      // pre-signed standing order); others are purely a backend-side flag
      // flip. Try the build step, but proceed without a signature if the
      // backend says none is needed.
      let signedXdr: string | undefined
      try {
        const built = await subscriptionApi.buildCancelTransaction(subscriptionId)
        if (built?.xdr) {
          signedXdr = await signTransaction(built.xdr)
        }
      } catch {
        signedXdr = undefined
      }
      return subscriptionApi.cancel(subscriptionId, signedXdr)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
    },
  })
}
