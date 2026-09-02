import React from 'react'
import { act, renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WalletProvider, useWalletContext } from '@/context/WalletContext'
import { useWallet } from './useWallet'
import { USDC_TESTNET, USDC_MAINNET } from '@/types'

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

const PUBLIC_KEY = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
const SCAM_ISSUER = 'GAFAKEISSUERDONOTTRUSTXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'

function renderUseWallet() {
  return renderHook(() => useWallet(), {
    wrapper: ({ children }) => <WalletProvider>{children}</WalletProvider>,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  freighterMocks.isConnected.mockResolvedValue(true)
  freighterMocks.setAllowed.mockResolvedValue(true)
  freighterMocks.getPublicKey.mockResolvedValue(PUBLIC_KEY)
  freighterMocks.getUserInfo.mockResolvedValue({ publicKey: PUBLIC_KEY })
})

describe('useWallet balance resolution with issuer checks (#49)', () => {
  it('correctly identifies native XLM (issuer: null) and ignores spoofed XLM custom asset even when it appears first', async () => {
    apiMocks.fetchAccountFromHorizon.mockResolvedValue({
      publicKey: PUBLIC_KEY,
      sequence: '1',
      balances: [
        {
          asset: {
            code: 'XLM',
            issuer: SCAM_ISSUER,
            name: 'Spoofed XLM',
            decimals: 7,
          },
          balance: '9999999.00',
          buyingLiabilities: '0',
          sellingLiabilities: '0',
        },
        {
          asset: {
            code: 'XLM',
            issuer: null,
            name: 'Stellar Lumens',
            decimals: 7,
          },
          balance: '125.5000000',
          buyingLiabilities: '0',
          sellingLiabilities: '0',
        },
      ],
      subentryCount: 2,
      thresholds: { lowThreshold: 0, medThreshold: 0, highThreshold: 0 },
      flags: { authRequired: false, authRevocable: false, authImmutable: false },
      lastModifiedLedger: 1,
    })

    const view = renderUseWallet()
    await act(async () => {
      await view.result.current.connect()
    })

    expect(view.result.current.xlmBalance).toBe('125.5000000')
  })

  it('correctly matches USDC by pinned issuer for current network and ignores spoofed USDC', async () => {
    apiMocks.fetchAccountFromHorizon.mockResolvedValue({
      publicKey: PUBLIC_KEY,
      sequence: '1',
      balances: [
        {
          asset: {
            code: 'USDC',
            issuer: SCAM_ISSUER,
            name: 'Fake USD Coin',
            decimals: 7,
          },
          balance: '50000.00',
          buyingLiabilities: '0',
          sellingLiabilities: '0',
        },
        {
          asset: {
            code: 'USDC',
            issuer: USDC_TESTNET.issuer,
            name: 'USD Coin',
            decimals: 7,
          },
          balance: '42.75',
          buyingLiabilities: '0',
          sellingLiabilities: '0',
        },
      ],
      subentryCount: 2,
      thresholds: { lowThreshold: 0, medThreshold: 0, highThreshold: 0 },
      flags: { authRequired: false, authRevocable: false, authImmutable: false },
      lastModifiedLedger: 1,
    })

    const view = renderUseWallet()
    await act(async () => {
      await view.result.current.connect()
    })

    // On testnet
    expect(view.result.current.network).toBe('testnet')
    expect(view.result.current.usdcBalance).toBe('42.75')
  })

  it('correctly matches mainnet USDC when network is switched to mainnet', async () => {
    apiMocks.fetchAccountFromHorizon.mockResolvedValue({
      publicKey: PUBLIC_KEY,
      sequence: '1',
      balances: [
        {
          asset: {
            code: 'USDC',
            issuer: USDC_TESTNET.issuer,
            name: 'Testnet USDC on Mainnet (should not match)',
            decimals: 7,
          },
          balance: '10.00',
          buyingLiabilities: '0',
          sellingLiabilities: '0',
        },
        {
          asset: {
            code: 'USDC',
            issuer: USDC_MAINNET.issuer,
            name: 'USD Coin',
            decimals: 7,
          },
          balance: '100.00',
          buyingLiabilities: '0',
          sellingLiabilities: '0',
        },
      ],
      subentryCount: 2,
      thresholds: { lowThreshold: 0, medThreshold: 0, highThreshold: 0 },
      flags: { authRequired: false, authRevocable: false, authImmutable: false },
      lastModifiedLedger: 1,
    })

    const view = renderUseWallet()
    await act(async () => {
      await view.result.current.connect()
      view.result.current.setNetwork('mainnet')
    })

    expect(view.result.current.network).toBe('mainnet')
    expect(view.result.current.usdcBalance).toBe('100.00')
  })
})
