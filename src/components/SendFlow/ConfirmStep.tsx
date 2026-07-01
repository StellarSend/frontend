import React from 'react'
interface Props { amount: string; recipient: string; onConfirm: () => void }
export function ConfirmStep({ amount, recipient, onConfirm }: Props) {
  return (
    <div className='flex flex-col gap-4 p-6'>
      <h2 className='text-xl font-semibold'>Confirm transfer</h2>
      <p>Send {amount} XLM to {recipient.slice(0,8)}…{recipient.slice(-4)}</p>
      <button onClick={onConfirm}>Send</button>
    </div>
  )
}
