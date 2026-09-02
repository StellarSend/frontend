import React from "react"
interface Props { onRetry?: () => void; message?: string }
export function NetworkError({ onRetry, message = "Failed to load data" }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <span className="text-3xl">⚠️</span>
      <p className="text-sm font-medium text-slate-300">{message}</p>
      <p className="text-xs text-slate-500">Check your connection and try again</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary btn-sm mt-2">
          Retry
        </button>
      )}
    </div>
  )
}
