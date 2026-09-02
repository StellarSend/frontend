import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Settings from '@/pages/Settings'

// Mock WalletContext
vi.mock('@/hooks/useWallet', () => ({
  useWallet: () => ({
    isConnected: false,
    publicKey: null,
    network: 'testnet',
    account: null,
    xlmBalance: null,
    setNetwork: vi.fn(),
    disconnect: vi.fn(),
  }),
}))

describe('Settings page Appearance section', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
  })

  it('renders theme selector buttons (Light, Dark, System)', () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    )

    expect(screen.getByText('Appearance & Display')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Light/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Dark/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /System/i })).toBeInTheDocument()
  })

  it('changes theme to dark when Dark button is clicked', () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    )

    const darkBtn = screen.getByRole('button', { name: /Dark/i })
    fireEvent.click(darkBtn)

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('ss-theme')).toBe(JSON.stringify('dark'))
  })

  it('changes theme to light when Light button is clicked', () => {
    document.documentElement.classList.add('dark')
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    )

    const lightBtn = screen.getByRole('button', { name: /Light/i })
    fireEvent.click(lightBtn)

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('ss-theme')).toBe(JSON.stringify('light'))
  })
})
