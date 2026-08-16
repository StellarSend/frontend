import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TransactionBuilder, Keypair, Networks } from '@stellar/stellar-sdk'
import {
  buildBatchPaymentTransaction,
  getNetworkPassphrase,
  MAX_BATCH_RECIPIENTS,
} from './stellar'

const PUBLIC_KEY = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
const XLM_ASSET = { code: 'XLM', issuer: null, name: 'XLM', decimals: 7 }
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
})