import React from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const freighterMocks = vi.hoisted(() => ({
  isConnected: vi.fn(),
  isAllowed: vi.fn(),
  getPublicKey: vi.fn(),
  getUserInfo: vi.fn(),
  setAllowed: vi.fn(),
  signTransaction: vi.fn(),
}))

vi.mock('@stellar/freighter-api', () => freighterMocks)

const apiMocks = vi.hoisted(() => ({
  fetchAccountFromHorizon: vi.fn(),
}))

vi.mock('@/lib/api', () => apiMocks)

import { WalletProvider, useWalletContext, WALLET_POLL_INTERVAL_MS } from './WalletContext'

const PUBLIC_KEY_A = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
const PUBLIC_KEY_B = 'GDRREYWHQWJDICNH4SAH4TT2JPVYWIX6JEWAHE2W6BZDJBIJ4VSX227Z'

function mockAccount(publicKey: string) {
  return {
    publicKey,
    sequence: '1',
    balances: [],
    subentryCount: 0,
    thresholds: { lowThreshold: 0, medThreshold: 0, highThreshold: 0 },
    flags: { authRequired: false, authRevocable: false, authImmutable: false },
    lastModifiedLedger: 1,
  }
}

function renderWallet() {
  return renderHook(() => useWalletContext(), {
    wrapper: ({ children }) => <WalletProvider>{children}</WalletProvider>,
  })
}

async function connectWallet(publicKey = PUBLIC_KEY_A) {
  freighterMocks.isConnected.mockResolvedValue(true)
  freighterMocks.setAllowed.mockResolvedValue(true)
  freighterMocks.getPublicKey.mockResolvedValue(publicKey)
  freighterMocks.getUserInfo.mockResolvedValue({ publicKey })

  const view = renderWallet()
  await act(async () => {
    await view.result.current.connect()
  })
  return view
}

beforeEach(() => {
  vi.clearAllMocks()
  apiMocks.fetchAccountFromHorizon.mockResolvedValue(mockAccount(PUBLIC_KEY_A))
})

describe('WalletProvider connect/disconnect', () => {
  it('connect() transitions to connected with the Freighter public key', async () => {
    const { result } = await connectWallet(PUBLIC_KEY_A)
    expect(result.current.wallet.status).toBe('connected')
    expect(result.current.wallet.publicKey).toBe(PUBLIC_KEY_A)
  })

  it('disconnect() clears publicKey and account', async () => {
    const { result } = await connectWallet(PUBLIC_KEY_A)
    act(() => {
      result.current.disconnect()
    })
    expect(result.current.wallet.status).toBe('disconnected')
    expect(result.current.wallet.publicKey).toBeNull()
    expect(result.current.wallet.account).toBeNull()
  })
})

describe('setNetwork', () => {
  it('synchronously clears the stale account and refetches for the new network', async () => {
    const { result } = await connectWallet(PUBLIC_KEY_A)

    await waitFor(() => expect(result.current.wallet.account).not.toBeNull())
    expect(apiMocks.fetchAccountFromHorizon).toHaveBeenCalledWith(PUBLIC_KEY_A, 'testnet')

    let resolveFetch!: (value: ReturnType<typeof mockAccount>) => void
    apiMocks.fetchAccountFromHorizon.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve
      }),
    )

    act(() => {
      result.current.setNetwork('mainnet')
    })

    // Cleared immediately, before the new network's fetch resolves - no
    // flash of the previous network's balances under the new label.
    expect(result.current.wallet.network).toBe('mainnet')
    expect(result.current.wallet.account).toBeNull()
    expect(apiMocks.fetchAccountFromHorizon).toHaveBeenCalledWith(PUBLIC_KEY_A, 'mainnet')

    await act(async () => {
      resolveFetch(mockAccount(PUBLIC_KEY_A))
    })
    await waitFor(() => expect(result.current.wallet.account).not.toBeNull())
  })
})

// Uses real timers rather than vi.useFakeTimers(): advancing a faked clock
// deadlocked React's own effect scheduling in this setup, whereas the actual
// WALLET_POLL_INTERVAL_MS (3s) is short enough to just wait out for real.
describe('Freighter account-drift polling', () => {
  it('transitions to a "please reconnect" state when Freighter reports a different public key', async () => {
    const { result } = await connectWallet(PUBLIC_KEY_A)
    expect(result.current.wallet.status).toBe('connected')

    freighterMocks.getPublicKey.mockResolvedValue(PUBLIC_KEY_B)

    await waitFor(
      () => expect(result.current.wallet.status).toBe('error'),
      { timeout: WALLET_POLL_INTERVAL_MS + 2_000, interval: 200 },
    )

    expect(result.current.wallet.publicKey).toBeNull()
    expect(result.current.wallet.account).toBeNull()
    expect(result.current.wallet.error).toMatch(/reconnect/i)
  }, WALLET_POLL_INTERVAL_MS + 5_000)

  it('does not change state while Freighter keeps reporting the same public key', async () => {
    const { result } = await connectWallet(PUBLIC_KEY_A)
    expect(result.current.wallet.status).toBe('connected')

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, WALLET_POLL_INTERVAL_MS + 500))
    })

    expect(result.current.wallet.status).toBe('connected')
    expect(result.current.wallet.publicKey).toBe(PUBLIC_KEY_A)
  }, WALLET_POLL_INTERVAL_MS + 5_000)

  it('ignores transient Freighter errors instead of disconnecting', async () => {
    const { result } = await connectWallet(PUBLIC_KEY_A)
    expect(result.current.wallet.status).toBe('connected')

    freighterMocks.getPublicKey.mockRejectedValueOnce(new Error('Freighter is locked'))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, WALLET_POLL_INTERVAL_MS + 500))
    })

    expect(result.current.wallet.status).toBe('connected')
    expect(result.current.wallet.publicKey).toBe(PUBLIC_KEY_A)
  }, WALLET_POLL_INTERVAL_MS + 5_000)
})
