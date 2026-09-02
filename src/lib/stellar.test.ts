import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TransactionBuilder, Keypair, Networks } from '@stellar/stellar-sdk'
import {
  buildBatchPaymentTransaction,
  buildMemo,
  buildPaymentTransaction,
  buildPathPaymentTransaction,
  getNetworkPassphrase,
  MAX_BATCH_RECIPIENTS,
} from './stellar'

const PUBLIC_KEY = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
const XLM_ASSET = { code: 'XLM', issuer: null, name: 'XLM', decimals: 7 }
const USDC_ASSET = {
  code: 'USDC',
  issuer: PUBLIC_KEY,
  name: 'USD Coin',
  decimals: 7,
}
const PER_OPERATION_FEE = '100'

// Horizon.Server only talks to the network; stub it so estimateFee() and
// loadAccount() are deterministic and never hit real Horizon endpoints.
const { feeStats, loadAccount } = vi.hoisted(() => ({
  feeStats: vi.fn(),
  loadAccount: vi.fn(),
}))

vi.mock('@stellar/stellar-sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@stellar/stellar-sdk')>()
  class FakeHorizonServer {
    feeStats() {
      return feeStats()
    }
    loadAccount() {
      return loadAccount()
    }
  }
  return {
    ...actual,
    Horizon: { ...actual.Horizon, Server: FakeHorizonServer },
  }
})

const mockSourceAccount = {
  accountId: () => PUBLIC_KEY,
  sequenceNumber: () => 1,
  incrementSequenceNumber: () => {},
}

function makeRecipients(count: number) {
  return Array.from({ length: count }, () => ({
    destinationAddress: Keypair.random().publicKey(),
    amount: '1.0000000',
  }))
}

function getTxMemo(xdr: string) {
  const tx = TransactionBuilder.fromXDR(xdr, getNetworkPassphrase('testnet'))
  // fromXDR returns Transaction | FeeBumpTransaction; we only build regular
  // transactions in these tests, so memo is always present on the result.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tx as any).memo as { type: string; value: string | Buffer | number }
}

// ─── buildMemo tests ──────────────────────────────────────────────────────────

describe('buildMemo', () => {
  it('returns undefined for empty memo', () => {
    expect(buildMemo('', 'text')).toBeUndefined()
    expect(buildMemo('   ', 'text')).toBeUndefined()
    expect(buildMemo('\t\n', 'id')).toBeUndefined()
  })

  it('creates MEMO_TEXT for numeric string when type is text', () => {
    const memo = buildMemo('4291001', 'text')
    expect(memo).toBeDefined()
    expect(memo?.type).toBe('text')
    expect(memo?.value).toBe('4291001')
  })

  it('creates MEMO_TEXT for non-numeric string when type is text', () => {
    const memo = buildMemo('invoice-123', 'text')
    expect(memo).toBeDefined()
    expect(memo?.type).toBe('text')
    expect(memo?.value).toBe('invoice-123')
  })

  it('truncates text memo to 28 characters', () => {
    const longMemo = 'a'.repeat(50)
    const memo = buildMemo(longMemo, 'text')
    expect(memo).toBeDefined()
    expect(memo?.value).toBe('a'.repeat(28))
    expect(memo?.value).toHaveLength(28)
  })

  it('creates MEMO_ID for valid numeric string when type is id', () => {
    const memo = buildMemo('4291001', 'id')
    expect(memo).toBeDefined()
    expect(memo?.type).toBe('id')
    expect(memo?.value).toBe('4291001')
  })

  it('accepts maximum valid uint64 for MEMO_ID', () => {
    const maxUint64 = '18446744073709551615'
    const memo = buildMemo(maxUint64, 'id')
    expect(memo).toBeDefined()
    expect(memo?.type).toBe('id')
    expect(memo?.value).toBe(maxUint64)
  })

  it('rejects non-numeric string for MEMO_ID', () => {
    expect(() => buildMemo('abc123', 'id')).toThrow('Memo ID must contain only digits')
    expect(() => buildMemo('invoice-123', 'id')).toThrow('Memo ID must contain only digits')
    expect(() => buildMemo('123.456', 'id')).toThrow('Memo ID must contain only digits')
  })

  it('rejects uint64 overflow for MEMO_ID', () => {
    const overflow = '18446744073709551616' // max + 1
    expect(() => buildMemo(overflow, 'id')).toThrow(
      'Memo ID must not exceed 18446744073709551615 (max unsigned 64-bit integer)',
    )
  })

  it('rejects extremely large numbers for MEMO_ID', () => {
    expect(() => buildMemo('999999999999999999999999', 'id')).toThrow()
  })

  it('handles whitespace trimming for text memo', () => {
    const memo = buildMemo('  spaced  ', 'text')
    expect(memo?.value).toBe('spaced')
  })

  it('handles whitespace trimming for id memo', () => {
    const memo = buildMemo('  123  ', 'id')
    expect(memo?.value).toBe('123')
  })

  it('creates valid Stellar Memo objects', () => {
    const textMemo = buildMemo('test', 'text')
    const idMemo = buildMemo('123', 'id')

    // Both should have the Memo interface methods
    expect(textMemo?.toXDRObject).toBeDefined()
    expect(idMemo?.toXDRObject).toBeDefined()
  })
})

describe('buildBatchPaymentTransaction', () => {
  beforeEach(() => {
    feeStats.mockReset()
    loadAccount.mockReset()
    feeStats.mockResolvedValue({ fee_charged: { p70: PER_OPERATION_FEE } })
    loadAccount.mockResolvedValue(mockSourceAccount)
  })

  it('charges a total fee that scales linearly with the number of recipients', async () => {
    // estimateFee() returns a per-operation fee. TransactionBuilder.build()
    // multiplies it by the operation count internally, so for an N-recipient
    // batch the on-chain fee field must be estimateFee x N — never x N x N.
    for (const count of [1, 10, 100]) {
      const xdr = await buildBatchPaymentTransaction({
        sourcePublicKey: PUBLIC_KEY,
        asset: XLM_ASSET,
        recipients: makeRecipients(count),
        network: 'testnet',
      })

      const tx = TransactionBuilder.fromXDR(xdr, getNetworkPassphrase('testnet'))
      expect(Number(tx.fee)).toBe(Number(PER_OPERATION_FEE) * count)
    }
  })

  it('does not double-count the recipient multiplier on top of the SDK fee ramp', async () => {
    // Regression: pre-multiplying the per-operation fee *and* letting the SDK
    // multiply it again by operations.length produced estimateFee x N x N.
    const count = 10
    const xdr = await buildBatchPaymentTransaction({
      sourcePublicKey: PUBLIC_KEY,
      asset: XLM_ASSET,
      recipients: makeRecipients(count),
      network: 'testnet',
    })

    const tx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET)
    expect(Number(tx.fee)).not.toBe(Number(PER_OPERATION_FEE) * count * count)
  })

  it('rejects a batch with no recipients', async () => {
    await expect(
      buildBatchPaymentTransaction({
        sourcePublicKey: PUBLIC_KEY,
        asset: XLM_ASSET,
        recipients: [],
        network: 'testnet',
      }),
    ).rejects.toThrow('A batch payment needs at least one recipient')
  })

  it(`rejects a batch larger than ${MAX_BATCH_RECIPIENTS} recipients`, async () => {
    await expect(
      buildBatchPaymentTransaction({
        sourcePublicKey: PUBLIC_KEY,
        asset: XLM_ASSET,
        recipients: makeRecipients(MAX_BATCH_RECIPIENTS + 1),
        network: 'testnet',
      }),
    ).rejects.toThrow(`A batch payment supports at most ${MAX_BATCH_RECIPIENTS} recipients`)
  })

  // ─── Memo type handling tests ──────────────────────────────────────────────

  it('produces MEMO_TEXT for numeric memo when memoType is text (regression test)', async () => {
    const xdr = await buildBatchPaymentTransaction({
      sourcePublicKey: PUBLIC_KEY,
      asset: XLM_ASSET,
      recipients: makeRecipients(1),
      memo: '4291001',
      memoType: 'text',
      network: 'testnet',
    })

    const memo = getTxMemo(xdr)
    expect(memo.type).toBe('text')
    const memoValue = memo.value instanceof Buffer
      ? memo.value.toString('utf8')
      : memo.value
    expect(memoValue).toBe('4291001')
  })

  it('produces MEMO_ID for numeric memo when memoType is id', async () => {
    const xdr = await buildBatchPaymentTransaction({
      sourcePublicKey: PUBLIC_KEY,
      asset: XLM_ASSET,
      recipients: makeRecipients(1),
      memo: '4291001',
      memoType: 'id',
      network: 'testnet',
    })

    const memo = getTxMemo(xdr)
    expect(memo.type).toBe('id')
    expect(memo.value).toBe('4291001')
  })

  it('defaults to MEMO_TEXT when memoType is not specified', async () => {
    const xdr = await buildBatchPaymentTransaction({
      sourcePublicKey: PUBLIC_KEY,
      asset: XLM_ASSET,
      recipients: makeRecipients(1),
      memo: '4291001',
      network: 'testnet',
    })

    const memo = getTxMemo(xdr)
    expect(memo.type).toBe('text')
    const memoValue = memo.value instanceof Buffer
      ? memo.value.toString('utf8')
      : memo.value
    expect(memoValue).toBe('4291001')
  })

  it('throws when invalid MEMO_ID format is provided', async () => {
    await expect(
      buildBatchPaymentTransaction({
        sourcePublicKey: PUBLIC_KEY,
        asset: XLM_ASSET,
        recipients: makeRecipients(1),
        memo: 'abc123',
        memoType: 'id',
        network: 'testnet',
      }),
    ).rejects.toThrow('Memo ID must contain only digits')
  })

  it('throws when MEMO_ID exceeds uint64 maximum', async () => {
    await expect(
      buildBatchPaymentTransaction({
        sourcePublicKey: PUBLIC_KEY,
        asset: XLM_ASSET,
        recipients: makeRecipients(1),
        memo: '18446744073709551616', // max uint64 + 1
        memoType: 'id',
        network: 'testnet',
      }),
    ).rejects.toThrow('must not exceed')
  })

  it('handles empty memo correctly', async () => {
    const xdr = await buildBatchPaymentTransaction({
      sourcePublicKey: PUBLIC_KEY,
      asset: XLM_ASSET,
      recipients: makeRecipients(1),
      memo: '',
      memoType: 'text',
      network: 'testnet',
    })

    const tx = TransactionBuilder.fromXDR(xdr, getNetworkPassphrase('testnet'))
    // When memo is empty, no memo should be set
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((tx as any).memo.type).toBe('none')
  })
})

describe('buildPaymentTransaction memo handling', () => {
  beforeEach(() => {
    feeStats.mockReset()
    loadAccount.mockReset()
    feeStats.mockResolvedValue({ fee_charged: { p70: PER_OPERATION_FEE } })
    loadAccount.mockResolvedValue(mockSourceAccount)
  })

  it('produces MEMO_TEXT for numeric memo when memoType is text (regression test)', async () => {
    const xdr = await buildPaymentTransaction({
      sourcePublicKey: PUBLIC_KEY,
      destinationAddress: PUBLIC_KEY,
      asset: XLM_ASSET,
      amount: '1.0000000',
      memo: '4291001',
      memoType: 'text',
      network: 'testnet',
    })

    const memo = getTxMemo(xdr)
    expect(memo.type).toBe('text')
    const memoValue = memo.value instanceof Buffer
      ? memo.value.toString('utf8')
      : memo.value
    expect(memoValue).toBe('4291001')
  })

  it('produces MEMO_ID for numeric memo when memoType is id', async () => {
    const xdr = await buildPaymentTransaction({
      sourcePublicKey: PUBLIC_KEY,
      destinationAddress: PUBLIC_KEY,
      asset: XLM_ASSET,
      amount: '1.0000000',
      memo: '4291001',
      memoType: 'id',
      network: 'testnet',
    })

    const memo = getTxMemo(xdr)
    expect(memo.type).toBe('id')
    expect(memo.value).toBe('4291001')
  })

  it('defaults to MEMO_TEXT when memoType is not specified', async () => {
    const xdr = await buildPaymentTransaction({
      sourcePublicKey: PUBLIC_KEY,
      destinationAddress: PUBLIC_KEY,
      asset: XLM_ASSET,
      amount: '1.0000000',
      memo: '4291001',
      network: 'testnet',
    })

    const memo = getTxMemo(xdr)
    expect(memo.type).toBe('text')
    const memoValue = memo.value instanceof Buffer
      ? memo.value.toString('utf8')
      : memo.value
    expect(memoValue).toBe('4291001')
  })

  it('handles empty memo correctly', async () => {
    const xdr = await buildPaymentTransaction({
      sourcePublicKey: PUBLIC_KEY,
      destinationAddress: PUBLIC_KEY,
      asset: XLM_ASSET,
      amount: '1.0000000',
      memo: '',
      memoType: 'text',
      network: 'testnet',
    })

    const memo = getTxMemo(xdr)
    expect(memo.type).toBe('none')
  })
})

describe('buildPathPaymentTransaction memo handling', () => {
  beforeEach(() => {
    feeStats.mockReset()
    loadAccount.mockReset()
    feeStats.mockResolvedValue({ fee_charged: { p70: PER_OPERATION_FEE } })
    loadAccount.mockResolvedValue(mockSourceAccount)
  })

  it('produces MEMO_TEXT for numeric memo when memoType is text (regression test)', async () => {
    const xdr = await buildPathPaymentTransaction({
      sourcePublicKey: PUBLIC_KEY,
      destinationAddress: PUBLIC_KEY,
      sendAsset: USDC_ASSET,
      destAsset: XLM_ASSET,
      sendAmount: '10.0000000',
      destMin: '0.5000000',
      path: [{ assetCode: 'XLM', assetIssuer: null }],
      memo: '4291001',
      memoType: 'text',
      network: 'testnet',
    })

    const memo = getTxMemo(xdr)
    expect(memo.type).toBe('text')
    const memoValue = memo.value instanceof Buffer
      ? memo.value.toString('utf8')
      : memo.value
    expect(memoValue).toBe('4291001')
  })

  it('produces MEMO_ID for numeric memo when memoType is id', async () => {
    const xdr = await buildPathPaymentTransaction({
      sourcePublicKey: PUBLIC_KEY,
      destinationAddress: PUBLIC_KEY,
      sendAsset: USDC_ASSET,
      destAsset: XLM_ASSET,
      sendAmount: '10.0000000',
      destMin: '0.5000000',
      path: [{ assetCode: 'XLM', assetIssuer: null }],
      memo: '4291001',
      memoType: 'id',
      network: 'testnet',
    })

    const memo = getTxMemo(xdr)
    expect(memo.type).toBe('id')
    expect(memo.value).toBe('4291001')
  })

  it('defaults to MEMO_TEXT when memoType is not specified', async () => {
    const xdr = await buildPathPaymentTransaction({
      sourcePublicKey: PUBLIC_KEY,
      destinationAddress: PUBLIC_KEY,
      sendAsset: USDC_ASSET,
      destAsset: XLM_ASSET,
      sendAmount: '10.0000000',
      destMin: '0.5000000',
      path: [{ assetCode: 'XLM', assetIssuer: null }],
      memo: '4291001',
      network: 'testnet',
    })

    const memo = getTxMemo(xdr)
    expect(memo.type).toBe('text')
    const memoValue = memo.value instanceof Buffer
      ? memo.value.toString('utf8')
      : memo.value
    expect(memoValue).toBe('4291001')
  })

  it('handles empty memo correctly', async () => {
    const xdr = await buildPathPaymentTransaction({
      sourcePublicKey: PUBLIC_KEY,
      destinationAddress: PUBLIC_KEY,
      sendAsset: USDC_ASSET,
      destAsset: XLM_ASSET,
      sendAmount: '10.0000000',
      destMin: '0.5000000',
      path: [{ assetCode: 'XLM', assetIssuer: null }],
      memo: '',
      memoType: 'text',
      network: 'testnet',
    })

    const memo = getTxMemo(xdr)
    expect(memo.type).toBe('none')
  })
})