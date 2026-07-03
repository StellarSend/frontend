import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { escrowApi } from '@/lib/api'
import { useWallet } from './useWallet'
import { useSupportedAssets } from './useSendPayment'
import type { CreateEscrowRequest, Escrow, EscrowFormValues } from '@/types'

export const escrowKeys = {
  all: ['escrows'] as const,
  list: (pubKey: string) => [...escrowKeys.all, 'list', pubKey] as const,
}

// ─── List escrows the wallet is party to (as depositor/beneficiary/arbiter) ──

export function useEscrowList() {
  const { publicKey, isConnected } = useWallet()

  return useQuery<Escrow[], Error>({
    queryKey: escrowKeys.list(publicKey ?? ''),
    queryFn: () => escrowApi.list(publicKey!),
    enabled: isConnected && !!publicKey,
    staleTime: 20_000,
  })
}

// ─── Create flow (form -> review -> signing -> submitting -> success/error) ──

export type CreateEscrowStep = 'form' | 'review' | 'signing' | 'submitting' | 'success' | 'error'

interface CreateEscrowState {
  step: CreateEscrowStep
  formValues: EscrowFormValues | null
  result: Escrow | null
  error: string | null
}

export function useCreateEscrow() {
  const { publicKey, signTransaction, isConnected } = useWallet()
  const queryClient = useQueryClient()
  const supportedAssets = useSupportedAssets()

  const [state, setState] = useState<CreateEscrowState>({
    step: 'form',
    formValues: null,
    result: null,
    error: null,
  })

  const mutation = useMutation<Escrow, Error, void>({
    mutationFn: async () => {
      if (!publicKey || !state.formValues) {
        throw new Error('Missing required data to create an escrow')
      }
      const values = state.formValues
      const asset = supportedAssets.find((a) => a.code === values.assetCode) ?? supportedAssets[0]

      const request: CreateEscrowRequest = {
        depositorPublicKey: publicKey,
        beneficiaryPublicKey: values.beneficiaryPublicKey,
        arbiterPublicKey: values.arbiterPublicKey || null,
        assetCode: asset.code,
        assetIssuer: asset.issuer,
        amount: values.amount,
        unlockTime: new Date(values.unlockDate).toISOString(),
      }

      setState((s) => ({ ...s, step: 'signing' }))
      const built = await escrowApi.buildCreateTransaction(request)
      const signedXdr = await signTransaction(built.xdr)

      setState((s) => ({ ...s, step: 'submitting' }))
      return escrowApi.create({ ...request, signedXdr })
    },
    onSuccess: (result) => {
      setState((s) => ({ ...s, step: 'success', result, error: null }))
      queryClient.invalidateQueries({ queryKey: escrowKeys.all })
    },
    onError: (err) => {
      setState((s) => ({
        ...s,
        step: 'error',
        error: err.message || 'Failed to create escrow',
      }))
    },
  })

  const reviewEscrow = useCallback(
    (values: EscrowFormValues) => {
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
    reviewEscrow,
    confirmCreate,
    goBack,
    reset,
    isSubmitting: mutation.isPending,
    supportedAssets,
  }
}

// ─── Release / refund actions ─────────────────────────────────────────────────

export function useReleaseEscrow() {
  const { signTransaction } = useWallet()
  const queryClient = useQueryClient()

  return useMutation<Escrow, Error, string>({
    mutationFn: async (escrowId: string) => {
      const built = await escrowApi.buildReleaseTransaction(escrowId)
      const signedXdr = await signTransaction(built.xdr)
      return escrowApi.release(escrowId, signedXdr)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: escrowKeys.all })
    },
  })
}

export function useRefundEscrow() {
  const { signTransaction } = useWallet()
  const queryClient = useQueryClient()

  return useMutation<Escrow, Error, string>({
    mutationFn: async (escrowId: string) => {
      const built = await escrowApi.buildRefundTransaction(escrowId)
      const signedXdr = await signTransaction(built.xdr)
      return escrowApi.refund(escrowId, signedXdr)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: escrowKeys.all })
    },
  })
}
