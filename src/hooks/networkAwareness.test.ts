import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { escrowKeys, useEscrowList } from './useEscrows'
import { subscriptionKeys, useSubscriptionList } from './useSubscriptions'
import { paymentRequestKeys, usePaymentRequestList, usePaymentRequest } from './usePaymentRequests'
import { escrowApi, subscriptionApi, paymentRequestApi } from '@/lib/api'

const walletState = {
  publicKey: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  network: 'testnet' as 'testnet' | 'mainnet',
  isConnected: true,
  signTransaction: vi.fn(),
}

vi.mock('./useWallet', () => ({
  useWallet: () => ({
    publicKey: walletState.publicKey,
    network: walletState.network,
    isConnected: walletState.isConnected,
    signTransaction: walletState.signTransaction,
  }),
}))

vi.mock('@/lib/api', () => ({
  escrowApi: {
    list: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue({ id: 'esc-1' }),
    buildCreateTransaction: vi.fn().mockResolvedValue({ xdr: 'AAAA', fee: '100' }),
    create: vi.fn().mockResolvedValue({ id: 'esc-1' }),
    buildReleaseTransaction: vi.fn().mockResolvedValue({ xdr: 'AAAA', fee: '100' }),
    release: vi.fn().mockResolvedValue({ id: 'esc-1' }),
    buildRefundTransaction: vi.fn().mockResolvedValue({ xdr: 'AAAA', fee: '100' }),
    refund: vi.fn().mockResolvedValue({ id: 'esc-1' }),
  },
  subscriptionApi: {
    list: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue({ id: 'sub-1' }),
    buildCreateTransaction: vi.fn().mockResolvedValue({ xdr: 'AAAA', fee: '100' }),
    create: vi.fn().mockResolvedValue({ id: 'sub-1' }),
    buildCancelTransaction: vi.fn().mockResolvedValue({ xdr: 'AAAA', fee: '100' }),
    cancel: vi.fn().mockResolvedValue({ id: 'sub-1' }),
  },
  paymentRequestApi: {
    list: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue({ id: 'pr-1' }),
    create: vi.fn().mockResolvedValue({ id: 'pr-1' }),
    cancel: vi.fn().mockResolvedValue({ id: 'pr-1' }),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Network-aware Query Keys', () => {
  const pubKey = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'

  it('generates different escrow list keys for testnet and mainnet', () => {
    const testnetKey = escrowKeys.list(pubKey, 'testnet')
    const mainnetKey = escrowKeys.list(pubKey, 'mainnet')
    expect(testnetKey).not.toEqual(mainnetKey)
    expect(testnetKey).toEqual(['escrows', 'list', pubKey, 'testnet'])
    expect(mainnetKey).toEqual(['escrows', 'list', pubKey, 'mainnet'])
  })

  it('generates different subscription list keys for testnet and mainnet', () => {
    const testnetKey = subscriptionKeys.list(pubKey, 'testnet')
    const mainnetKey = subscriptionKeys.list(pubKey, 'mainnet')
    expect(testnetKey).not.toEqual(mainnetKey)
    expect(testnetKey).toEqual(['subscriptions', 'list', pubKey, 'testnet'])
    expect(mainnetKey).toEqual(['subscriptions', 'list', pubKey, 'mainnet'])
  })

  it('generates different payment request list and detail keys for testnet and mainnet', () => {
    const testnetListKey = paymentRequestKeys.list(pubKey, 'testnet')
    const mainnetListKey = paymentRequestKeys.list(pubKey, 'mainnet')
    expect(testnetListKey).not.toEqual(mainnetListKey)
    expect(testnetListKey).toEqual(['payment-requests', 'list', pubKey, 'testnet'])
    expect(mainnetListKey).toEqual(['payment-requests', 'list', pubKey, 'mainnet'])

    const testnetDetailKey = paymentRequestKeys.detail('req-1', 'testnet')
    const mainnetDetailKey = paymentRequestKeys.detail('req-1', 'mainnet')
    expect(testnetDetailKey).not.toEqual(mainnetDetailKey)
    expect(testnetDetailKey).toEqual(['payment-requests', 'detail', 'req-1', 'testnet'])
    expect(mainnetDetailKey).toEqual(['payment-requests', 'detail', 'req-1', 'mainnet'])
  })
})

describe('Network-aware Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    walletState.network = 'testnet'
    walletState.isConnected = true
  })

  it('useEscrowList calls escrowApi.list with publicKey and current network', async () => {
    walletState.network = 'testnet'
    const { result } = renderHook(() => useEscrowList(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(escrowApi.list).toHaveBeenCalledWith(walletState.publicKey, 'testnet')
  })

  it('useSubscriptionList calls subscriptionApi.list with publicKey and current network', async () => {
    walletState.network = 'mainnet'
    const { result } = renderHook(() => useSubscriptionList(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(subscriptionApi.list).toHaveBeenCalledWith(walletState.publicKey, 'mainnet')
  })

  it('usePaymentRequestList calls paymentRequestApi.list with publicKey and current network', async () => {
    walletState.network = 'testnet'
    const { result } = renderHook(() => usePaymentRequestList(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(paymentRequestApi.list).toHaveBeenCalledWith(walletState.publicKey, 'testnet')
  })

  it('usePaymentRequest calls paymentRequestApi.get with requestId and current network', async () => {
    walletState.network = 'mainnet'
    const { result } = renderHook(() => usePaymentRequest('req-123'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(paymentRequestApi.get).toHaveBeenCalledWith('req-123', 'mainnet')
  })
})
