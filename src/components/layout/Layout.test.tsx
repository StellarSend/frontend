import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './Layout'

vi.mock('@/hooks/useWallet', () => ({
  useWallet: vi.fn(() => ({
    network: 'mainnet',
    isConnected: false,
    publicKey: null,
    account: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    setNetwork: vi.fn(),
  })),
}))

vi.mock('./Navbar', () => ({
  Navbar: () => <nav data-testid="navbar">Navbar</nav>,
}))

vi.mock('./Sidebar', () => ({
  Sidebar: () => <aside data-testid="sidebar">Sidebar</aside>,
}))

describe('Layout', () => {
  it('renders SkipLink as the first element targeting #main-content', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/test']}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/test" element={<div data-testid="child-page">Child Page Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    const skipLink = screen.getByRole('link', { name: /skip to main content/i })
    expect(skipLink).toBeInTheDocument()
    expect(skipLink).toHaveAttribute('href', '#main-content')

    const mainElement = container.querySelector('main#main-content')
    expect(mainElement).toBeInTheDocument()
    expect(mainElement).toHaveAttribute('tabIndex', '-1')
    expect(screen.getByTestId('child-page')).toBeInTheDocument()
  })
})
