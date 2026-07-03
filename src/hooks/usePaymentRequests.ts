import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentRequestApi } from '@/lib/api'
import { useWallet } from './useWallet'
import type { CreatePaymentRequestPayload, PaymentRequest } from '@/types'

export const paymentRequestKeys = {
  all: ['payment-requests'] as const,
  list: (pubKey: string) => [...paymentRequestKeys.all, 'list', pubKey] as const,
  detail: (id: string) => [...paymentRequestKeys.all, 'detail', id] as const,
}

// ─── List requests created by the current wallet ─────────────────────────────

export function usePaymentRequestList() {
  const { publicKey, isConnected } = useWallet()

  return useQuery<PaymentRequest[], Error>({
    queryKey: paymentRequestKeys.list(publicKey ?? ''),
    queryFn: () => paymentRequestApi.list(publicKey!),
    enabled: isConnected && !!publicKey,
    staleTime: 30_000,
  })
}

// ─── Fetch a single request by id (used by the "pay this request" view) ──────

export function usePaymentRequest(requestId: string | undefined) {
  return useQuery<PaymentRequest, Error>({
    queryKey: paymentRequestKeys.detail(requestId ?? ''),
    queryFn: () => paymentRequestApi.get(requestId!),
    enabled: !!requestId,
    staleTime: 15_000,
    retry: 1,
  })
}

// ─── Create ───────────────────────────────────────────────────────────────────

export function useCreatePaymentRequest() {
  const queryClient = useQueryClient()

  return useMutation<PaymentRequest, Error, CreatePaymentRequestPayload>({
    mutationFn: (payload) => paymentRequestApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentRequestKeys.all })
    },
  })
}

// ─── Cancel ───────────────────────────────────────────────────────────────────

export function useCancelPaymentRequest() {
  const queryClient = useQueryClient()

  return useMutation<PaymentRequest, Error, string>({
    mutationFn: (requestId) => paymentRequestApi.cancel(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentRequestKeys.all })
    },
  })
}

// ─── Shareable link helper ────────────────────────────────────────────────────

export function buildPaymentRequestLink(requestId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/pay/${requestId}`
}
