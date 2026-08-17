import { useCallback, useState } from 'react'

/**
 * Tracks a set of in-flight ids independently of any single mutation's
 * `.variables` — which is a single scalar, overwritten by the most recent
 * `.mutate()`/`.mutateAsync()` call, not a record of everything currently
 * pending. Deriving a per-row loading indicator from `.variables` means a
 * second concurrent action (e.g. releasing a different escrow while the
 * first is still in flight) silently clobbers the first row's indicator.
 * See #52.
 *
 * `track(id, promise)` marks `id` pending immediately and clears it once
 * `promise` settles, regardless of success or failure, so each id's
 * pending state is independent of what any other id is doing.
 */
export function usePendingIds() {
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  const track = useCallback((id: string, promise: Promise<unknown>): void => {
    setPendingIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })

    promise
      .catch(() => {
        // Already surfaced via the mutation's own error state (isError/
        // error); this hook only tracks pending-ness, not the outcome, and
        // nothing here awaits `track`'s return, so an unhandled rejection
        // would otherwise leak from this call.
      })
      .finally(() => {
        setPendingIds((prev) => {
          if (!prev.has(id)) return prev
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      })
  }, [])

  return { pendingIds, track }
}
