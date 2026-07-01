import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightElement?: React.ReactNode
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, hint, leftIcon, rightElement, fullWidth = false, className, id, ...props },
    ref,
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-300"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-slate-400 pointer-events-none z-10">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full bg-navy-800 border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500',
              'transition-all duration-200 outline-none',
              'focus:border-stellar-500 focus:ring-2 focus:ring-stellar-500/25',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'read-only:bg-navy-900 read-only:text-slate-400',
              error
                ? 'border-danger-500 focus:border-danger-400 focus:ring-danger-500/25'
                : 'border-navy-600 hover:border-navy-500',
              leftIcon && 'pl-10',
              rightElement && 'pr-24',
              className,
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-2 flex items-center">{rightElement}</div>
          )}
        </div>

        {error && (
          <p className="text-xs text-danger-400 flex items-center gap-1 mt-0.5">
            <span className="inline-block w-1 h-1 rounded-full bg-danger-400" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-slate-500">{hint}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  fullWidth?: boolean
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, fullWidth = false, options, className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-slate-300">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full bg-navy-800 border rounded-xl px-4 py-2.5 text-sm text-white',
            'transition-all duration-200 outline-none cursor-pointer',
            'focus:border-stellar-500 focus:ring-2 focus:ring-stellar-500/25',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-danger-500'
              : 'border-navy-600 hover:border-navy-500',
            className,
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-navy-900">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-danger-400">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    )
  },
)

Select.displayName = 'Select'
