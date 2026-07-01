import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean
  glass?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({
  children,
  glow = false,
  glass = false,
  padding = 'md',
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-navy-600/50 shadow-card',
        glass
          ? 'bg-glass backdrop-blur-sm'
          : 'bg-navy-800/80',
        glow && 'shadow-stellar border-stellar-600/30',
        paddingMap[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-between mb-4', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-semibold text-white', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardBody({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'mt-4 pt-4 border-t border-navy-700/50 flex items-center justify-between',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
