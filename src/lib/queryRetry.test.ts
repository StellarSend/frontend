import { describe, it, expect } from 'vitest'
import { shouldRetryQuery } from './queryRetry'
import { ApiRequestError } from '@/lib/api'

// #60: the retry predicate previously checked `error instanceof Error`, but
// apiClient rejected with a plain `{ code, message, details }` object
// literal — never a real Error — so the "don't retry 404s" branch was
// unreachable for every backend-routed query relying on the global default.
// These tests exercise `shouldRetryQuery` directly, exactly as it's wired
// into `queryClient`'s `defaultOptions.queries.retry` in App.tsx.
describe('shouldRetryQuery', () => {
  it("does not retry when the error is an ApiRequestError with code 'NOT_FOUND'", () => {
    const error = new ApiRequestError({ code: 'NOT_FOUND', message: 'Escrow not found' })

    expect(shouldRetryQuery(0, error)).toBe(false)
  })

  it('does not retry an ApiRequestError whose message mentions "not found", even with a different code', () => {
    const error = new ApiRequestError({
      code: 'PAYMENT_REQUEST_NOT_FOUND',
      message: 'Payment request not found',
    })

    expect(shouldRetryQuery(0, error)).toBe(false)
  })

  it('retries an ApiRequestError for a different, non-404 failure up to the failure-count limit', () => {
    const error = new ApiRequestError({ code: 'UNKNOWN_ERROR', message: 'Internal server error' })

    expect(shouldRetryQuery(0, error)).toBe(true)
    expect(shouldRetryQuery(1, error)).toBe(true)
    expect(shouldRetryQuery(2, error)).toBe(false)
  })

  it('retries a plain, non-ApiRequestError value up to the failure-count limit', () => {
    // A non-API error (e.g. a thrown string, or a plain object from code
    // this predicate isn't meant to special-case) must never be mistaken
    // for a 404 just because it happens to be object-shaped.
    expect(shouldRetryQuery(0, { code: 'NOT_FOUND', message: 'not found' })).toBe(true)
    expect(shouldRetryQuery(2, { code: 'NOT_FOUND', message: 'not found' })).toBe(false)
  })

  it('retries a bare Error instance (not an ApiRequestError) up to the failure-count limit', () => {
    const error = new Error('not found')

    expect(shouldRetryQuery(0, error)).toBe(true)
  })
})
