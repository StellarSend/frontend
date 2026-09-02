import React, { useState } from 'react'
import { useContacts } from '../../hooks/useContacts'
import { useContactSearch } from '../../hooks/useContactSearch'
import { ContactItem } from './ContactItem'
import { SearchBar } from './SearchBar'
import { AddContact } from './AddContact'

export function ContactBook() {
  const { contacts, addContact, removeContact } = useContacts()
  const [query, setQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const filtered = useContactSearch(contacts, query)

  return (
    <div className='p-4'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-lg font-semibold'>Contacts ({contacts.length})</h2>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className='btn-primary btn-sm text-sm'
          >
            Add contact
          </button>
        )}
      </div>

      <div className='mb-4'>
        <SearchBar value={query} onChange={setQuery} />
      </div>

      {showAdd && (
        <div className='mb-4'>
          <AddContact
            onAdd={(contact) => {
              addContact(contact)
              setShowAdd(false)
            }}
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <p className='text-sm text-gray-500 py-4 text-center'>
          {query ? 'No contacts found' : 'No contacts yet'}
        </p>
      ) : (
        filtered.map(c => (
          <ContactItem
            key={c.address}
            contact={c}
            onRemove={() => removeContact(c.address)}
          />
        ))
      )}
    </div>
  )
}

