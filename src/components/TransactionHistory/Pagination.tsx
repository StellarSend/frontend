import React from "react"
interface Props { page: number; hasMore: boolean; onNext: () => void; onPrev: () => void }
export function Pagination({ page, hasMore, onNext, onPrev }: Props) {
  return (
    <div className="flex justify-between items-center mt-4">
      <button onClick={onPrev} disabled={page === 1} className="btn-secondary btn-sm">← Prev</button>
      <span className="text-sm text-gray-500">Page {page}</span>
      <button onClick={onNext} disabled={!hasMore} className="btn-secondary btn-sm">Next →</button>
    </div>
  )
}
