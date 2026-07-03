import React from 'react'
import { useClipboard } from '../../hooks/useClipboard'
import type { Contact } from '../../hooks/useContacts'
export type { Contact }
interface Props { contact: Contact; onRemove: () => void; onSelect?: (a: string) => void }
export function ContactItem({ contact, onRemove, onSelect }: Props) {
  const { copy, copied } = useClipboard()
  return (
    <div className='flex items-center justify-between py-3 border-b'>
      <div>
        <p className='font-medium'>{contact.name}</p>
        <p className='text-xs text-gray-400 font-mono'>{contact.address.slice(0,8)}…</p>
      </div>
      <div className='flex gap-2'>
        <button onClick={() => copy(contact.address)}>{copied ? 'Copied!' : 'Copy'}</button>
        {onSelect && <button onClick={() => onSelect(contact.address)}>Send</button>}
        <button onClick={onRemove}>Remove</button>
      </div>
    </div>
  )
}
