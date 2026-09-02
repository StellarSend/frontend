import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  TransactionBuilder,
  Transaction,
  Keypair,
  Networks,
  Operation,
  Asset,
} from '@stellar/stellar-sdk'
import {
  buildPaymentTransaction,
  buildPathPaymentTransaction,
  buildBatchPaymentTransaction,
  buildTransactionFromQuote,
  submitTransaction,
  estimateFee,
  toStellarAsset,
  pathHopToAsset,
  assetFromCodeIssuer,
  isValidStellarAddress,
  truncateAddress,
  formatAmount,
  formatXLM,
  formatUSD,
  applySlippage,
  getServer,
  getNetworkPassphrase,
  MAX_BATCH_RECIPIENTS,
} from './stellar'
import type { Quote, PathHop, StellarAsset } from '@/types'

const PUBLIC_KEY = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
const DEST_KEY = 'GDWM4OJJYVZYQB3KTQA64WJTQO2UORWYZTJPTABWONQRSB4HOGP2JE3V'
const ISSUER_KEY = 'GBMPAKYJZXA436R5AANQESPJAUYSB3YAAKR6EURJIDD3HNK6EWFYLY3K'

const XLM_ASSET: StellarAsset = { code: 'XLM', issuer: null, name: 'XLM', decimals: 7 }
const USDC_ASSET: StellarAsset = {
  code: 'USDC',
  issuer: ISSUER_KEY,
  name: 'USD Coin',
  decimals: 7,
}

const PER_OPERATION_FEE = '100'

// Horizon.Server only talks to the network; stub it so estimateFee() and
// loadAccount() are deterministic and never hit real Horizon endpoints.
const { feeStats, loadAccount, submitTxMock, assetsMock, strictReceivePathsMock } =
  vi.hoisted(() => ({
    feeStats: vi.fn(),
    loadAccount: vi.fn(),
    submitTxMock: vi.fn(),
    assetsMock: vi.fn(),
    strictReceivePathsMock: vi.fn(),
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
    submitTransaction(tx: any) {
      return submitTxMock(tx)
    }
    assets() {
      return assetsMock()
    }
    strictReceivePaths(source: any, dest: any, amount: any) {
      return strictReceivePathsMock(source, dest, amount)
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

describe('stellar lib unit tests', () => {
  beforeEach(() => {
    feeStats.mockReset()
    loadAccount.mockReset()
    submitTxMock.mockReset()
    feeStats.mockResolvedValue({ fee_charged: { p70: PER_OPERATION_FEE } })
    loadAccount.mockResolvedValue(mockSourceAccount)
  })

  describe('servers, passphrases and fee estimation', () => {
    it('returns appropriate Horizon server and network passphrases', () => {
      const testServer = getServer('testnet')
      const publicServer = getServer('mainnet')
      expect(testServer).toBeDefined()
      expect(publicServer).toBeDefined()

      expect(getNetworkPassphrase('testnet')).toBe(Networks.TESTNET)
      expect(getNetworkPassphrase('mainnet')).toBe(Networks.PUBLIC)
    })

    it('estimateFee returns p70 fee rate or fallback to BASE_FEE', async () => {
      const fee = await estimateFee('testnet')
      expect(fee).toBe(PER_OPERATION_FEE)

      feeStats.mockRejectedValueOnce(new Error('Network failure'))
      const fallbackFee = await estimateFee('testnet')
      expect(fallbackFee).toBe('100')
    })
  })

  describe('asset helpers', () => {
    it('toStellarAsset correctly maps native and issued assets', () => {
      const native = toStellarAsset(XLM_ASSET)
      expect(native.isNative()).toBe(true)

      const issued = toStellarAsset(USDC_ASSET)
      expect(issued.isNative()).toBe(false)
      expect(issued.getCode()).toBe('USDC')
      expect(issued.getIssuer()).toBe(ISSUER_KEY)
    })

    it('toStellarAsset throws when non-native asset lacks issuer', () => {
      expect(() =>
        toStellarAsset({ code: 'USDC', issuer: null, name: 'USDC', decimals: 7 }),
      ).toThrow('Non-native asset "USDC" is missing issuer')
    })

    it('pathHopToAsset and assetFromCodeIssuer validate appropriately', () => {
      const nativeHop: PathHop = { assetCode: 'XLM', assetIssuer: null }
      const issuedHop: PathHop = { assetCode: 'USDC', assetIssuer: ISSUER_KEY }
      expect(pathHopToAsset(nativeHop).isNative()).toBe(true)
      expect(pathHopToAsset(issuedHop).getCode()).toBe('USDC')
      expect(() => pathHopToAsset({ assetCode: 'EUR', assetIssuer: null })).toThrow(
        'Path hop asset "EUR" missing issuer',
      )

      expect(assetFromCodeIssuer('XLM', null).isNative()).toBe(true)
      expect(assetFromCodeIssuer('USDC', ISSUER_KEY).getCode()).toBe('USDC')
      expect(() => assetFromCodeIssuer('EUR', null)).toThrow('Asset EUR requires an issuer')
    })
  })

  describe('buildPaymentTransaction', () => {
    it('constructs a valid native payment transaction with fee and timeout', async () => {
      const xdr = await buildPaymentTransaction({
        sourcePublicKey: PUBLIC_KEY,
        destinationAddress: DEST_KEY,
        asset: XLM_ASSET,
        amount: '25.5000000',
        network: 'testnet',
        memo: 'Test Native Payment',
      })

      const tx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET) as Transaction
      expect(tx.operations).toHaveLength(1)
      const op = tx.operations[0] as Operation.Payment
      expect(op.type).toBe('payment')
      expect(op.destination).toBe(DEST_KEY)
      expect(op.amount).toBe('25.5000000')
      expect(op.asset.isNative()).toBe(true)
      expect(tx.memo.type).toBe('text')
      expect(tx.memo.value?.toString()).toBe('Test Native Payment')
    })

    it('constructs a payment with numeric memo detected as ID', async () => {
      const xdr = await buildPaymentTransaction({
        sourcePublicKey: PUBLIC_KEY,
        destinationAddress: DEST_KEY,
        asset: USDC_ASSET,
        amount: '10.0000000',
        network: 'mainnet',
        memo: '123456789',
      })

      const tx = TransactionBuilder.fromXDR(xdr, Networks.PUBLIC) as Transaction
      expect(tx.operations).toHaveLength(1)
      const op = tx.operations[0] as Operation.Payment
      expect(op.asset.getCode()).toBe('USDC')
      expect(tx.memo.type).toBe('id')
      expect(tx.memo.value).toBe('123456789')
    })
  })

  describe('buildPathPaymentTransaction', () => {
    it('constructs a path payment with strict send operation', async () => {
      const path: PathHop[] = [{ assetCode: 'XLM', assetIssuer: null }]
      const xdr = await buildPathPaymentTransaction({
        sourcePublicKey: PUBLIC_KEY,
        destinationAddress: DEST_KEY,
        sendAsset: USDC_ASSET,
        destAsset: XLM_ASSET,
        sendAmount: '50.0000000',
        destMin: '48.5000000',
        path,
        network: 'testnet',
        memo: 'Path Memo',
      })

      const tx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET) as Transaction
      expect(tx.operations).toHaveLength(1)
      const op = tx.operations[0] as Operation.PathPaymentStrictSend
      expect(op.type).toBe('pathPaymentStrictSend')
      expect(op.sendAsset.getCode()).toBe('USDC')
      expect(op.sendAmount).toBe('50.0000000')
      expect(op.destAsset.isNative()).toBe(true)
      expect(op.destMin).toBe('48.5000000')
      expect(op.destination).toBe(DEST_KEY)
      expect(op.path).toHaveLength(1)
    })
  })

  describe('buildTransactionFromQuote', () => {
    it('routes to direct payment when quote has no path hops', async () => {
      const quote: Quote = {
        id: 'quote-1',
        sourceAsset: XLM_ASSET,
        destinationAsset: XLM_ASSET,
        sendAmount: '10.0000000',
        receiveAmount: '10.0000000',
        exchangeRate: '1.0',
        networkFee: '0.00001',
        serviceFee: '0',
        totalFee: '0.00001',
        estimatedSeconds: 5,
        slippageTolerance: '1',
        priceImpact: '0',
        path: [],
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      }

      const xdr = await buildTransactionFromQuote(
        quote,
        PUBLIC_KEY,
        DEST_KEY,
        'testnet',
        'Direct Quote',
      )

      const tx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET) as Transaction
      expect(tx.operations[0].type).toBe('payment')
    })

    it('routes to path payment when quote has path hops and applies slippage', async () => {
      const quote: Quote = {
        id: 'quote-2',
        sourceAsset: USDC_ASSET,
        destinationAsset: XLM_ASSET,
        sendAmount: '10.0000000',
        receiveAmount: '100.0000000',
        exchangeRate: '10.0',
        networkFee: '0.00001',
        serviceFee: '0',
        totalFee: '0.00001',
        estimatedSeconds: 5,
        slippageTolerance: '2.5',
        priceImpact: '0.1',
        path: [{ assetCode: 'XLM', assetIssuer: null }],
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      }

      const xdr = await buildTransactionFromQuote(
        quote,
        PUBLIC_KEY,
        DEST_KEY,
        'testnet',
        'Path Quote',
      )

      const tx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET) as Transaction
      expect(tx.operations[0].type).toBe('pathPaymentStrictSend')
      const op = tx.operations[0] as Operation.PathPaymentStrictSend
      // 100 * (1 - 0.025) = 97.5000000
      expect(op.destMin).toBe('97.5000000')
    })
  })

  describe('buildBatchPaymentTransaction', () => {
    it('charges a total fee that scales linearly with the number of recipients', async () => {
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

  describe('submitTransaction', () => {
    it('submits valid signed transaction XDR to Horizon server', async () => {
      submitTxMock.mockResolvedValueOnce({
        hash: 'tx-mock-hash-12345',
        ledger: 123456,
      })

      const xdr = await buildPaymentTransaction({
        sourcePublicKey: PUBLIC_KEY,
        destinationAddress: DEST_KEY,
        asset: XLM_ASSET,
        amount: '1.0000000',
        network: 'testnet',
      })

      const res = await submitTransaction(xdr, 'testnet')
      expect(res.hash).toBe('tx-mock-hash-12345')
      expect(res.ledger).toBe(123456)
    })
  })

  describe('validation and formatting utilities', () => {
    it('isValidStellarAddress correctly validates public keys', () => {
      expect(isValidStellarAddress(PUBLIC_KEY)).toBe(true)
      expect(isValidStellarAddress('invalid-key')).toBe(false)
      expect(isValidStellarAddress('')).toBe(false)
    })

    it('truncateAddress formats start and end of address', () => {
      expect(truncateAddress(PUBLIC_KEY, 4)).toBe('GBBD...FLA5')
      expect(truncateAddress('')).toBe('')
    })

    it('formatAmount, formatXLM, formatUSD formats numbers and currency', () => {
      expect(formatAmount(1234.5678, 2)).toBe('1,234.57')
      expect(formatAmount('invalid')).toBe('—')
      expect(formatXLM('100.5')).toBe('100.5000 XLM')
      expect(formatUSD('2500')).toBe('$2,500.00')
      expect(formatUSD('invalid')).toBe('—')
    })

    it('applySlippage calculates minimum amounts accurately', () => {
      expect(applySlippage('100.0000000', '1')).toBe('99.0000000')
      expect(applySlippage('50.0000000', '0.5')).toBe('49.7500000')
    })
  })
})
