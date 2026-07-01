import React, { useRef, useEffect, type ReactNode } from "react"
interface Props { children: ReactNode; active?: boolean }
export function FocusTrap({ children, active = true }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!active || !ref.current) return
    const focusable = ref.current.querySelectorAll<HTMLElement>(
      "a, button, input, textarea, select, [tabindex]:not([tabindex=\"-1\"])"
    )
    if (focusable.length) focusable[0].focus()
  }, [active])
  return <div ref={ref}>{children}</div>
}
