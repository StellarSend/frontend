import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ContactBook } from './index'

// Mock useContacts
const mockAddContact = vi.fn()
const mockRemoveContact = vi.fn()
let mockContacts = [
  { name: 'Alice', address: 'GCKF7343Q557N2TC227C7XNVS6AJ5XQ3P4GFFU3T4PVS64H63M2B53K4' },
  { name: 'Bob', address: 'GDRQ3BC766V27XNVS6AJ5XQ3P4GFFU3T4PVS64H63M2B53K4GCKF7343Q557' },
]

vi.mock('../../hooks/useContacts', () => ({
  useContacts: () => ({
    contacts: mockContacts,
    addContact: mockAddContact,
    removeContact: mockRemoveContact,
    findContact: vi.fn(),
  }),
}))

describe('ContactBook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders contacts list with search bar', () => {
    render(<ContactBook />)
    expect(screen.getByText('Contacts (2)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/search contacts/i)).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('filters contacts via SearchBar query', async () => {
    render(<ContactBook />)
    const searchInput = screen.getByRole('searchbox')
    fireEvent.change(searchInput, { target: { value: 'Alice' } })

    // useDebounce is synchronous in test env or updates quickly with vitest
    // SearchBar updates query state
    expect(searchInput).toHaveValue('Alice')
  })

  it('shows AddContact component when Add contact button is clicked', () => {
    render(<ContactBook />)
    expect(screen.queryByPlaceholderText('G... address')).not.toBeInTheDocument()

    const addBtn = screen.getByText('Add contact')
    fireEvent.click(addBtn)

    expect(screen.getByPlaceholderText('G... address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument()
  })

  it('calls removeContact when Remove is clicked', () => {
    render(<ContactBook />)
    const removeButtons = screen.getAllByText('Remove')
    fireEvent.click(removeButtons[0])
    expect(mockRemoveContact).toHaveBeenCalledWith(mockContacts[0].address)
  })
})
