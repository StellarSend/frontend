import { useWalletContext } from '@/context/WalletContext'
import type { WalletState } from '@/types'

/**
 * Primary hook for interacting with the Freighter wallet.
 *
 * Returns all wallet state plus connect / disconnect / sign helpers.
 */
export function useWallet() {
  const { wallet, connect, disconnect, refreshAccount, setNetwork, signTransaction } =
    useWalletContext()

  const isConnected = wallet.status === 'connected'
  const isConnecting = wallet.status === 'connecting'
  const hasError = wallet.status === 'error'

  const xlmBalance = wallet.account?.balances.find(
    (b) => b.asset.code === 'XLM',
  )?.balance ?? null

  const usdcBalance = wallet.account?.balances.find(
    (b) => b.asset.code === 'USDC',
  )?.balance ?? null

  return {
    // State
    wallet,
    publicKey: wallet.publicKey,
    network: wallet.network,
    account: wallet.account,
    isConnected,
    isConnecting,
    hasError,
    error: wallet.error,
    isFreighterInstalled: wallet.isFreighterInstalled,

    // Derived balances
    xlmBalance,
    usdcBalance,

    // Actions
    connect,
    disconnect,
    refreshAccount,
    setNetwork,
    signTransaction,
  } satisfies {
    wallet: WalletState
    publicKey: string | null
    network: 'testnet' | 'mainnet'
    account: WalletState['account']
    isConnected: boolean
    isConnecting: boolean
    hasError: boolean
    error: string | null
    isFreighterInstalled: boolean
    xlmBalance: string | null
    usdcBalance: string | null
    connect: () => Promise<void>
    disconnect: () => void
    refreshAccount: () => Promise<void>
    setNetwork: (n: 'testnet' | 'mainnet') => void
    signTransaction: (xdr: string) => Promise<string>
  }
}
