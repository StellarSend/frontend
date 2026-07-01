import React from 'react'
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TransactionStatus } from '@/types'

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'pending'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: 'xs' | 'sm' | 'md'
  dot?: boolean
  icon?: React.ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-success-500/15 text-success-400 border-success-500/30',
  danger: 'bg-danger-500/15 text-danger-400 border-danger-500/30',
  warning: 'bg-warning-500/15 text-warning-400 border-warning-500/30',
  info: 'bg-stellar-500/15 text-stellar-400 border-stellar-500/30',
  neutral: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  pending: 'bg-warning-500/15 text-warning-400 border-warning-500/30',
}

const sizeClasses = {
  xs: 'text-[10px] px-1.5 py-0.5 gap-1',
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1.5',
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  icon,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'inline-block w-1.5 h-1.5 rounded-full shrink-0',
            variant === 'success' && 'bg-success-400',
            variant === 'danger' && 'bg-danger-400',
            variant === 'warning' && 'bg-warning-400',
            variant === 'info' && 'bg-stellar-400',
            variant === 'pending' && 'bg-warning-400 animate-pulse',
            variant === 'neutral' && 'bg-slate-400',
          )}
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: TransactionStatus
  size?: 'xs' | 'sm' | 'md'
}

const statusConfig: Record<
  TransactionStatus,
  { variant: BadgeVariant; label: string; icon: React.ReactNode }
> = {
  success: {
    variant: 'success',
    label: 'Success',
    icon: <CheckCircle size={11} />,
  },
  failed: {
    variant: 'danger',
    label: 'Failed',
    icon: <XCircle size={11} />,
  },
  pending: {
    variant: 'pending',
    label: 'Pending',
    icon: <Loader2 size={11} className="animate-spin" />,
  },
  timeout: {
    variant: 'warning',
    label: 'Timeout',
    icon: <AlertCircle size={11} />,
  },
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <Badge variant={config.variant} size={size} icon={config.icon}>
      {config.label}
    </Badge>
  )
}

// ─── Network badge ────────────────────────────────────────────────────────────

export function NetworkBadge({ network }: { network: 'testnet' | 'mainnet' }) {
  return (
    <Badge
      variant={network === 'testnet' ? 'warning' : 'success'}
      size="xs"
      dot
    >
      {network === 'testnet' ? 'Testnet' : 'Mainnet'}
    </Badge>
  )
}
