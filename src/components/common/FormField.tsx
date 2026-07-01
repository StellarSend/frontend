import React, { type ReactNode } from "react"
interface Props {
  label: string; error?: string | null; hint?: string; required?: boolean; children: ReactNode
}
export function FormField({ label, error, hint, required, children }: Props) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
