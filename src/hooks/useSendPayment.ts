import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { quoteApi, paymentApi } from '@/lib/api'
import {
  buildTransactionFromQuote,
  submitTransaction,
} from '@/lib/stellar'
import { useWallet } from './useWallet'
import { useInvalidateTransactions } from './useTransactions'
import type {
  Quote,
  QuoteRequest,
  SendPaymentResult,
  StellarAsset,
  SendFormValues,
} from '@/types'
import { NATIVE_XLM, USDC_TESTNET, USDC_MAINNET } from '@/types'

// ─── Supported assets ─────────────────────────────────────────────────────────

export function useSupportedAssets(): StellarAsset[] {
  const { network } = useWallet()
  return [NATIVE_XLM, network === 'testnet' ? USDC_TESTNET : USDC_MAINNET]
}

// ─── Send payment state machine ───────────────────────────────────────────────

export type SendStep =
  | 'form'
  | 'quoting'
  | 'review'
  | 'signing'
  | 'submitting'
  | 'success'
  | 'error'

export interface SendPaymentState {
  step: SendStep
  quote: Quote | null
  result: SendPaymentResult | null
  error: string | null
  formValues: SendFormValues | null
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSendPayment() {
  const { publicKey, network, signTransaction, isConnected } = useWallet()
  const queryClient = useQueryClient()
  const invalidateTxs = useInvalidateTransactions()

  const [state, setState] = useState<SendPaymentState>({
    step: 'form',
    quote: null,
    result: null,
    error: null,
    formValues: null,
  })

  const supportedAssets = useSupportedAssets()

  // ── Get quote ──────────────────────────────────────────────────────────────

  const quoteMutation = useMutation<Quote, Error, QuoteRequest>({
    mutationFn: (req) => quoteApi.getQuote(req),
    onSuccess: (quote) => {
      setState((s) => ({ ...s, step: 'review', quote, error: null }))
    },
    onError: (err) => {
      setState((s) => ({
        ...s,
        step: 'error',
        error: err.message || 'Failed to get exchange quote',
      }))
    },
  })

  // ── Submit payment ─────────────────────────────────────────────────────────

  const sendMutation = useMutation<SendPaymentResult, Error, void>({
    mutationFn: async () => {
      if (!state.quote || !publicKey || !state.formValues) {
        throw new Error('Missing required data to send payment')
      }
      const { quote, formValues } = state

      // 1. Build transaction XDR
      setState((s) => ({ ...s, step: 'signing' }))
      const xdr = await buildTransactionFromQuote(
        quote,
        publicKey,
        formValues.destinationAddress,
        network,
        formValues.memo || undefined,
      )

      // 2. Sign with Freighter
      const signedXdr = await signTransaction(xdr)

      // 3. Try backend first, fall back to direct Horizon submit
      setState((s) => ({ ...s, step: 'submitting' }))
      try {
        return await paymentApi.send({
          quoteId: quote.id,
          sourcePublicKey: publicKey,
          destinationAddress: formValues.destinationAddress,
          signedXdr,
          memo: formValues.memo || undefined,
        })
      } catch {
        // Fallback: submit directly to Horizon
        const { hash, ledger } = await submitTransaction(signedXdr, network)
        return {
          transactionHash: hash,
          ledger,
          status: 'success',
          createdAt: new Date().toISOString(),
          fee: quote.networkFee,
        }
      }
    },
    onSuccess: (result) => {
      setState((s) => ({ ...s, step: 'success', result, error: null }))
      invalidateTxs()
      queryClient.invalidateQueries({ queryKey: ['account'] })
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Transaction failed. Please try again.'
      setState((s) => ({ ...s, step: 'error', error: message }))
    },
  })

  // ── Public actions ─────────────────────────────────────────────────────────

  const requestQuote = useCallback(
    (values: SendFormValues) => {
      if (!isConnected || !publicKey) {
        setState((s) => ({ ...s, error: 'Please connect your wallet first' }))
        return
      }

      const sourceAsset =
        supportedAssets.find((a) => a.code === values.sourceAssetCode) ?? NATIVE_XLM
      const destAsset =
        supportedAssets.find((a) => a.code === values.destinationAssetCode) ?? NATIVE_XLM

      setState((s) => ({ ...s, step: 'quoting', formValues: values, error: null }))

      quoteMutation.mutate({
        sourceAsset,
        destinationAsset: destAsset,
        destinationAddress: values.destinationAddress,
        amount: values.amount,
        amountType: values.amountType,
        usePathPayment: values.usePathPayment,
        memo: values.memo || undefined,
      })
    },
    [isConnected, publicKey, supportedAssets, quoteMutation],
  )

  const confirmSend = useCallback(() => {
    sendMutation.mutate()
  }, [sendMutation])

  const reset = useCallback(() => {
    setState({
      step: 'form',
      quote: null,
      result: null,
      error: null,
      formValues: null,
    })
    quoteMutation.reset()
    sendMutation.reset()
  }, [quoteMutation, sendMutation])

  const goBack = useCallback(() => {
    setState((s) => ({
      ...s,
      step: 'form',
      error: null,
    }))
  }, [])

  return {
    state,
    requestQuote,
    confirmSend,
    reset,
    goBack,
    isQuoting: quoteMutation.isPending && state.step === 'quoting',
    isSending:
      sendMutation.isPending &&
      (state.step === 'signing' || state.step === 'submitting'),
    supportedAssets,
  }
}

// ─── Quote refresh hook ───────────────────────────────────────────────────────

export function useRefreshQuote(quoteId: string | null, enabled: boolean) {
  return useQuery<Quote, Error>({
    queryKey: ['quote', quoteId],
    queryFn: () => quoteApi.refreshQuote(quoteId!),
    enabled: enabled && !!quoteId,
    refetchInterval: 15_000, // refresh every 15 seconds
    staleTime: 10_000,
  })
}
