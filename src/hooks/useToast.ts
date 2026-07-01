import { useState, useCallback } from 'react'
type T = 'success'|'error'|'info'
interface Toast { id: number; message: string; type: T }
let n = 0
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const show = useCallback((message: string, type: T = 'info') => setToasts(p => [...p, { id: ++n, message, type }]), [])
  const dismiss = useCallback((id: number) => setToasts(p => p.filter(t => t.id !== id)), [])
  return { toasts, dismiss, success: (m: string) => show(m,'success'), error: (m: string) => show(m,'error'), info: show }
}
