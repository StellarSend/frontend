type PoolCompositionBarProps = {
  longPct: number
  shortPct: number
  longSymbol: string
  shortSymbol: string
}

export function PoolCompositionBar({
  longPct,
  shortPct,
  longSymbol,
  shortSymbol,
}: PoolCompositionBarProps) {
  const safeLong = Math.max(0, Math.min(100, longPct))
  const safeShort = Math.max(0, Math.min(100, shortPct))

  return (
    <div className="w-full min-w-32">
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        <div className="bg-cyan-500" style={{ width: `${safeLong}%` }} />
        <div className="bg-emerald-500" style={{ width: `${safeShort}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <span className="truncate">
          {longSymbol} {safeLong.toFixed(0)}%
        </span>
        <span className="truncate">
          {shortSymbol} {safeShort.toFixed(0)}%
        </span>
      </div>
    </div>
  )
}
