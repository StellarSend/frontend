// Centralised number / currency / address formatting
// Every feature should import from here instead of defining inline helpers.

// ─── Guard ───────────────────────────────────────────────────────────────────

const FALLBACK = "—"

function isBad(n: number | undefined | null): n is undefined | null {
  return n == null || !isFinite(n)
}

// ─── USD ─────────────────────────────────────────────────────────────────────

type FormatUsdOpts = {
  /** Fraction digits (default 2) */
  decimals?: number
  /** Use compact notation, e.g. "$1.2M" (default false) */
  compact?: boolean
}

/**
 * Format a number as USD currency.
 *
 * @example formatUsd(12345.678)          // "$12,345.68"
 * @example formatUsd(1_200_000, { compact: true }) // "$1.2M"
 * @example formatUsd(NaN)               // "—"
 */
export function formatUsd(n: number | undefined | null, opts?: FormatUsdOpts): string {
  if (isBad(n)) return FALLBACK

  const { decimals = 2, compact = false } = opts ?? {}

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: compact ? 0 : decimals,
    maximumFractionDigits: decimals,
    ...(compact ? { notation: "compact" as const } : {}),
  }).format(n)
}

// ─── Token ───────────────────────────────────────────────────────────────────

type FormatTokenOpts = {
  /** Max fraction digits (default 4) */
  decimals?: number
  /** Min fraction digits (default 0) */
  minDecimals?: number
}

/**
 * Format a token amount with its symbol.
 *
 * @example formatToken(0.00432, "BTC")          // "0.0043 BTC"
 * @example formatToken(1234.5, "USDC", { decimals: 2 }) // "1,234.50 USDC"
 * @example formatToken(undefined, "ETH")        // "—"
 */
export function formatToken(
  n: number | undefined | null,
  symbol: string,
  opts?: FormatTokenOpts,
): string {
  if (isBad(n)) return FALLBACK

  const { decimals = 4, minDecimals = 0 } = opts ?? {}

  const formatted = n.toLocaleString("en-US", {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: decimals,
  })

  return `${formatted} ${symbol}`
}

// ─── Percentage ──────────────────────────────────────────────────────────────

type FormatPctOpts = {
  /** Fraction digits (default 2) */
  decimals?: number
  /** Prepend +/- sign (default true) */
  sign?: boolean
}

/**
 * Format a percentage value.
 *
 * @example formatPct(1.23)         // "+1.23%"
 * @example formatPct(-0.45)        // "-0.45%"
 * @example formatPct(0)            // "+0.00%"
 * @example formatPct(NaN)          // "—"
 */
export function formatPct(n: number | undefined | null, opts?: FormatPctOpts): string {
  if (isBad(n)) return FALLBACK

  const { decimals = 2, sign = true } = opts ?? {}
  const prefix = sign ? (n >= 0 ? "+" : "") : ""

  return `${prefix}${n.toFixed(decimals)}%`
}

// ─── Address ─────────────────────────────────────────────────────────────────

/**
 * Truncate a Stellar address for display.
 *
 * @example formatAddress("GABC...full...XYZ") // "GABCDE…WXYZ"
 */
export function formatAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr || FALLBACK
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

// ─── Tx Hash ─────────────────────────────────────────────────────────────────

/**
 * Truncate a transaction hash for display (first 8 + last 4 chars).
 *
 * @example formatTxHash("a1b2c3d4e5f6g7h8i9j0") // "a1b2c3d4…j9j0"
 */
export function formatTxHash(hash: string): string {
  if (!hash || hash.length < 14) return hash || FALLBACK
  return `${hash.slice(0, 8)}…${hash.slice(-4)}`
}
