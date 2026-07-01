import React from "react"
interface Props { className?: string; rows?: number }
export function Skeleton({ className = "", rows = 1 }: Props) {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={"bg-gray-200 dark:bg-gray-700 rounded " + (className || "h-4 w-full")} />
      ))}
    </div>
  )
}
export function TransactionSkeleton() {
  return (
    <div className="flex items-center justify-between py-3 border-b animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-gray-200 rounded-full" />
        <div className="space-y-1"><div className="h-3 w-32 bg-gray-200 rounded" /><div className="h-2 w-20 bg-gray-100 rounded" /></div>
      </div>
      <div className="h-4 w-16 bg-gray-200 rounded" />
    </div>
  )
}
