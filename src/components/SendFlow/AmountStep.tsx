import React, { useState } from 'react'
interface Props { onNext: (amount: string) => void }
export function AmountStep({ onNext }: Props) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const validate = () => {
    const n = parseFloat(amount)
    if (isNaN(n) || n <= 0) { setError('Enter a valid amount'); return }
    setError(''); onNext(amount)
  }
  return (
    <div className='flex flex-col gap-4 p-6'>
      <h2 className='text-xl font-semibold'>How much to send?</h2>
      <input type='number' value={amount} onChange={e => setAmount(e.target.value)} placeholder='0.00' />
      {error && <p className='text-red-500 text-sm'>{error}</p>}
      <button onClick={validate}>Continue</button>
    </div>
  )
}
