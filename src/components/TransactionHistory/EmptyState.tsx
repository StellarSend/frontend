import React from "react"
export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
      <span className="text-4xl">📭</span>
      <p className="text-sm">No transactions yet</p>
      <p className="text-xs">Your payment history will appear here</p>
    </div>
  )
}
