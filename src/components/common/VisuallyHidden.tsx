import React, { type ReactNode } from "react"
interface Props { children: ReactNode }
export function VisuallyHidden({ children }: Props) {
  return (
    <span className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0">
      {children}
    </span>
  )
}
