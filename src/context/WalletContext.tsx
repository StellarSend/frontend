import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react'
import {
  getPublicKey,
  isConnected,
  isAllowed,
  getUserInfo,
  setAllowed,
} from '@stellar/freighter-api'
import type { Network, WalletState, AccountInfo } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'
import { fetchAccountFromHorizon } from '@/lib/api'

// ─── State & Actions ─────────────────────────────────────────────────────────

type WalletAction =
  | { type: 'SET_CONNECTING' }
  | { type: 'SET_CONNECTED'; publicKey: string }
  | { type: 'SET_DISCONNECTED' }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'SET_ACCOUNT'; account: AccountInfo | null }
  | { type: 'SET_FREIGHTER_INSTALLED'; installed: boolean }
  | { type: 'SET_NETWORK'; network: Network }
  | { type: 'WALLET_CHANGED'; error: string }

function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'SET_CONNECTING':
      return { ...state, status: 'connecting', error: null }
    case 'SET_CONNECTED':
      return { ...state, status: 'connected', publicKey: action.publicKey, error: null }
    case 'SET_DISCONNECTED':
      return { ...state, status: 'disconnected', publicKey: null, account: null, error: null }
    case 'SET_ERROR':
      return { ...state, status: 'error', error: action.error }
    case 'SET_ACCOUNT':
      return { ...state, account: action.account }
    case 'SET_FREIGHTER_INSTALLED':
      return { ...state, isFreighterInstalled: action.installed }
    case 'SET_NETWORK':
      return { ...state, network: action.network }
    case 'WALLET_CHANGED':
      // Freighter's active account changed underneath us - the publicKey
      // we've been holding is stale, so clear it rather than risk building
      // or signing a transaction against the wrong account.
      return {
        ...state,
        status: 'error',
        publicKey: null,
        account: null,
        error: action.error,
      }
    default:
      return state
  }
}

const initialState: WalletState = {
  status: 'disconnected',
  publicKey: null,
  network: DEFAULT_SETTINGS.network,
  account: null,
  isFreighterInstalled: false,
  error: null,
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface WalletContextValue {
  wallet: WalletState
  connect: () => Promise<void>
  disconnect: () => void
  refreshAccount: () => Promise<void>
  setNetwork: (network: Network) => void
  signTransaction: (xdr: string) => Promise<string>
}

const WalletContext = createContext<WalletContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, dispatch] = useReducer(walletReducer, initialState)
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load persisted network preference
  useEffect(() => {
    const saved = localStorage.getItem('stellarsend_network') as Network | null
    if (saved === 'testnet' || saved === 'mainnet') {
      dispatch({ type: 'SET_NETWORK', network: saved })
    }
  }, [])

  // Detect Freighter on mount
  useEffect(() => {
    const detect = async () => {
      try {
        const connected = await isConnected()
        dispatch({ type: 'SET_FREIGHTER_INSTALLED', installed: true })

        if (connected) {
          const allowed = await isAllowed()
          if (allowed) {
            const pubKey = await getPublicKey()
            if (pubKey) {
              dispatch({ type: 'SET_CONNECTED', publicKey: pubKey })
            }
          }
        }
      } catch {
        dispatch({ type: 'SET_FREIGHTER_INSTALLED', installed: false })
      }
    }
    detect()
  }, [])

  // Auto-refresh account info when connected
  const refreshAccount = useCallback(async () => {
    if (!wallet.publicKey) return
    try {
      const account = await fetchAccountFromHorizon(wallet.publicKey, wallet.network)
      dispatch({ type: 'SET_ACCOUNT', account })
    } catch (err) {
      console.warn('Failed to refresh account:', err)
    }
  }, [wallet.publicKey, wallet.network])

  useEffect(() => {
    if (wallet.status !== 'connected') return

    refreshAccount()

    const interval = parseInt(
      localStorage.getItem('stellarsend_refresh_interval') || '30',
      10,
    )
    refreshTimerRef.current = setInterval(refreshAccount, interval * 1_000)

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    }
  }, [wallet.status, refreshAccount])

  const connect = useCallback(async () => {
    dispatch({ type: 'SET_CONNECTING' })
    try {
      const connected = await isConnected()
      if (!connected) {
        dispatch({
          type: 'SET_ERROR',
          error: 'Freighter wallet is not installed. Please install it from freighter.app',
        })
        return
      }

      await setAllowed()

      const pubKey = await getPublicKey()
      if (!pubKey) throw new Error('Could not retrieve public key from Freighter')

      dispatch({ type: 'SET_CONNECTED', publicKey: pubKey })

      // Fetch user info (optional, may fail)
      try {
        await getUserInfo()
      } catch {
        /* non-fatal */
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect wallet'
      dispatch({ type: 'SET_ERROR', error: message })
    }
  }, [])

  const disconnect = useCallback(() => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    dispatch({ type: 'SET_DISCONNECTED' })
  }, [])

  const setNetwork = useCallback((network: Network) => {
    dispatch({ type: 'SET_NETWORK', network })
    localStorage.setItem('stellarsend_network', network)
  }, [])

  const signTransaction = useCallback(
    async (xdr: string): Promise<string> => {
      if (!wallet.publicKey) throw new Error('Wallet not connected')

      // Dynamic import to avoid SSR issues
      const { signTransaction: freighterSign } = await import('@stellar/freighter-api')

      const networkPassphrase =
        wallet.network === 'testnet'
          ? 'Test SDF Network ; September 2015'
          : 'Public Global Stellar Network ; September 2015'

      const result = await freighterSign(xdr, {
        networkPassphrase,
        accountToSign: wallet.publicKey,
      })

      return result
    },
    [wallet.publicKey, wallet.network],
  )

  const value = useMemo<WalletContextValue>(
    () => ({ wallet, connect, disconnect, refreshAccount, setNetwork, signTransaction }),
    [wallet, connect, disconnect, refreshAccount, setNetwork, signTransaction],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function useWalletContext(): WalletContextValue {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWalletContext must be used inside WalletProvider')
  return ctx
}
