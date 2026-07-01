import React, { useState } from 'react'
import { isValidStellarAddress } from '../../utils/stellar'
import type { Contact } from './ContactItem'

interface Props {
  onAdd: (contact: Contact) => void
  onCancel: () => void
}

export function AddContact({ onAdd, onCancel }: Props) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [errors, setErrors] = useState<{ name?: string; address?: string }>({})

  const submit = () => {
    const e: typeof errors = {}
    if (!name.trim()) e.name = 'Name is required'
    if (!isValidStellarAddress(address)) e.address = 'Invalid Stellar address'
    setErrors(e)
    if (Object.keys(e).length === 0) onAdd({ name: name.trim(), address })
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
      <h3 className="font-medium">Add contact</h3>
      <input
        value={name} onChange={e => setName(e.target.value)}
        placeholder="Name" className="input w-full"
      />
      {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
      <input
        value={address} onChange={e => setAddress(e.target.value.trim())}
        placeholder="G... address" className="input w-full font-mono"
      />
      {errors.address && <p className="text-red-500 text-xs">{errors.address}</p>}
      <div className="flex gap-2">
        <button onClick={submit} className="btn-primary btn-sm">Add</button>
        <button onClick={onCancel} className="btn-secondary btn-sm">Cancel</button>
      </div>
    </div>
  )
}
