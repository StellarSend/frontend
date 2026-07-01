import React from 'react'
interface Props { tx: Record<string, unknown>; myAddress: string }
export function TransactionItem({ tx, myAddress }: Props) {
  const isSent = tx.from === myAddress
  return (
    <div className='flex items-center justify-between py-3 border-b'>
      <div className='flex items-center gap-3'>
        <span>{isSent ? '↑' : '↓'}</span>
        <div>
          <p className='text-sm font-medium'>{isSent ? 'To ' : 'From '}{String(isSent ? tx.to : tx.from).slice(0,8)}…</p>
          <p className='text-xs text-gray-400'>{String(tx.created_at)}</p>
        </div>
      </div>
      <p className={isSent ? 'text-red-500' : 'text-green-600'}>{isSent ? '-' : '+'}{String(tx.amount)} XLM</p>
    </div>
  )
}
