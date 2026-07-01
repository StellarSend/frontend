import React from 'react'
interface Props { amount: string; recipient: string }
export function SuccessStep({ amount, recipient }: Props) {
  return (
    <div className='flex flex-col items-center gap-6 p-8 text-center'>
      <div className='text-6xl'>✅</div>
      <h2 className='text-2xl font-bold text-green-600'>Transfer sent!</h2>
      <p>{amount} XLM sent to {recipient.slice(0,8)}…{recipient.slice(-4)}</p>
    </div>
  )
}
