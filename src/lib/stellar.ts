import {
  Asset,
  Keypair,
  Memo,
  MemoType,
  Networks,
  Operation,
  Horizon,
  TransactionBuilder,
  BASE_FEE,
} from '@stellar/stellar-sdk'
import type { Network, StellarAsset, Quote, PathHop } from '@/types'

// ─── Horizon servers ──────────────────────────────────────────────────────────

export function getServer(network: Network): Horizon.Server {
  const url =
    network === 'testnet'
      ? 'https://horizon-testnet.stellar.org'
      : 'https://horizon.stellar.org'
  return new Horizon.Server(url)
}

export function getNetworkPassphrase(network: Network): string {
  return network === 'testnet' ? Networks.TESTNET : Networks.PUBLIC
}

// ─── Asset helpers ────────────────────────────────────────────────────────────

export function toStellarAsset(asset: StellarAsset): Asset {
  if (asset.code === 'XLM' && !asset.issuer) {
    return Asset.native()
  }
  if (!asset.issuer) throw new Error(`Non-native asset "${asset.code}" is missing issuer`)
  return new Asset(asset.code, asset.issuer)
}

export function pathHopToAsset(hop: PathHop): Asset {
  if (hop.assetCode === 'XLM' && !hop.assetIssuer) return Asset.native()
  if (!hop.assetIssuer) throw new Error(`Path hop asset "${hop.assetCode}" missing issuer`)
  return new Asset(hop.assetCode, hop.assetIssuer)
}

export function assetFromCodeIssuer(code: string, issuer: string | null): Asset {
  if (code === 'XLM' && !issuer) return Asset.native()
  if (!issuer) throw new Error(`Asset ${code} requires an issuer`)
  return new Asset(code, issuer)
}

// ─── Fee estimation ───────────────────────────────────────────────────────────

export async function estimateFee(network: Network): Promise<string> {
  try {
    const server = getServer(network)
    const feeStats = await server.feeStats()
    // Use the p70 fee rate for reliable inclusion
    const feeRate = parseInt(feeStats.fee_charged.p70, 10) || parseInt(BASE_FEE, 10)
    return String(Math.max(feeRate, parseInt(BASE_FEE, 10)))
  } catch {
    return BASE_FEE
  }
}

// ─── Build payment transaction ────────────────────────────────────────────────

interface BuildPaymentParams {
  sourcePublicKey: string
  destinationAddress: string
  asset: StellarAsset
  amount: string
  memo?: string
  network: Network
  timeoutSeconds?: number
}

export async function buildPaymentTransaction(
  params: BuildPaymentParams,
): Promise<string> {
  const {
    sourcePublicKey,
    destinationAddress,
    asset,
    amount,
    memo,
    network,
    timeoutSeconds = 30,
  } = params

  const server = getServer(network)
  const passphrase = getNetworkPassphrase(network)
  const fee = await estimateFee(network)

  const sourceAccount = await server.loadAccount(sourcePublicKey)

  const stellarAsset = toStellarAsset(asset)

  const builder = new TransactionBuilder(sourceAccount, {
    fee,
    networkPassphrase: passphrase,
  })
    .addOperation(
      Operation.payment({
        destination: destinationAddress,
        asset: stellarAsset,
        amount,
      }),
    )
    .setTimeout(timeoutSeconds)

  if (memo) {
    const trimmed = memo.trim()
    if (trimmed) {
      // Auto-detect memo type
      if (/^\d+$/.test(trimmed) && BigInt(trimmed) <= BigInt('18446744073709551615')) {
        builder.addMemo(Memo.id(trimmed))
      } else {
        builder.addMemo(Memo.text(trimmed.slice(0, 28)))
      }
    }
  }

  const tx = builder.build()
  return tx.toXDR()
}

// ─── Build path payment transaction ──────────────────────────────────────────

interface BuildPathPaymentParams {
  sourcePublicKey: string
  destinationAddress: string
  sendAsset: StellarAsset
  destAsset: StellarAsset
  sendAmount: string
  destMin: string // minimum destination amount (after slippage)
  path: PathHop[]
  memo?: string
  network: Network
  timeoutSeconds?: number
}

export async function buildPathPaymentTransaction(
  params: BuildPathPaymentParams,
): Promise<string> {
  const {
    sourcePublicKey,
    destinationAddress,
    sendAsset,
    destAsset,
    sendAmount,
    destMin,
    path,
    memo,
    network,
    timeoutSeconds = 30,
  } = params

  const server = getServer(network)
  const passphrase = getNetworkPassphrase(network)
  const fee = await estimateFee(network)

  const sourceAccount = await server.loadAccount(sourcePublicKey)

  const stellarSendAsset = toStellarAsset(sendAsset)
  const stellarDestAsset = toStellarAsset(destAsset)
  const stellarPath = path.map(pathHopToAsset)

  const builder = new TransactionBuilder(sourceAccount, {
    fee,
    networkPassphrase: passphrase,
  })
    .addOperation(
      Operation.pathPaymentStrictSend({
        sendAsset: stellarSendAsset,
        sendAmount,
        destination: destinationAddress,
        destAsset: stellarDestAsset,
        destMin,
        path: stellarPath,
      }),
    )
    .setTimeout(timeoutSeconds)

  if (memo?.trim()) {
    const trimmed = memo.trim()
    if (/^\d+$/.test(trimmed) && BigInt(trimmed) <= BigInt('18446744073709551615')) {
      builder.addMemo(Memo.id(trimmed))
    } else {
      builder.addMemo(Memo.text(trimmed.slice(0, 28)))
    }
  }

  return builder.build().toXDR()
}

// ─── Build from quote ─────────────────────────────────────────────────────────

export async function buildTransactionFromQuote(
  quote: Quote,
  sourcePublicKey: string,
  destinationAddress: string,
  network: Network,
  memo?: string,
): Promise<string> {
  const slippage = parseFloat(quote.slippageTolerance) / 100
  const destMin = (
    parseFloat(quote.receiveAmount) * (1 - slippage)
  ).toFixed(7)

  if (quote.path.length > 0) {
    return buildPathPaymentTransaction({
      sourcePublicKey,
      destinationAddress,
      sendAsset: quote.sourceAsset,
      destAsset: quote.destinationAsset,
      sendAmount: quote.sendAmount,
      destMin,
      path: quote.path,
      memo,
      network,
    })
  }

  return buildPaymentTransaction({
    sourcePublicKey,
    destinationAddress,
    asset: quote.sourceAsset,
    amount: quote.sendAmount,
    memo,
    network,
  })
}

// ─── Submit transaction ───────────────────────────────────────────────────────

export async function submitTransaction(
  signedXdr: string,
  network: Network,
): Promise<{ hash: string; ledger: number }> {
  const server = getServer(network)
  const tx = TransactionBuilder.fromXDR(signedXdr, getNetworkPassphrase(network))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await server.submitTransaction(tx as any)
  return {
    hash: result.hash,
    ledger: result.ledger,
  }
}

// ─── Validate Stellar address ─────────────────────────────────────────────────

export function isValidStellarAddress(address: string): boolean {
  try {
    Keypair.fromPublicKey(address)
    return true
  } catch {
    return false
  }
}

// ─── Truncate address ─────────────────────────────────────────────────────────

export function truncateAddress(address: string, chars = 6): string {
  if (!address) return ''
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

// ─── Format amounts ───────────────────────────────────────────────────────────

export function formatAmount(
  amount: string | number,
  decimals = 2,
  symbol = '',
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '—'
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
  return symbol ? `${formatted} ${symbol}` : formatted
}

export function formatXLM(amount: string | number): string {
  return formatAmount(amount, 4, 'XLM')
}

export function formatUSD(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

// ─── Apply slippage ───────────────────────────────────────────────────────────

export function applySlippage(amount: string, slippagePct: string): string {
  const a = parseFloat(amount)
  const s = parseFloat(slippagePct) / 100
  return (a * (1 - s)).toFixed(7)
}

// ─── Resolve asset from Horizon ───────────────────────────────────────────────

export async function resolveAsset(
  code: string,
  network: Network,
): Promise<StellarAsset[]> {
  if (code.toUpperCase() === 'XLM') {
    return [{ code: 'XLM', issuer: null, name: 'Stellar Lumens', decimals: 7 }]
  }
  const server = getServer(network)
  const records = await server
    .assets()
    .forCode(code.toUpperCase())
    .limit(5)
    .call()
  return records.records.map((r) => ({
    code: r.asset_code,
    issuer: r.asset_issuer,
    name: r.asset_code,
    decimals: 7,
  }))
}

// ─── Find payment paths ───────────────────────────────────────────────────────

export async function findPaymentPaths(
  sourcePublicKey: string,
  destinationAsset: StellarAsset,
  destinationAmount: string,
  network: Network,
): Promise<PathHop[][]> {
  const server = getServer(network)
  const destAsset = toStellarAsset(destinationAsset)

  const result = await server
    .strictReceivePaths(sourcePublicKey, destAsset, destinationAmount)
    .call()

  return result.records.map((r) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (r.path || []).map((p: any) => ({
      assetCode: p.asset_type === 'native' ? 'XLM' : p.asset_code,
      assetIssuer: p.asset_type === 'native' ? null : p.asset_issuer,
    })),
  )
}

export type { MemoType }
