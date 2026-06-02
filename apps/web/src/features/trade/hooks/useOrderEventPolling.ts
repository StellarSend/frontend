import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { CONTRACTS } from "@/app/config/contracts"
import { sorobanRpc } from "@/lib/soroban/client"
import { useWalletStore } from "@/features/wallet/store/wallet-store"
import { queryKeys } from "../lib/query-keys"

const CHAIN_ID = "stellar-mainnet"
const POLL_INTERVAL_MS = 5000
const TARGET_EVENTS = ["OrderExecuted", "OrderCancelled"]

function extractEventText(event: unknown): string {
  try {
    return JSON.stringify(event)
  } catch {
    return String(event)
  }
}

export function useOrderEventPolling() {
  const account = useWalletStore((state) => state.address)
  const queryClient = useQueryClient()
  const lastCursor = useRef<string | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (!account) return

    let cancelled = false
    lastCursor.current = null

    const poll = async () => {
      try {
        const params: Record<string, unknown> = {
          type: "contract",
          contractId: CONTRACTS.exchangeRouter,
          limit: 50,
          order: "asc",
        }

        if (lastCursor.current) {
          params.cursor = lastCursor.current
        }

        const response = await sorobanRpc.getEvents(params as any)
        const events = (response as any)?.records ?? response ?? []

        const matching = (Array.isArray(events) ? events : []).filter((event) => {
          const text = extractEventText(event).toLowerCase()
          const name = String((event as any)?.data?.event_name ?? (event as any)?.data?.type ?? (event as any)?.type ?? "").toLowerCase()
          const isOrderEvent = TARGET_EVENTS.some((target) => name.includes(target.toLowerCase()) || text.includes(target.toLowerCase()))
          const isForAccount = account ? text.includes(account.toLowerCase()) : false
          return isOrderEvent && isForAccount
        })

        if (matching.length > 0) {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.trade.positions(CHAIN_ID, account) }),
            queryClient.invalidateQueries({ queryKey: queryKeys.trade.orders(CHAIN_ID, account) }),
          ])
        }

        const lastEvent = (Array.isArray(events) ? events : []).slice(-1)[0]
        if (lastEvent?.paging_token) {
          lastCursor.current = lastEvent.paging_token
        } else if (lastEvent?.id) {
          lastCursor.current = lastEvent.id
        }
      } catch (error) {
        if (import.meta.env.DEV) console.warn("Order event polling failed", error)
      } finally {
        if (!cancelled) {
          timer.current = window.setTimeout(poll, POLL_INTERVAL_MS)
        }
      }
    }

    void poll()

    return () => {
      cancelled = true
      if (timer.current) {
        window.clearTimeout(timer.current)
      }
    }
  }, [account, queryClient])
}
