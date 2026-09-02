import type { Transaction } from '@/types'

export interface HistoryDayBucket {
  date: string
  Sent: number
  Received: number
  Fees: number
}

export interface ActivityDayBucket {
  date: string
  sent: number
  received: number
}

/**
 * Format a Date into ISO YYYY-MM-DD string using UTC to prevent timezone drift.
 */
export function toUtcDateKey(d: Date): string {
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format a Date for chart tick / tooltip display (e.g. "Jul 15").
 */
export function formatDayDisplay(d: Date): string {
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * Aggregate 30 days of transaction volume for HistoryChart.
 * Buckets by unambiguous YYYY-MM-DD key so transactions on the same month/day
 * across year boundaries or outside the 30-day window never collide or corrupt sums.
 */
export function getHistoryChartData(transactions: Transaction[], now: number = Date.now()): HistoryDayBucket[] {
  const bucketMap = new Map<string, { label: string; sent: number; received: number; fees: number }>()

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000)
    const key = toUtcDateKey(d)
    const label = formatDayDisplay(d)
    bucketMap.set(key, { label, sent: 0, received: 0, fees: 0 })
  }

  transactions.forEach((tx) => {
    const txDate = new Date(tx.createdAt)
    const key = toUtcDateKey(txDate)
    const bucket = bucketMap.get(key)
    if (bucket) {
      if (tx.direction === 'sent') {
        bucket.sent += parseFloat(tx.amount || '0')
      } else {
        bucket.received += parseFloat(tx.amount || '0')
      }
      bucket.fees += parseFloat(tx.fee || '0') / 10_000_000
    }
  })

  return Array.from(bucketMap.values()).map((v) => ({
    date: v.label,
    Sent: +v.sent.toFixed(4),
    Received: +v.received.toFixed(4),
    Fees: +v.fees.toFixed(7),
  }))
}

/**
 * Aggregate 7 days of transaction activity for ActivityChart on Dashboard.
 */
export function getActivityChartData(transactions: Transaction[], now: number = Date.now()): ActivityDayBucket[] {
  const bucketMap = new Map<string, { label: string; sent: number; received: number }>()

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000)
    const key = toUtcDateKey(d)
    const label = formatDayDisplay(d)
    bucketMap.set(key, { label, sent: 0, received: 0 })
  }

  transactions.forEach((tx) => {
    const txDate = new Date(tx.createdAt)
    const key = toUtcDateKey(txDate)
    const bucket = bucketMap.get(key)
    if (bucket) {
      if (tx.direction === 'sent') {
        bucket.sent += parseFloat(tx.amount || '0')
      } else {
        bucket.received += parseFloat(tx.amount || '0')
      }
    }
  })

  return Array.from(bucketMap.values()).map((v) => ({
    date: v.label,
    sent: parseFloat(v.sent.toFixed(4)),
    received: parseFloat(v.received.toFixed(4)),
  }))
}
