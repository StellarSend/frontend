import { useState, useCallback, useRef, useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  message: string
  type: ToastType
}

export function useToast(autoDismissTimeout = 5000) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const show = useCallback(
    (message: string, type: ToastType = 'info', timeout = autoDismissTimeout) => {
      const id = ++nextId.current
      setToasts(prev => [...prev, { id, message, type }])

      if (timeout > 0) {
        const timer = setTimeout(() => {
          timers.current.delete(id)
          setToasts(prev => prev.filter(t => t.id !== id))
        }, timeout)
        timers.current.set(id, timer)
      }

      return id
    },
    [autoDismissTimeout]
  )

  useEffect(() => {
    const currentTimers = timers.current
    return () => {
      currentTimers.forEach(timer => clearTimeout(timer))
      currentTimers.clear()
    }
  }, [])

  const success = useCallback((message: string, timeout?: number) => show(message, 'success', timeout), [show])
  const error = useCallback((message: string, timeout?: number) => show(message, 'error', timeout), [show])
  const info = useCallback((message: string, timeout?: number) => show(message, 'info', timeout), [show])

  return { toasts, dismiss, show, success, error, info }
}
