import React from 'react'
import { Inbox, AlertCircle, ChevronDown, Filter, Search } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SkeletonRow, Spinner } from '@/components/ui/Spinner'
import { TransactionRow } from './TransactionRow'
import { useTransactions } from '@/hooks/useTransactions'
import { useWallet } from '@/hooks/useWallet'
import { Input } from '@/components/ui/Input'
import { useState } from 'react'
import type { Transaction } from '@/types'

export function TransactionTable() {
  const { network } = useWallet()
  const [search, setSearch] = useState('')

  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useTransactions()

  const allTransactions: Transaction[] =
    data?.pages.flatMap((p) => p.transactions) ?? []

  const filtered = search.trim()
    ? allTransactions.filter(
        (tx) =>
          tx.hash.toLowerCase().includes(search.toLowerCase()) ||
          tx.counterparty.toLowerCase().includes(search.toLowerCase()) ||
          tx.assetCode.toLowerCase().includes(search.toLowerCase()),
      )
    : allTransactions

  return (
    <Card padding="none">
      <div className="p-5 border-b border-navy-700/40">
        <CardHeader className="mb-0">
          <CardTitle>Transaction History</CardTitle>
          <Button variant="secondary" size="sm" icon={<Filter size={13} />}>
            Filter
          </Button>
        </CardHeader>

        {/* Search */}
        <div className="mt-4">
          <Input
            placeholder="Search by hash, address, or asset..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={14} />}
            fullWidth
          />
        </div>
      </div>

      {/* Table content */}
      {isLoading ? (
        <div className="divide-y divide-navy-700/30">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={error?.message || 'Failed to load transactions'} />
      ) : filtered.length === 0 ? (
        <EmptyState hasSearch={!!search.trim()} />
      ) : (
        <>
          <div className="divide-y divide-navy-700/30">
            {filtered.map((tx) => (
              <TransactionRow key={tx.id || tx.hash} tx={tx} network={network} />
            ))}
          </div>

          {/* Load more */}
          {hasNextPage && (
            <div className="p-4 border-t border-navy-700/30 flex justify-center">
              <Button
                variant="secondary"
                size="sm"
                loading={isFetchingNextPage}
                icon={<ChevronDown size={14} />}
                onClick={() => fetchNextPage()}
              >
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-navy-700/50 border border-navy-600/40 flex items-center justify-center mb-4">
        <Inbox size={24} className="text-slate-500" />
      </div>
      <h3 className="text-base font-semibold text-white mb-1">
        {hasSearch ? 'No matching transactions' : 'No transactions yet'}
      </h3>
      <p className="text-sm text-slate-500 max-w-xs">
        {hasSearch
          ? 'Try adjusting your search query or clear the filter.'
          : 'Your transaction history will appear here once you send or receive funds.'}
      </p>
    </div>
  )
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
      <AlertCircle size={32} className="text-danger-400" />
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  )
}
