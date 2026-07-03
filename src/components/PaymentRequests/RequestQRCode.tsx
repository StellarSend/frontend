import React, { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Check, Copy } from 'lucide-react'
import { copyToClipboard } from '@/lib/utils'

interface RequestQRCodeProps {
  value: string
  size?: number
}

/**
 * Renders a QR code for a shareable payment-request link using the `qrcode`
 * package's canvas renderer (see package.json — chosen because hand-rolling a
 * correct QR encoder involves Reed-Solomon error correction and mask-pattern
 * scoring that's easy to get subtly wrong; `qrcode` is a small, dependency-light,
 * widely used library whose browser bundle excludes its Node-only PNG/CLI code).
 */
export function RequestQRCode({ value, size = 200 }: RequestQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!canvasRef.current) return

    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).catch((err: unknown) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Failed to render QR code')
      }
    })

    return () => {
      cancelled = true
    }
  }, [value, size])

  if (error) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-navy-900/60 border border-danger-500/20 text-xs text-danger-400"
        style={{ width: size, height: size }}
      >
        {error}
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="QR code for payment request link"
      className="rounded-xl bg-white p-2"
    />
  )
}

// ─── Shareable link row with copy-to-clipboard ────────────────────────────────

export function ShareableLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await copyToClipboard(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-navy-900/60 border border-navy-700/40">
      <span className="text-xs font-mono text-slate-300 flex-1 truncate">{link}</span>
      <button
        onClick={handleCopy}
        aria-label="Copy link"
        className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors shrink-0"
      >
        {copied ? <Check size={13} className="text-success-400" /> : <Copy size={13} />}
      </button>
    </div>
  )
}
