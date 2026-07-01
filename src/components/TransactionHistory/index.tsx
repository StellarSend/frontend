import React from 'react'
import { useTransactionHistory } from '../../hooks/useTransactionHistory'
import { TransactionItem } from './TransactionItem'
interface Props { address: string | null }
export function TransactionHistory({ address }: Props) {
  const { transactions, loading, error } = useTransactionHistory(address)
  if (!address) return <p className='text-center py-8 text-gray-400'>Connect wallet to view history</p>
  if (loading) return <p className='text-center py-8'>Loading…</p>
  if (error) return <p className='text-red-500 text-center py-8'>Error: {error}</p>
  if (!transactions.length) return <p className='text-center py-8 text-gray-400'>No transactions yet</p>
  return <div>{transactions.map((tx, i) => <TransactionItem key={i} tx={tx as Record<string,unknown>} myAddress={address} />)}</div>
}
