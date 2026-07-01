import React, { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'link'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-stellar-gradient text-white shadow-stellar hover:shadow-glow hover:brightness-110 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
  secondary:
    'bg-navy-700 border border-stellar-600/40 text-stellar-300 hover:bg-navy-600 hover:border-stellar-500/60 active:bg-navy-700 disabled:opacity-50',
  outline:
    'bg-transparent border border-stellar-500/50 text-stellar-400 hover:bg-stellar-500/10 hover:border-stellar-400 active:bg-stellar-500/20 disabled:opacity-50',
  ghost:
    'bg-transparent text-slate-300 hover:bg-white/5 hover:text-white active:bg-white/10 disabled:opacity-40',
  danger:
    'bg-danger-600 text-white hover:bg-danger-500 active:bg-danger-700 shadow-md disabled:opacity-50',
  link:
    'bg-transparent text-stellar-400 hover:text-stellar-300 underline-offset-4 hover:underline disabled:opacity-50 p-0',
}

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs rounded-lg gap-1.5',
  sm: 'h-8 px-3 text-sm rounded-lg gap-2',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-11 px-5 text-base rounded-xl gap-2.5',
  xl: 'h-13 px-7 text-lg rounded-2xl gap-3',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-stellar-500 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900 select-none',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          loading && 'cursor-wait',
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={size === 'xs' ? 12 : 16} />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && iconRight && <span className="shrink-0 ml-auto">{iconRight}</span>}
      </button>
    )
  },
)

Button.displayName = 'Button'
