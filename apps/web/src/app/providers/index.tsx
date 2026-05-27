import { createContext, useCallback, useContext, useEffect, useRef } from "react"
import { useWalletStore } from "@/features/wallet/store/wallet-store"
import { NETWORK } from "@/app/config/network"

export type WalletStatus = "disconnected" | "connecting" | "connected" | "error"

export type WalletContextValue = {
  address: string | null
  status: WalletStatus
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

function WalletProvider({ children }: { children: ReactNode }) {
  return children
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { address, status, setConnected, setDisconnected, setStatus } = useWalletStore()
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    let unsub1: (() => void) | undefined
    let unsub2: (() => void) | undefined

    async function initKit() {
      const [{ StellarWalletsKit }, { defaultModules }, { KitEventType, Networks }] =
        await Promise.all([
          import("@creit.tech/stellar-wallets-kit/sdk"),
          import("@creit.tech/stellar-wallets-kit/modules/utils"),
          import("@creit.tech/stellar-wallets-kit/types"),
        ])

      const kitNetwork =
        NETWORK.name === "mainnet" ? Networks.PUBLIC : Networks.TESTNET

      StellarWalletsKit.init({
        modules: defaultModules(),
        network: kitNetwork,
      })

      unsub1 = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event: { payload: { address?: string } }) => {
        if (!mountedRef.current) return
        if (event.payload.address) {
          setConnected(event.payload.address, "kit")
        }
      })

      unsub2 = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
        if (mountedRef.current) setDisconnected()
      })
    }

    initKit()

    return () => {
      unsub1?.()
      unsub2?.()
    }
  }, [setConnected, setDisconnected])

  const connect = useCallback(async () => {
    setStatus("connecting")
    try {
      const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk")
      const { address: addr } = await StellarWalletsKit.authModal()
      if (mountedRef.current) setConnected(addr, "kit")
    } catch {
      if (mountedRef.current) setStatus("disconnected")
    }
  }, [setConnected, setStatus])

  const disconnect = useCallback(async () => {
    const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk")
    await StellarWalletsKit.disconnect()
    if (mountedRef.current) setDisconnected()
  }, [setDisconnected])

  return (
    <WalletContext.Provider value={{ address, status, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  )
}
