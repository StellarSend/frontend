import React, { useState } from 'react'
interface Props { onNext: (r: string) => void }
export function RecipientStep({ onNext }: Props) {
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const validate = () => {
    if (!address.startsWith('G') || address.length !== 56) { setError('Invalid Stellar address'); return }
    setError(''); onNext(address)
  }
  return (
    <div className='flex flex-col gap-4 p-6'>
      <h2 className='text-xl font-semibold'>Who to send to?</h2>
      <textarea value={address} onChange={e => setAddress(e.target.value.trim())} placeholder='G... Stellar address' rows={3} />
      {error && <p className='text-red-500 text-sm'>{error}</p>}
      <button onClick={validate}>Continue</button>
    </div>
  )
}
