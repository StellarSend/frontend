# Pools Page — Deposit / Withdraw Integration

This note is for the frontend developer wiring up the **Deposit** and **Withdraw** buttons on the Pools page. Both buttons are currently rendered but disabled in `pool-actions.tsx`.

---

## High-Level Architecture

SO4 uses a **two-step, keeper-executed** model (same as GMX Synthetics on EVM):

```
User (browser)                    Oracle Keeper (Cloudflare Worker)
─────────────────────────────     ──────────────────────────────────
1. approve(depositHandler, amt)
2. create_deposit(params)
   → deposit stored on-chain         [every 60 s, cron trigger]
   → returns deposit key          3. fetch prices from Binance/Pyth
                                  4. oracle.set_prices(signedPrices)
                                  5. depositHandler.execute_deposit(key)
                                     → mints GM tokens to receiver
```

**The user never calls `execute_deposit`.** The oracle keeper does it automatically. The user just creates the deposit request and waits (~60 s for the next cron tick).

---

## Contract Addresses (testnet)

All addresses are already in `src/app/config/contracts.ts` via `CONTRACTS.*`.

```
depositHandler   CDWOFIP4YQJGMCYAOWLSRBAWN2OTJUG2I5WOFC32O2TX2SRU56RWBE5C
oracle           CBEMTV23SIJJBIST3V5HTMWHR4MHYGHNBIG4M26U4LGUJTWZXTFSVQEY
exchangeRouter   CBD6BQSQFROWIIT5QCYN7KL5LJJWUIH7CEWUSZIFMUJO6NPXE6CVGYNW

Oracle keeper URL: https://oracle.biscotti-proxy-worker.workers.dev
```

Market tokens (the LP token the user receives):
```
TWBTC/TUSDC   CDDVSLBGGDV2UOFN5W72R4LW7ABYL7H7ZWVSFHGMXXB3D52ZYANC5G3L
TETH/TUSDC    CCBUUSYZJTGVA6PYUNQDFPZFHTBZ2QSHOUO7YAGRQVA46T3ZLSIYULS4
TXLM/TUSDC    CDIBR7BDCDWGAG3CC6PBKRSLMISPYKNDGE57DCZO5TMTLZK34TMGKFQQ
```

---

## Token Amounts & Precision

- **All token amounts** use **7 decimal places** (Stellar standard).
  - `1.0 TWBTC` = `10_000_000` raw units (1 × 10^7)
  - `1.0 TUSDC` = `10_000_000` raw units
- **Never** divide by 10^18 or 10^6 — everything is 10^7 on this chain.
- Pool prices from the oracle are in **FLOAT_PRECISION = 10^30** units, but the frontend doesn't need to deal with that directly.

---

## Step-by-Step: Wiring the Deposit Button

### 1. Collect user input

The user chooses:
- Which market (TWBTC/TUSDC, TETH/TUSDC, or TXLM/TUSDC)
- Long token amount (e.g. 0.1 TWBTC)
- Short token amount (e.g. 100 TUSDC)
- `minMarketTokens` (slippage protection — use `0n` for testnet; for prod compute from current pool value)

### 2. Check and request token approvals

The `depositHandler` contract needs a SEP-41 allowance to pull tokens from the user's wallet.

```typescript
import { CONTRACTS } from "@/app/config/contracts"
import { checkAllowance, buildApproveTransaction } from "@/lib/contracts"
import { prepareAndSign } from "@/lib/soroban/tx-builder"

const longAmountRaw  = BigInt(Math.round(longAmount  * 1e7))
const shortAmountRaw = BigInt(Math.round(shortAmount * 1e7))

// Check current allowance for long token
const allowance = await checkAllowance(market.longToken, walletPublicKey, CONTRACTS.depositHandler)

if (allowance < longAmountRaw) {
  const approveTx = await buildApproveTransaction(
    market.longToken,
    walletPublicKey,
    CONTRACTS.depositHandler,
    longAmountRaw,
  )
  const signedXdr = await prepareAndSign(approveTx, wallet, NETWORK.networkPassphrase)
  await sorobanRpc.sendTransaction(new Transaction(signedXdr, NETWORK.networkPassphrase))
}

// Repeat for short token if different from long token (all current markets: long ≠ short)
```

### 3. Create the deposit

`buildCreateDepositTransaction` is already implemented in `src/lib/contracts.ts`.

```typescript
import { buildCreateDepositTransaction } from "@/lib/contracts"
import type { ExchangeCreateDepositParams } from "@workspace/contracts"

const params: ExchangeCreateDepositParams = {
  receiver:          walletPublicKey,     // receives the GM tokens
  market:            market.marketToken,  // the LP token contract address
  initialLongToken:  market.longToken,
  initialShortToken: market.shortToken,
  longTokenAmount:   longAmountRaw,
  shortTokenAmount:  shortAmountRaw,
  minMarketTokens:   0n,                  // set to >0 for slippage protection
  executionFee:      0n,                  // no fee on testnet
}

const createDepositTx = await buildCreateDepositTransaction(params)
const signedXdr = await prepareAndSign(createDepositTx, wallet, NETWORK.networkPassphrase)
const result = await sorobanRpc.sendTransaction(new Transaction(signedXdr, NETWORK.networkPassphrase))
```

After this transaction lands, the deposit is queued. The oracle keeper auto-executes it within ~60 seconds.

### 4. Show a pending state

The user needs feedback that their deposit is processing:

```typescript
// After create_deposit lands, show a "Deposit pending — keeper will execute within ~60s" banner.
// You can poll depositHandler.get_deposit(key) to check if it still exists.
// When it returns null, the deposit was executed and GM tokens are in the user's wallet.
```

To get the deposit key from the transaction result, read `returnValue` from the simulation result — it's a `BytesN<32>` hex string.

---

## Step-by-Step: Wiring the Withdraw Button

Withdrawals follow the same two-step pattern.

```typescript
import { buildCreateWithdrawalTransaction } from "@/lib/contracts"
import type { ExchangeCreateWithdrawalParams } from "@workspace/contracts"

const gmAmountRaw = BigInt(Math.round(gmAmount * 1e7))

// 1. Approve withdrawalHandler to spend GM tokens
const approveTx = await buildApproveTransaction(
  market.marketToken,
  walletPublicKey,
  CONTRACTS.withdrawalHandler,
  gmAmountRaw,
)
// ... sign and send ...

// 2. Create withdrawal
const params: ExchangeCreateWithdrawalParams = {
  receiver:             walletPublicKey,
  market:               market.marketToken,
  marketTokenAmount:    gmAmountRaw,
  minLongTokenAmount:   0n,
  minShortTokenAmount:  0n,
  executionFee:         0n,
}

const createWithdrawalTx = await buildCreateWithdrawalTransaction(params)
// ... sign and send ...
```

The oracle keeper will execute it within ~60 seconds.

---

## What the Keeper Does Automatically

The Cloudflare Worker at `https://oracle.biscotti-proxy-worker.workers.dev` runs every minute and:

1. Fetches live prices from Binance + Coinbase + Pyth
2. Signs them with the keeper's ed25519 key
3. Calls `oracle.set_prices(keeper, signedPrices)` on-chain
4. Scans for pending deposits and calls `depositHandler.execute_deposit(keeper, key)` for each one

**The frontend does not need to call execute_deposit.** Just create the deposit and show a pending state.

You can hit `GET /prices` on the oracle worker to see current prices and their `ledger_seq`:

```
curl https://oracle.biscotti-proxy-worker.workers.dev/prices
```

---

## Pool Data: What's Already Working

`src/features/pools/data/markets.ts` — all 3 markets are already defined.

`src/features/pools/hooks/use-pools-data.ts` — reads on-chain pool values via the `syntheticsReaderClient`.

**What's missing:**
- [ ] `pool-actions.tsx` — enable Deposit and Withdraw buttons and open a modal
- [ ] A deposit modal component (amount inputs, slippage, confirmation)
- [ ] A withdrawal modal component  
- [ ] A pending-deposit status indicator (poll `depositHandler.get_deposit(key)`)
- [ ] User GM token balance display (call `tokenClient.balance(walletPublicKey)` on the market token contract)

---

## Reading User's GM Token Balance

```typescript
import { getTokenClient } from "@/lib/contracts"

const gmClient = getTokenClient(market.marketToken, walletPublicKey)
const balance  = await gmClient.balance()
// balance is i128 in raw units — divide by 1e7 to display
```

---

## Quick Checklist Before Going Live

1. Set `VITE_DEPOSIT_HANDLER` in `.env` to `CDWOFIP4YQJGMCYAOWLSRBAWN2OTJUG2I5WOFC32O2TX2SRU56RWBE5C`
2. Set `VITE_ORACLE` to `CBEMTV23SIJJBIST3V5HTMWHR4MHYGHNBIG4M26U4LGUJTWZXTFSVQEY`
3. Confirm `CONTRACTS.depositHandler` and `CONTRACTS.withdrawalHandler` are non-empty
4. Confirm wallet is connected and `walletPublicKey` is available before enabling buttons
5. Test on testnet: get test tokens from the Faucet page, then deposit into TXLM/TUSDC (cheapest market, ~0.02 XLM = 1 TXLM)
6. Wait ~60 s and confirm GM token balance increases in wallet
