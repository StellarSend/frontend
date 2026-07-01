import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { WalletProvider } from '@/context/WalletContext'
import { Layout } from '@/components/layout/Layout'

// Pages (lazy-loaded for code-splitting)
import { lazy, Suspense } from 'react'
import { PageLoader } from '@/components/ui/Spinner'

const Home = lazy(() => import('@/pages/Home'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Send = lazy(() => import('@/pages/Send'))
const History = lazy(() => import('@/pages/History'))
const Settings = lazy(() => import('@/pages/Settings'))
const NotFound = lazy(() => import('@/pages/NotFound'))

// ─── React Query config ───────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        // Don't retry 404s
        if (error instanceof Error && error.message.includes('not found')) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
})

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <BrowserRouter>
          <Suspense fallback={<FullPageLoader />}>
            <Routes>
              {/* Landing page (no layout shell) */}
              <Route path="/" element={<Home />} />

              {/* App shell with Navbar + Sidebar */}
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/send" element={<Send />} />
                <Route path="/history" element={<History />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* Redirects */}
              <Route path="/app" element={<Navigate to="/dashboard" replace />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </WalletProvider>

      {/* Only shown in development */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  )
}

function FullPageLoader() {
  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center">
      <PageLoader label="Loading StellarSend..." />
    </div>
  )
}
