import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { fetchTransactionsFromHorizon } from '@/lib/api'
import { useWallet } from './useWallet'
import type { TransactionFilters, TransactionPage } from '@/types'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const txKeys = {
  all: ['transactions'] as const,
  // `limit` must be part of the key: useRecentTransactions' queryFn depends
  // on it, and without it here every call for the same wallet — regardless
  // of what limit was requested — collides on one shared cache entry (#51).
  list: (pubKey: string, limit: number, filters?: TransactionFilters) =>
    [...txKeys.all, 'list', pubKey, limit, filters] as const,
  infinite: (pubKey: string, filters?: TransactionFilters) =>
    [...txKeys.all, 'infinite', pubKey, filters] as const,
  detail: (hash: string) => [...txKeys.all, 'detail', hash] as const,
}

// ─── Recent transactions (first page) ────────────────────────────────────────

export function useRecentTransactions(limit = 5) {
  const { publicKey, network, isConnected } = useWallet()

  return useQuery<TransactionPage, Error>({
    queryKey: txKeys.list(publicKey ?? '', limit, { direction: undefined }),
    queryFn: () =>
      fetchTransactionsFromHorizon(publicKey!, network, limit),
    enabled: isConnected && !!publicKey,
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: 2,
  })
}

// ─── Infinite / paginated transactions ───────────────────────────────────────

export function useTransactions(filters?: TransactionFilters) {
  const { publicKey, network, isConnected } = useWallet()

  return useInfiniteQuery<TransactionPage, Error>({
    queryKey: txKeys.infinite(publicKey ?? '', filters),
    queryFn: ({ pageParam }) =>
      fetchTransactionsFromHorizon(
        publicKey!,
        network,
        20,
        typeof pageParam === 'string' ? pageParam : undefined,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.cursor : undefined,
    initialPageParam: undefined as string | undefined,
    enabled: isConnected && !!publicKey,
    staleTime: 30_000,
    retry: 2,
  })
}

// ─── Invalidate / refetch helper ──────────────────────────────────────────────

export function useInvalidateTransactions() {
  const queryClient = useQueryClient()
  const { publicKey } = useWallet()

  return () => {
    if (!publicKey) return
    queryClient.invalidateQueries({ queryKey: txKeys.all })
  }
}
