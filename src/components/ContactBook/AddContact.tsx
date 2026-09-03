import React, { useState } from 'react'
import { isValidStellarAddress } from '../../utils/stellar'
import { VisuallyHidden } from '../common/VisuallyHidden'
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
      <div>
        <label htmlFor="contact-name">
          <VisuallyHidden>Contact name</VisuallyHidden>
        </label>
        <input
          id="contact-name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Name"
          className="input w-full"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "contact-name-error" : undefined}
        />
        {errors.name && <p id="contact-name-error" className="text-red-500 text-xs">{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="contact-address">
          <VisuallyHidden>Stellar address</VisuallyHidden>
        </label>
        <input
          id="contact-address"
          value={address}
          onChange={e => setAddress(e.target.value.trim())}
          placeholder="G... address"
          className="input w-full font-mono"
          aria-invalid={!!errors.address}
          aria-describedby={errors.address ? "contact-address-error" : undefined}
        />
        {errors.address && <p id="contact-address-error" className="text-red-500 text-xs">{errors.address}</p>}
      </div>
      <div className="flex gap-2">
        <button onClick={submit} className="btn-primary btn-sm">Add</button>
        <button onClick={onCancel} className="btn-secondary btn-sm">Cancel</button>
      </div>
    </div>
  )
}
