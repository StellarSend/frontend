import { describe, it, expect } from 'vitest'
import { getHistoryChartData, getActivityChartData, toUtcDateKey } from './chart'
import type { Transaction } from '@/types'

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    hash: 'hash-1',
    createdAt: new Date().toISOString(),
    type: 'payment',
    status: 'success',
    sourceAccount: 'GBXYZSOURCE...',
    destinationAccount: 'GBXYZDEST...',
    direction: 'sent',
    amount: '10.5',
    assetCode: 'XLM',
    assetIssuer: null,
    counterparty: 'GBXYZDEST...',
    fee: '100',
    ledger: 1000,
    memo: '',
    ...overrides,
  }
}

describe('chart aggregation utilities', () => {
  describe('toUtcDateKey', () => {
    it('formats a date cleanly to YYYY-MM-DD in UTC', () => {
      const d = new Date('2026-09-02T12:00:00Z')
      expect(toUtcDateKey(d)).toBe('2026-09-02')
    })
  })

  describe('getHistoryChartData (#29)', () => {
    it('generates 30 day buckets', () => {
      const chartData = getHistoryChartData([], new Date('2026-09-02T00:00:00Z').getTime())
      expect(chartData).toHaveLength(30)
    })

    it('does not merge transactions on the same month/day across different years', () => {
      const refTime = new Date('2026-09-02T00:00:00Z').getTime()
      
      const txCurrentYear = makeTx({
        id: 'tx-2026',
        createdAt: '2026-08-15T10:00:00Z',
        direction: 'sent',
        amount: '50.0',
        fee: '1000',
      })
      
      const txPreviousYear = makeTx({
        id: 'tx-2025',
        createdAt: '2025-08-15T10:00:00Z',
        direction: 'sent',
        amount: '100.0',
        fee: '2000',
      })

      const chartData = getHistoryChartData([txCurrentYear, txPreviousYear], refTime)
      const aug15Bucket = chartData.find((b) => b.date === 'Aug 15')

      expect(aug15Bucket).toBeDefined()
      // Should only contain the 2026 transaction amount (50.0), NOT 150.0
      expect(aug15Bucket!.Sent).toBe(50.0)
    })

    it('correctly aggregates sent, received, and fees for in-window dates', () => {
      const refTime = new Date('2026-09-02T00:00:00Z').getTime()

      const sentTx = makeTx({
        id: 'tx-1',
        createdAt: '2026-09-01T12:00:00Z',
        direction: 'sent',
        amount: '12.5000',
        fee: '1000',
      })

      const receivedTx = makeTx({
        id: 'tx-2',
        createdAt: '2026-09-01T14:00:00Z',
        direction: 'received',
        amount: '25.2500',
        fee: '500',
      })

      const chartData = getHistoryChartData([sentTx, receivedTx], refTime)
      const sep1Bucket = chartData.find((b) => b.date === 'Sep 1')

      expect(sep1Bucket).toBeDefined()
      expect(sep1Bucket!.Sent).toBe(12.5)
      expect(sep1Bucket!.Received).toBe(25.25)
      expect(sep1Bucket!.Fees).toBe(0.00015) // (1000 + 500) / 10,000,000
    })
  })

  describe('getActivityChartData', () => {
    it('generates 7 day buckets and aggregates sent/received amounts correctly', () => {
      const refTime = new Date('2026-09-02T00:00:00Z').getTime()

      const tx1 = makeTx({
        id: 'tx-1',
        createdAt: '2026-09-01T12:00:00Z',
        direction: 'sent',
        amount: '30.0',
      })

      const tx2 = makeTx({
        id: 'tx-2',
        createdAt: '2026-09-01T16:00:00Z',
        direction: 'received',
        amount: '45.5',
      })

      const chartData = getActivityChartData([tx1, tx2], refTime)
      expect(chartData).toHaveLength(7)

      const sep1Bucket = chartData.find((b) => b.date === 'Sep 1')
      expect(sep1Bucket).toBeDefined()
      expect(sep1Bucket!.sent).toBe(30.0)
      expect(sep1Bucket!.received).toBe(45.5)
    })
  })
})
