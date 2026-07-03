// ─── Network ─────────────────────────────────────────────────────────────────

export type Network = 'testnet' | 'mainnet'

// ─── Assets ──────────────────────────────────────────────────────────────────

export interface StellarAsset {
  code: string
  issuer: string | null // null for XLM
  name: string
  logoUrl?: string
  decimals: number
}

export const NATIVE_XLM: StellarAsset = {
  code: 'XLM',
  issuer: null,
  name: 'Stellar Lumens',
  decimals: 7,
}

export const USDC_TESTNET: StellarAsset = {
  code: 'USDC',
  issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  name: 'USD Coin',
  decimals: 7,
}

export const USDC_MAINNET: StellarAsset = {
  code: 'USDC',
  issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
  name: 'USD Coin',
  decimals: 7,
}

// ─── Account ─────────────────────────────────────────────────────────────────

export interface Balance {
  asset: StellarAsset
  balance: string
  buyingLiabilities: string
  sellingLiabilities: string
  limit?: string
}

export interface AccountInfo {
  publicKey: string
  sequence: string
  balances: Balance[]
  subentryCount: number
  thresholds: {
    lowThreshold: number
    medThreshold: number
    highThreshold: number
  }
  flags: {
    authRequired: boolean
    authRevocable: boolean
    authImmutable: boolean
  }
  lastModifiedLedger: number
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export type WalletConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'

export interface WalletState {
  status: WalletConnectionStatus
  publicKey: string | null
  network: Network
  account: AccountInfo | null
  isFreighterInstalled: boolean
  error: string | null
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export type TransactionStatus = 'pending' | 'success' | 'failed' | 'timeout'

export type TransactionType =
  | 'payment'
  | 'path_payment'
  | 'create_account'
  | 'manage_offer'
  | 'change_trust'
  | 'other'

export interface Transaction {
  id: string
  hash: string
  createdAt: string
  type: TransactionType
  status: TransactionStatus
  sourceAccount: string
  destinationAccount: string
  amount: string
  assetCode: string
  assetIssuer: string | null
  memo?: string
  fee: string
  ledger: number
  envelopeXdr?: string
  // Path payment extras
  sendAssetCode?: string
  sendAssetIssuer?: string | null
  sendAmount?: string
  destinationAssetCode?: string
  destinationAssetIssuer?: string | null
  // Computed display
  direction: 'sent' | 'received'
  counterparty: string
}

export interface TransactionPage {
  transactions: Transaction[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
  cursor?: string
}

// ─── Quote / Send ─────────────────────────────────────────────────────────────

export interface QuoteRequest {
  sourceAsset: StellarAsset
  destinationAsset: StellarAsset
  destinationAddress: string
  amount: string
  amountType: 'send' | 'receive'
  usePathPayment: boolean
  memo?: string
}

export interface PathHop {
  assetCode: string
  assetIssuer: string | null
}

export interface Quote {
  id: string
  expiresAt: string
  sourceAsset: StellarAsset
  destinationAsset: StellarAsset
  sendAmount: string
  receiveAmount: string
  exchangeRate: string
  networkFee: string
  serviceFee: string
  totalFee: string
  estimatedSeconds: number
  path: PathHop[]
  slippageTolerance: string
  priceImpact: string
}

export interface SendPaymentRequest {
  quoteId: string
  sourcePublicKey: string
  destinationAddress: string
  signedXdr: string
  memo?: string
}

export interface SendPaymentResult {
  transactionHash: string
  ledger: number
  status: TransactionStatus
  createdAt: string
  fee: string
}

// ─── Form schemas ─────────────────────────────────────────────────────────────

export interface SendFormValues {
  destinationAddress: string
  amount: string
  sourceAssetCode: string
  destinationAssetCode: string
  amountType: 'send' | 'receive'
  usePathPayment: boolean
  memo: string
}

// ─── API responses ────────────────────────────────────────────────────────────

export interface ApiError {
  code: string
  message: string
  details?: Record<string, string[]>
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface AccountStats {
  totalSent: string
  totalReceived: string
  transactionCount: number
  averageFee: string
  mostUsedAsset: string
  lastActivityAt: string | null
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface AppSettings {
  network: Network
  slippageTolerance: string
  defaultMemo: string
  showTestnetWarning: boolean
  autoRefreshInterval: number // seconds
}

export const DEFAULT_SETTINGS: AppSettings = {
  network: 'testnet',
  slippageTolerance: '0.5',
  defaultMemo: '',
  showTestnetWarning: true,
  autoRefreshInterval: 30,
}

// ─── Chart ────────────────────────────────────────────────────────────────────

export interface ChartDataPoint {
  date: string
  sent: number
  received: number
  fees: number
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc'

export interface PaginationParams {
  page: number
  pageSize: number
  cursor?: string
}

export interface TransactionFilters {
  type?: TransactionType
  status?: TransactionStatus
  dateFrom?: string
  dateTo?: string
  assetCode?: string
  direction?: 'sent' | 'received'
}

// ─── Subscriptions (recurring payments) ───────────────────────────────────────

export type SubscriptionInterval = 'daily' | 'weekly' | 'monthly' | 'yearly'

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'completed'

export interface Subscription {
  id: string
  sourcePublicKey: string
  destinationAddress: string
  asset: StellarAsset
  amount: string
  interval: SubscriptionInterval
  startDate: string
  nextRunAt: string | null
  status: SubscriptionStatus
  memo?: string
  createdAt: string
  cancelledAt?: string
  runCount: number
}

export interface CreateSubscriptionRequest {
  sourcePublicKey: string
  destinationAddress: string
  assetCode: string
  assetIssuer: string | null
  amount: string
  interval: SubscriptionInterval
  startDate: string
  memo?: string
}

export interface SubscriptionFormValues {
  destinationAddress: string
  assetCode: string
  amount: string
  interval: SubscriptionInterval
  startDate: string
  memo: string
}

// ─── Batch / split payments ───────────────────────────────────────────────────

export interface BatchRecipient {
  destinationAddress: string
  amount: string
  memo?: string
}

export interface BatchPaymentFormValues {
  assetCode: string
  recipients: BatchRecipient[]
}

export interface BatchPaymentRequest {
  sourcePublicKey: string
  assetCode: string
  assetIssuer: string | null
  recipients: BatchRecipient[]
  signedXdr: string
}

export interface BatchPaymentResult {
  batchId: string
  transactionHash: string
  status: TransactionStatus
  recipientCount: number
  totalAmount: string
  createdAt: string
}

// ─── Payment requests / invoicing ─────────────────────────────────────────────

export type PaymentRequestStatus = 'open' | 'paid' | 'expired' | 'cancelled'

export interface PaymentRequest {
  id: string
  requesterPublicKey: string
  assetCode: string
  assetIssuer: string | null
  amount: string
  memo?: string
  expiresAt?: string
  status: PaymentRequestStatus
  createdAt: string
  paidTxHash?: string
}

export interface CreatePaymentRequestPayload {
  requesterPublicKey: string
  assetCode: string
  assetIssuer: string | null
  amount: string
  memo?: string
  expiresAt?: string
}

export interface PaymentRequestFormValues {
  assetCode: string
  amount: string
  memo: string
  expiresInHours: string
}

// ─── Escrow / conditional transfers ───────────────────────────────────────────

export type EscrowStatus = 'funded' | 'released' | 'refunded' | 'cancelled'

export type EscrowRole = 'depositor' | 'beneficiary' | 'arbiter'

export interface Escrow {
  id: string
  depositorPublicKey: string
  beneficiaryPublicKey: string
  arbiterPublicKey: string | null
  assetCode: string
  assetIssuer: string | null
  amount: string
  unlockTime: string
  status: EscrowStatus
  createdAt: string
  releasedAt?: string
  refundedAt?: string
  contractId?: string
}

export interface CreateEscrowRequest {
  depositorPublicKey: string
  beneficiaryPublicKey: string
  arbiterPublicKey: string | null
  assetCode: string
  assetIssuer: string | null
  amount: string
  unlockTime: string
}

export interface EscrowFormValues {
  beneficiaryPublicKey: string
  arbiterPublicKey: string
  assetCode: string
  amount: string
  unlockDate: string
}

/**
 * Determines which actions the current wallet may take on an escrow, mirroring
 * the gating enforced by the on-chain contract:
 *  - refund: depositor only, and only after unlockTime has passed with funds still held
 *  - release: beneficiary (any time while funded) OR arbiter (any time while funded)
 *  - depositor cannot release; nobody but the arbiter/beneficiary can release before unlock
 */
export function getEscrowPermissions(
  escrow: Escrow,
  publicKey: string | null,
  now: Date = new Date(),
): { canRelease: boolean; canRefund: boolean; role: EscrowRole | null } {
  if (!publicKey || escrow.status !== 'funded') {
    return { canRelease: false, canRefund: false, role: null }
  }

  const isDepositor = escrow.depositorPublicKey === publicKey
  const isBeneficiary = escrow.beneficiaryPublicKey === publicKey
  const isArbiter = !!escrow.arbiterPublicKey && escrow.arbiterPublicKey === publicKey
  const unlocked = now.getTime() >= new Date(escrow.unlockTime).getTime()

  const role: EscrowRole | null = isDepositor
    ? 'depositor'
    : isBeneficiary
      ? 'beneficiary'
      : isArbiter
        ? 'arbiter'
        : null

  // Beneficiary or arbiter can release funds to the beneficiary at any time.
  const canRelease = isBeneficiary || isArbiter
  // Only the depositor can reclaim funds, and only once the unlock time has passed
  // (i.e. the beneficiary/arbiter window has elapsed without a release).
  const canRefund = isDepositor && unlocked

  return { canRelease, canRefund, role }
}
