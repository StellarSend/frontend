import { queryClient } from "@/app/providers/QueryProvider"
import { CONTRACTS } from "@/app/config/contracts"
import { NETWORK } from "@/app/config/network"
import {
  buildApproveTransaction,
  buildCreateDepositTransaction,
  buildCreateWithdrawalTransaction,
  checkAllowance,
  parseSorobanError,
} from "@/lib/contracts"
import { prepareAndSign } from "@/lib/soroban/tx-builder"
import { sendAndPoll } from "@/lib/tx-builder"
import { walletKit } from "@/features/wallet/lib/wallet-kit"
import { submitTx } from "@/shared/hooks/useTxSubmit"
import { queryKeys } from "@/shared/lib/query-keys"
import type { PoolMarketConfig } from "../data/markets"

type PoolTxResult = {
  hash: string
  expectedAmount: bigint | null
}

function ensurePoolContracts() {
  if (!CONTRACTS.depositHandler) {
    throw new Error("Deposit handler is not deployed on this network.")
  }
  if (!CONTRACTS.withdrawalHandler) {
    throw new Error("Withdrawal handler is not deployed on this network.")
  }
}

async function approveIfNeeded(args: {
  token: string
  owner: string
  spender: string
  amount: bigint
  symbol: string
}) {
  if (args.amount <= 0n) return

  const allowance = await checkAllowance(args.token, args.owner, args.spender)
  if (allowance >= args.amount) return

  await submitTx(
    async () => {
      const tx = await buildApproveTransaction(
        args.token,
        args.owner,
        args.spender,
        args.amount,
      )
      return prepareAndSign(tx, walletKit, NETWORK.networkPassphrase)
    },
    {
      loadingMessage: `Approving ${args.symbol}...`,
      successMessage: `${args.symbol} approved`,
      successDescription: (hash) => `Tx: ${hash.slice(0, 8)}...`,
      onError: parseSorobanError,
    },
  )
}

function invalidatePoolQueries(market: PoolMarketConfig, account: string) {
  queryClient.invalidateQueries({
    queryKey: queryKeys.pools.row(market.marketToken, account),
  })
  queryClient.invalidateQueries({ queryKey: ["tokenBalances", account] })
}

export async function submitPoolDeposit(args: {
  account: string
  market: PoolMarketConfig
  longTokenAmount: bigint
  shortTokenAmount: bigint
  minMarketTokens?: bigint
}): Promise<PoolTxResult> {
  ensurePoolContracts()

  await approveIfNeeded({
    token: args.market.longToken,
    owner: args.account,
    spender: CONTRACTS.depositHandler,
    amount: args.longTokenAmount,
    symbol: args.market.longSymbol,
  })

  await approveIfNeeded({
    token: args.market.shortToken,
    owner: args.account,
    spender: CONTRACTS.depositHandler,
    amount: args.shortTokenAmount,
    symbol: args.market.shortSymbol,
  })

  let expectedAmount: bigint | null = null
  const hash = await submitTx(
    async () => {
      const built = await buildCreateDepositTransaction({
        caller: args.account,
        market: args.market.marketToken,
        initialLongToken: args.market.longToken,
        initialShortToken: args.market.shortToken,
        longTokenAmount: args.longTokenAmount,
        shortTokenAmount: args.shortTokenAmount,
        minMarketTokens: args.minMarketTokens ?? 0n,
        executionFee: 0n,
      })
      expectedAmount = built.expectedGm
      return prepareAndSign(built.tx, walletKit, NETWORK.networkPassphrase)
    },
    {
      loadingMessage: "Creating pool deposit...",
      successMessage: "Deposit queued",
      successDescription: (txHash) =>
        `Tx: ${txHash.slice(0, 8)}... Keeper execution usually completes within ~60s.`,
      execute: async () => {
        const built = await buildCreateDepositTransaction({
          caller: args.account,
          market: args.market.marketToken,
          initialLongToken: args.market.longToken,
          initialShortToken: args.market.shortToken,
          longTokenAmount: args.longTokenAmount,
          shortTokenAmount: args.shortTokenAmount,
          minMarketTokens: args.minMarketTokens ?? 0n,
          executionFee: 0n,
        })
        expectedAmount = built.expectedGm
        const signedXdr = await prepareAndSign(built.tx, walletKit, NETWORK.networkPassphrase)
        return (await sendAndPoll(signedXdr, { timeoutMs: 60_000 })).hash
      },
      onSuccess: () => invalidatePoolQueries(args.market, args.account),
      onError: parseSorobanError,
    },
  )

  return { hash, expectedAmount }
}

export async function submitPoolWithdrawal(args: {
  account: string
  market: PoolMarketConfig
  marketTokenAmount: bigint
  minLongTokenAmount?: bigint
  minShortTokenAmount?: bigint
}): Promise<PoolTxResult> {
  ensurePoolContracts()

  await approveIfNeeded({
    token: args.market.marketToken,
    owner: args.account,
    spender: CONTRACTS.withdrawalHandler,
    amount: args.marketTokenAmount,
    symbol: "GM",
  })

  let expectedLongTokens: bigint | null = null
  let expectedShortTokens: bigint | null = null
  const hash = await submitTx(
    async () => {
      const built = await buildCreateWithdrawalTransaction({
        caller: args.account,
        market: args.market.marketToken,
        marketTokenAmount: args.marketTokenAmount,
        minLongTokenAmount: args.minLongTokenAmount ?? 0n,
        minShortTokenAmount: args.minShortTokenAmount ?? 0n,
        executionFee: 0n,
      })
      expectedLongTokens = built.expectedLongTokens
      expectedShortTokens = built.expectedShortTokens
      return prepareAndSign(built.tx, walletKit, NETWORK.networkPassphrase)
    },
    {
      loadingMessage: "Creating pool withdrawal...",
      successMessage: "Withdrawal queued",
      successDescription: (txHash) =>
        `Tx: ${txHash.slice(0, 8)}... Keeper execution usually completes within ~60s.`,
      execute: async () => {
        const built = await buildCreateWithdrawalTransaction({
          caller: args.account,
          market: args.market.marketToken,
          marketTokenAmount: args.marketTokenAmount,
          minLongTokenAmount: args.minLongTokenAmount ?? 0n,
          minShortTokenAmount: args.minShortTokenAmount ?? 0n,
          executionFee: 0n,
        })
        expectedLongTokens = built.expectedLongTokens
        expectedShortTokens = built.expectedShortTokens
        const signedXdr = await prepareAndSign(built.tx, walletKit, NETWORK.networkPassphrase)
        return (await sendAndPoll(signedXdr, { timeoutMs: 60_000 })).hash
      },
      onSuccess: () => invalidatePoolQueries(args.market, args.account),
      onError: parseSorobanError,
    },
  )

  return {
    hash,
    expectedAmount:
      expectedLongTokens == null && expectedShortTokens == null
        ? null
        : (expectedLongTokens ?? 0n) + (expectedShortTokens ?? 0n),
  }
}
