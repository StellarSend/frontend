import React from 'react'
import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  label?: string
}

const sizeMap = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-2',
  xl: 'w-12 h-12 border-[3px]',
}

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label || 'Loading'}
      className={cn('inline-flex flex-col items-center gap-2', className)}
    >
      <div
        className={cn(
          'rounded-full border-navy-600 border-t-stellar-500 animate-spin',
          sizeMap[size],
        )}
      />
      {label && <span className="text-xs text-slate-400">{label}</span>}
    </div>
  )
}

// ─── Full-page loader ─────────────────────────────────────────────────────────

export function PageLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-64">
      <Spinner size="xl" label={label} />
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-navy-700/60 rounded-lg animate-pulse',
        className,
      )}
    />
  )
}

export function SkeletonCard({ lines = 3 }: SkeletonProps) {
  return (
    <div className="rounded-2xl bg-navy-800/80 border border-navy-600/50 p-5 space-y-3">
      <Skeleton className="h-4 w-32" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3', i === lines - 1 ? 'w-24' : 'w-full')}
        />
      ))}
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-2.5 w-24" />
      </div>
      <div className="space-y-2 text-right">
        <Skeleton className="h-3 w-20 ml-auto" />
        <Skeleton className="h-2.5 w-14 ml-auto" />
      </div>
    </div>
  )
}
