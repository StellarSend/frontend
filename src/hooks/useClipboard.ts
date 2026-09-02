import { useState, useCallback, useRef, useEffect } from 'react'
import { copyToClipboard } from '../lib/utils'

export interface UseClipboardOptions {
  timeout?: number
}

export function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (timerRef.current) clearTimeout(timerRef.current)

      try {
        const success = await copyToClipboard(text)
        if (!isMountedRef.current) return success

        if (success) {
          setError(null)
          setCopied(true)
          timerRef.current = setTimeout(() => {
            if (isMountedRef.current) setCopied(false)
          }, timeout)
          return true
        } else {
          const err = new Error('Failed to copy text to clipboard')
          setError(err)
          setCopied(false)
          return false
        }
      } catch (err) {
        if (!isMountedRef.current) return false
        const failureError = err instanceof Error ? err : new Error(String(err))
        setError(failureError)
        setCopied(false)
        return false
      }
    },
    [timeout]
  )

  return { copy, copied, error }
}
