import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { FAUCET_TOKENS } from "../data/tokens"
import { createFaucetClient } from "../lib/clients"
import { useWalletStore } from "@/features/wallet/store/wallet-store"
import { walletKit } from "@/features/wallet/lib/wallet-kit"
import { sendAndPoll } from "@/lib/tx-builder"
import { explorerTxUrl } from "@/app/config/network"
import { queryKeys } from "@/shared/lib/query-keys"
import { parseSorobanError } from "@/lib/contracts"

function isClaimTooSoonError(error: unknown): boolean {
  const text = String(error).toLowerCase()
  return (
    text.includes("claimtoosoon") ||
    text.includes("claim_too_soon") ||
    // contract error code 6 may appear as '#6' or 'Error(Contract, #6)'
    /error\(contract,\s*#6\)/i.test(String(error))
  )
}

export function useClaim() {
  const address = useWalletStore((state) => state.address)
  const isConnected = useWalletStore((state) => state.status === "connected")
  const queryClient = useQueryClient()
  const [pendingTokens, setPendingTokens] = useState<Set<string>>(new Set())
  const [isBulkPending, setIsBulkPending] = useState(false)
  const isClaimingRef = useRef(false)

  const claimOne = useCallback(
    async (tokenId: string) => {
      if (!address || !isConnected) return
      if (isClaimingRef.current) return

      isClaimingRef.current = true
      setPendingTokens((prev) => {
        const next = new Set(prev)
        next.add(tokenId)
        return next
      })

      const toastId = toast.loading("Claiming test token…")

      try {
        const faucet = createFaucetClient(address)
        const tx = await faucet.claim_many({
          account: address,
          tokens: [tokenId],
        })

        const unsignedXdr = tx.toXDR()
        const { signedTxXdr } = await walletKit.signTransaction(unsignedXdr)
        const signedXdr = signedTxXdr
        const { hash } = await sendAndPoll(signedXdr)

        // Refresh balances after a successful claim
        await queryClient.invalidateQueries({ queryKey: queryKeys.faucet.data(address) })

        toast.success("Test token claimed!", {
          id: toastId,
          description: (
            <a
              href={explorerTxUrl(hash)}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary hover:underline"
            >
              View transaction →
            </a>
          ),
        })
      } catch (error) {
        const message = isClaimTooSoonError(error)
          ? "Cooldown active — please wait before claiming again."
          : parseSorobanError(error)
        toast.error(message, { id: toastId })
      } finally {
        setPendingTokens((prev) => {
          const next = new Set(prev)
          next.delete(tokenId)
          return next
        })
        isClaimingRef.current = false
      }
    },
    [address, isConnected, queryClient],
  )

  const claimAll = useCallback(
    async () => {
      if (!address || !isConnected) return
      if (isClaimingRef.current) return

      isClaimingRef.current = true
      setIsBulkPending(true)

      const tokenIds = FAUCET_TOKENS.map((t) => t.contractId)
      const toastId = toast.loading("Claiming test tokens…")

      try {
        const faucet = createFaucetClient(address)
        const tx = await faucet.claim_many({
          account: address,
          tokens: tokenIds,
        })

        const unsignedXdr = tx.toXDR()
        const { signedTxXdr } = await walletKit.signTransaction(unsignedXdr)
        const signedXdr = signedTxXdr
        const { hash } = await sendAndPoll(signedXdr)

        // Refresh balances after a successful claim
        await queryClient.invalidateQueries({ queryKey: queryKeys.faucet.data(address) })

        toast.success("Test tokens claimed!", {
          id: toastId,
          description: (
            <a
              href={explorerTxUrl(hash)}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary hover:underline"
            >
              View transaction →
            </a>
          ),
        })
      } catch (error) {
        const message = isClaimTooSoonError(error)
          ? "Cooldown active — please wait before claiming again."
          : parseSorobanError(error)
        toast.error(message, { id: toastId })
      } finally {
        setIsBulkPending(false)
        isClaimingRef.current = false
      }
    },
    [address, isConnected, queryClient],
  )

  return { claimOne, claimAll, pendingTokens, isBulkPending }
}
