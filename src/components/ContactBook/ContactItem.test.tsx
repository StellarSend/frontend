import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ContactItem } from './ContactItem'
import * as utils from '../../lib/utils'

describe('ContactItem', () => {
  const contact = {
    name: 'Alice',
    address: 'GBPBG7STIZUPFK2M2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D',
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders contact details and allows copying address', async () => {
    vi.spyOn(utils, 'copyToClipboard').mockResolvedValue(true)
    const onRemove = vi.fn()

    render(<ContactItem contact={contact} onRemove={onRemove} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()

    const copyBtn = screen.getByText('Copy')
    fireEvent.click(copyBtn)

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument()
    })
  })

  it('surfaces error message when copy fails', async () => {
    vi.spyOn(utils, 'copyToClipboard').mockResolvedValue(false)
    const onRemove = vi.fn()

    render(<ContactItem contact={contact} onRemove={onRemove} />)

    const copyBtn = screen.getByText('Copy')
    fireEvent.click(copyBtn)

    await waitFor(() => {
      expect(screen.getByText('Failed to copy')).toBeInTheDocument()
      expect(screen.getByText('Retry copy')).toBeInTheDocument()
    })
  })
})
