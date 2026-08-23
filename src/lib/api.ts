import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'
import type {
  AccountInfo,
  AccountStats,
  ApiError,
  Quote,
  QuoteRequest,
  SendPaymentRequest,
  SendPaymentResult,
  TransactionFilters,
  TransactionPage,
  PaginationParams,
  Subscription,
  CreateSubscriptionRequest,
  BatchPaymentRequest,
  BatchPaymentResult,
  PaymentRequest,
  CreatePaymentRequestPayload,
  Escrow,
  CreateEscrowRequest,
  Network,
} from '@/types'

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8080'

// ─── Normalized API errors ────────────────────────────────────────────────────

/**
 * A real `Error` subclass carrying the same `code`/`details` fields as
 * `ApiError`, rejected by every request through `apiClient` in place of a
 * plain `{ code, message, details }` object literal. The plain-object
 * rejection made `error instanceof Error` — used by the global React Query
 * retry predicate in `App.tsx` (and assumed by every hook's `useQuery<T,
 * Error>` type parameter) — always false for backend-routed failures,
 * silently defeating the "don't retry 404s" check (#60).
 */
export class ApiRequestError extends Error implements ApiError {
  code: string
  details?: Record<string, string[]>

  constructor(apiError: ApiError) {
    super(apiError.message)
    this.name = 'ApiRequestError'
    this.code = apiError.code
    this.details = apiError.details
  }
}

/**
 * Turns a rejected axios response into an `ApiRequestError`. Exported
 * separately from the interceptor so it can be unit-tested directly instead
 * of relying on axios's internal interceptor-handler storage.
 *
 * `code` prefers the backend's own `data.code`; when the backend doesn't
 * send one, a 404 status is normalized to the stable `'NOT_FOUND'` code
 * (HTTP status is a reliable, backend-convention-independent signal, unlike
 * substring-matching `message`) rather than falling through to
 * `'UNKNOWN_ERROR'`.
 */
export function normalizeApiError(error: AxiosError<ApiError>): ApiRequestError {
  const message =
    error.response?.data?.message || error.message || 'An unexpected error occurred'
  const code =
    error.response?.data?.code || (error.response?.status === 404 ? 'NOT_FOUND' : 'UNKNOWN_ERROR')
  return new ApiRequestError({
    code,
    message,
    details: error.response?.data?.details,
  })
}

// ─── Axios instance ───────────────────────────────────────────────────────────

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 30_000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })

  // Request interceptor — attach auth token if present
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('stellarsend_token')
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error),
  )

  // Response interceptor — normalise errors
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiError>) => Promise.reject(normalizeApiError(error)),
  )

  return client
}

export const apiClient: AxiosInstance = createApiClient()

// ─── Helper ───────────────────────────────────────────────────────────────────

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<{ data: T }>(config)
  // Handle both { data: T } and plain T shapes
  return (response.data as unknown as { data: T }).data ?? (response.data as unknown as T)
}

// ─── Account ──────────────────────────────────────────────────────────────────

export const accountApi = {
  getAccount: (publicKey: string) =>
    request<AccountInfo>({ method: 'GET', url: `/accounts/${publicKey}` }),

  getStats: (publicKey: string) =>
    request<AccountStats>({ method: 'GET', url: `/accounts/${publicKey}/stats` }),
}

// ─── Quotes ───────────────────────────────────────────────────────────────────

export const quoteApi = {
  getQuote: (params: QuoteRequest) =>
    request<Quote>({ method: 'POST', url: '/quotes', data: params }),

  refreshQuote: (quoteId: string) =>
    request<Quote>({ method: 'POST', url: `/quotes/${quoteId}/refresh` }),
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export const paymentApi = {
  send: (payload: SendPaymentRequest) =>
    request<SendPaymentResult>({ method: 'POST', url: '/payments', data: payload }),

  getStatus: (txHash: string) =>
    request<SendPaymentResult>({ method: 'GET', url: `/payments/${txHash}` }),

  buildTransaction: (params: {
    sourceAccount: string
    destinationAccount: string
    amount: string
    assetCode: string
    assetIssuer: string | null
    memo?: string
    usePathPayment: boolean
    sendAssetCode?: string
    sendAssetIssuer?: string | null
    path?: Array<{ assetCode: string; assetIssuer: string | null }>
    slippageTolerance?: string
  }) =>
    request<{ xdr: string; fee: string }>({
      method: 'POST',
      url: '/payments/build',
      data: params,
    }),
}

// ─── Subscriptions (recurring payments) ───────────────────────────────────────
// Assumed backend surface — paths may need small adjustments once the backend
// team's actual routes land, but the shapes here follow the same
// request/response conventions as quoteApi/paymentApi above.

export const subscriptionApi = {
  list: (publicKey: string, network?: Network) =>
    request<Subscription[]>({
      method: 'GET',
      url: '/api/subscriptions',
      params: { publicKey, ...(network && { network }) },
    }),

  get: (subscriptionId: string, network?: Network) =>
    request<Subscription>({
      method: 'GET',
      url: `/api/subscriptions/${subscriptionId}`,
      params: network ? { network } : undefined,
    }),

  /** Ask the backend to build the unsigned XDR for the first-payment / authorization transaction. */
  buildCreateTransaction: (payload: CreateSubscriptionRequest) =>
    request<{ xdr: string; fee: string }>({
      method: 'POST',
      url: '/api/subscriptions/build',
      data: payload,
    }),

  /** Submit the Freighter-signed XDR to register the recurring schedule. */
  create: (payload: CreateSubscriptionRequest & { signedXdr: string }) =>
    request<Subscription>({
      method: 'POST',
      url: '/api/subscriptions',
      data: payload,
    }),

  buildCancelTransaction: (subscriptionId: string, network?: Network) =>
    request<{ xdr: string; fee: string }>({
      method: 'POST',
      url: `/api/subscriptions/${subscriptionId}/cancel/build`,
      params: network ? { network } : undefined,
      data: network ? { network } : undefined,
    }),

  cancel: (subscriptionId: string, signedXdr?: string, network?: Network) =>
    request<Subscription>({
      method: 'POST',
      url: `/api/subscriptions/${subscriptionId}/cancel`,
      data: { signedXdr, ...(network && { network }) },
    }),
}

// ─── Batch / split payments ───────────────────────────────────────────────────

export const batchPaymentApi = {
  build: (params: {
    sourcePublicKey: string
    assetCode: string
    assetIssuer: string | null
    recipients: { destinationAddress: string; amount: string; memo?: string }[]
  }) =>
    request<{ xdr: string; fee: string }>({
      method: 'POST',
      url: '/api/payments/batch/build',
      data: params,
    }),

  send: (payload: BatchPaymentRequest) =>
    request<BatchPaymentResult>({
      method: 'POST',
      url: '/api/payments/batch',
      data: payload,
    }),

  getStatus: (batchId: string) =>
    request<BatchPaymentResult>({
      method: 'GET',
      url: '/api/payments/batch/${batchId}',
    }),
}

// ─── Payment requests / invoicing ─────────────────────────────────────────────

export const paymentRequestApi = {
  create: (payload: CreatePaymentRequestPayload) =>
    request<PaymentRequest>({
      method: 'POST',
      url: '/api/payment-requests',
      data: payload,
    }),

  get: (requestId: string, network?: Network) =>
    request<PaymentRequest>({
      method: 'GET',
      url: `/api/payment-requests/${requestId}`,
      params: network ? { network } : undefined,
    }),

  list: (publicKey: string, network?: Network) =>
    request<PaymentRequest[]>({
      method: 'GET',
      url: '/api/payment-requests',
      params: { publicKey, ...(network && { network }) },
    }),

  cancel: (requestId: string, network?: Network) =>
    request<PaymentRequest>({
      method: 'POST',
      url: `/api/payment-requests/${requestId}/cancel`,
      params: network ? { network } : undefined,
      data: network ? { network } : undefined,
    }),
}

// ─── Escrow / conditional transfers ───────────────────────────────────────────

export const escrowApi = {
  list: (publicKey: string, network?: Network) =>
    request<Escrow[]>({
      method: 'GET',
      url: '/api/escrows',
      params: { publicKey, ...(network && { network }) },
    }),

  get: (escrowId: string, network?: Network) =>
    request<Escrow>({
      method: 'GET',
      url: `/api/escrows/${escrowId}`,
      params: network ? { network } : undefined,
    }),

  buildCreateTransaction: (payload: CreateEscrowRequest) =>
    request<{ xdr: string; fee: string }>({
      method: 'POST',
      url: '/api/escrows/build',
      data: payload,
    }),

  create: (payload: CreateEscrowRequest & { signedXdr: string }) =>
    request<Escrow>({
      method: 'POST',
      url: '/api/escrows',
      data: payload,
    }),

  buildReleaseTransaction: (escrowId: string, network?: Network) =>
    request<{ xdr: string; fee: string }>({
      method: 'POST',
      url: `/api/escrows/${escrowId}/release/build`,
      params: network ? { network } : undefined,
      data: network ? { network } : undefined,
    }),

  release: (escrowId: string, signedXdr: string, network?: Network) =>
    request<Escrow>({
      method: 'POST',
      url: `/api/escrows/${escrowId}/release`,
      data: { signedXdr, ...(network && { network }) },
    }),

  buildRefundTransaction: (escrowId: string, network?: Network) =>
    request<{ xdr: string; fee: string }>({
      method: 'POST',
      url: `/api/escrows/${escrowId}/refund/build`,
      params: network ? { network } : undefined,
      data: network ? { network } : undefined,
    }),

  refund: (escrowId: string, signedXdr: string, network?: Network) =>
    request<Escrow>({
      method: 'POST',
      url: `/api/escrows/${escrowId}/refund`,
      data: { signedXdr, ...(network && { network }) },
    }),
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export const transactionApi = {
  list: (
    publicKey: string,
    pagination: PaginationParams,
    filters?: TransactionFilters,
  ) =>
    request<TransactionPage>({
      method: 'GET',
      url: `/accounts/${publicKey}/transactions`,
      params: {
        page: pagination.page,
        page_size: pagination.pageSize,
        cursor: pagination.cursor,
        ...filters,
      },
    }),

  get: (txHash: string) =>
    request<import('@/types').Transaction>({
      method: 'GET',
      url: `/transactions/${txHash}`,
    }),
}

// ─── Stellar Horizon fallback ─────────────────────────────────────────────────
// Used when the backend is unavailable — calls Horizon directly.

const HORIZON_TESTNET = 'https://horizon-testnet.stellar.org'
const HORIZON_MAINNET = 'https://horizon.stellar.org'

/** Resolves the Horizon host for `network` — always thread the caller's
 * currently selected network through here rather than hardcoding a host;
 * a hardcoded mainnet URL is what made the now-removed `useStellarAccount`
 * hook silently 404 on valid testnet accounts (#21). */
export function horizonUrl(network: 'testnet' | 'mainnet') {
  return network === 'testnet' ? HORIZON_TESTNET : HORIZON_MAINNET
}

/** Fetches full account state from Horizon for the given `network`. This is
 * the network-aware source of truth `useWallet`'s account state is built
 * on — prefer it (or that hook) over any new ad-hoc Horizon call. */
export async function fetchAccountFromHorizon(
  publicKey: string,
  network: 'testnet' | 'mainnet',
): Promise<AccountInfo> {
  const url = `${horizonUrl(network)}/accounts/${publicKey}`
  const res = await fetch(url)
  if (!res.ok) {
    if (res.status === 404) throw new Error('Account not found on Stellar network')
    throw new Error(`Horizon error: ${res.status}`)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: any = await res.json()
  return {
    publicKey: raw.account_id,
    sequence: raw.sequence,
    subentryCount: raw.subentry_count,
    lastModifiedLedger: raw.last_modified_ledger,
    thresholds: {
      lowThreshold: raw.thresholds.low_threshold,
      medThreshold: raw.thresholds.med_threshold,
      highThreshold: raw.thresholds.high_threshold,
    },
    flags: {
      authRequired: raw.flags.auth_required,
      authRevocable: raw.flags.auth_revocable,
      authImmutable: raw.flags.auth_immutable,
    },
    balances: (raw.balances || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (b: any): import('@/types').Balance => ({
        asset: {
          code: b.asset_type === 'native' ? 'XLM' : b.asset_code,
          issuer: b.asset_type === 'native' ? null : b.asset_issuer,
          name: b.asset_type === 'native' ? 'Stellar Lumens' : b.asset_code,
          decimals: 7,
        },
        balance: b.balance,
        buyingLiabilities: b.buying_liabilities || '0',
        sellingLiabilities: b.selling_liabilities || '0',
        limit: b.limit,
      }),
    ),
  }
}

export async function fetchTransactionsFromHorizon(
  publicKey: string,
  network: 'testnet' | 'mainnet',
  limit = 20,
  cursor?: string,
): Promise<TransactionPage> {
  const base = `${horizonUrl(network)}/accounts/${publicKey}/transactions`
  const params = new URLSearchParams({
    limit: String(limit),
    order: 'desc',
    include_failed: 'true',
  })
  if (cursor) params.set('cursor', cursor)

  const res = await fetch(`${base}?${params}`)
  if (!res.ok) throw new Error(`Horizon error: ${res.status}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: any = await res.json()
  const records = raw._embedded?.records || []

  return {
    page: 1,
    pageSize: limit,
    total: records.length,
    hasMore: records.length === limit,
    cursor: records[records.length - 1]?.paging_token,
    transactions: records.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any): import('@/types').Transaction => ({
        id: r.id,
        hash: r.hash,
        createdAt: r.created_at,
        type: 'payment',
        status: r.successful ? 'success' : 'failed',
        sourceAccount: r.source_account,
        destinationAccount: publicKey,
        amount: '0',
        assetCode: 'XLM',
        assetIssuer: null,
        fee: r.fee_charged,
        ledger: r.ledger,
        memo: r.memo,
        direction: r.source_account === publicKey ? 'sent' : 'received',
        counterparty:
          r.source_account === publicKey ? publicKey : r.source_account,
      }),
    ),
  }
}
