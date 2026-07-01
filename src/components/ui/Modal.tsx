import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface ModalProps {
  isOpen: boolean
  onClose?: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showClose?: boolean
  closeOnBackdrop?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
  closeOnBackdrop = true,
  className,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen || !onClose) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && onClose && e.target === overlayRef.current) {
      onClose()
    }
  }

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-black/70 backdrop-blur-sm',
        'animate-fade-in',
      )}
    >
      <div
        className={cn(
          'relative w-full bg-navy-800 border border-navy-600/50 rounded-2xl shadow-2xl',
          'animate-slide-up',
          sizeClasses[size],
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-start justify-between p-6 pb-0">
            <div>
              {title && (
                <h2 id="modal-title" className="text-lg font-semibold text-white">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm text-slate-400 mt-1">{description}</p>
              )}
            </div>
            {showClose && onClose && (
              <Button
                variant="ghost"
                size="xs"
                onClick={onClose}
                className="ml-4 shrink-0 -mt-1"
                aria-label="Close"
              >
                <X size={16} />
              </Button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

// ─── Modal footer helper ──────────────────────────────────────────────────────

export function ModalFooter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 pt-4 border-t border-navy-700/50',
        className,
      )}
    >
      {children}
    </div>
  )
}
