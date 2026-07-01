import React, { useState } from 'react'
import { useContacts } from '../../hooks/useContacts'
import { ContactItem } from './ContactItem'
export function ContactBook() {
  const { contacts, addContact, removeContact } = useContacts()
  const [name, setName] = useState(''); const [addr, setAddr] = useState('')
  const submit = () => { if (name && addr) { addContact({ name, address: addr }); setName(''); setAddr('') } }
  return (
    <div className='p-4'>
      <h2 className='text-lg font-semibold mb-4'>Contacts ({contacts.length})</h2>
      {contacts.map(c => <ContactItem key={c.address} contact={c} onRemove={() => removeContact(c.address)} />)}
      <div className='mt-4 space-y-2'>
        <input value={name} onChange={e => setName(e.target.value)} placeholder='Name' />
        <input value={addr} onChange={e => setAddr(e.target.value)} placeholder='G... address' />
        <button onClick={submit}>Add contact</button>
      </div>
    </div>
  )
}
