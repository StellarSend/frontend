import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentRequestApi } from '@/lib/api'
import { useWallet } from './useWallet'
import type { CreatePaymentRequestPayload, PaymentRequest, Network } from '@/types'

export const paymentRequestKeys = {
  all: ['payment-requests'] as const,
  list: (pubKey: string, network?: Network) => [...paymentRequestKeys.all, 'list', pubKey, network] as const,
  detail: (id: string, network?: Network) => [...paymentRequestKeys.all, 'detail', id, network] as const,
}

// ─── List requests created by the current wallet ─────────────────────────────

export function usePaymentRequestList() {
  const { publicKey, network, isConnected } = useWallet()

  return useQuery<PaymentRequest[], Error>({
    queryKey: paymentRequestKeys.list(publicKey ?? '', network),
    queryFn: () => paymentRequestApi.list(publicKey!, network),
    enabled: isConnected && !!publicKey,
    staleTime: 30_000,
  })
}

// ─── Fetch a single request by id (used by the "pay this request" view) ──────

export function usePaymentRequest(requestId: string | undefined) {
  const { network } = useWallet()

  return useQuery<PaymentRequest, Error>({
    queryKey: paymentRequestKeys.detail(requestId ?? '', network),
    queryFn: () => paymentRequestApi.get(requestId!, network),
    enabled: !!requestId,
    staleTime: 15_000,
    retry: 1,
  })
}

// ─── Create ───────────────────────────────────────────────────────────────────

export function useCreatePaymentRequest() {
  const { network } = useWallet()
  const queryClient = useQueryClient()

  return useMutation<PaymentRequest, Error, CreatePaymentRequestPayload>({
    mutationFn: (payload) => paymentRequestApi.create({ ...payload, network: payload.network ?? network }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentRequestKeys.all })
    },
  })
}

// ─── Cancel ───────────────────────────────────────────────────────────────────

export function useCancelPaymentRequest() {
  const { network } = useWallet()
  const queryClient = useQueryClient()

  return useMutation<PaymentRequest, Error, string>({
    mutationFn: (requestId) => paymentRequestApi.cancel(requestId, network),
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
