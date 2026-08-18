import { ApiRequestError } from '@/lib/api'

/**
 * The global default React Query `retry` predicate: don't retry 404s.
 * `apiClient` rejects with a real `ApiRequestError` (not a plain object) so
 * this check — and the generic `Error` typing every hook's `useQuery<T,
 * Error>` already assumed — actually matches (#60). `code === 'NOT_FOUND'`
 * is the primary signal (derived from the real HTTP 404 status, not
 * backend-specific conventions); the message check is kept as a fallback
 * for whatever a specific backend error code might otherwise indicate.
 *
 * Lives in its own module (rather than inline in App.tsx's `queryClient`
 * config) both so it's directly unit-testable per #60's own suggested
 * testing strategy, and so App.tsx — a component file — only exports a
 * component, which `react-refresh/only-export-components` requires for Fast
 * Refresh to work correctly.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (
    error instanceof ApiRequestError &&
    (error.code === 'NOT_FOUND' || error.message.includes('not found'))
  ) {
    return false
  }
  return failureCount < 2
}
