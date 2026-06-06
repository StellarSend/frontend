# Pool + Faucet Implementation Plan Guide

Date: June 5, 2026
Target app: `/home/sunny/zero/so4-market-project/interface`
Contract repo reference: `/home/sunny/zero/so4-market-project/contracts`

This guide is for the next frontend agent implementing a clean SO4 pool page and tightening the faucet page. It is based on:

- Local interface code under `apps/web/src/features/earn`, `apps/web/src/features/faucet`, `apps/web/src/features/trade`, and `packages/contracts`.
- Current deployed contract outputs from `/home/sunny/zero/so4-market-project/contracts/.deployed/frontend-testnet.{env,ts}`.
- GMX release branch pool page structure at `https://github.com/gmx-io/gmx-interface/tree/release/src/pages/Pools`.
- GMX source files: `Pools.tsx`, `PoolsCard.tsx`, `PoolsTimeRangeFilter.tsx`, and `usePoolsIsMobilePage.ts`.

## Executive Summary

The SO4 frontend already has an Earn page and some GM pool-shaped code, but it still uses symbolic market IDs like `BTC-BTC-USDC`, `ETH-ETH-USDC`, `BTC`, and `USDC`. The contracts now require real Soroban contract addresses. The faucet page works structurally, but it is stale: it is wired to an older faucet and only two tokens, while the active testnet deployment has one four-token faucet for `TUSDC`, `TWBTC`, `TETH`, and `TXLM`.

The pool page should be implemented as a real app page, not as another static mock inside Earn. Follow GMX's high-level layout pattern: a compact header with total pool TVL, a time-range filter, and reusable list/card components for GM pools. GLV must remain disabled or clearly unavailable until GLV contracts are deployed.

## Active Testnet Contracts And IDs

Source of truth from contracts repo:

- `/home/sunny/zero/so4-market-project/contracts/.deployed/frontend-testnet.env`
- `/home/sunny/zero/so4-market-project/contracts/.deployed/frontend-testnet.ts`
- `/home/sunny/zero/so4-market-project/contracts/.deployed/testnet.env`
- `/home/sunny/zero/so4-market-project/contracts/.deployed/tokens-testnet.env`

Protocol contracts:

```text
ROLE_STORE         = CBSUAIAMIFFS4AXQYZ7KR7FNO7IMKAPS5WF4DXANVXDTPKH2F7YUIN6Q
DATA_STORE         = CCZ3VKBEDLNBO2JM3EXL3SNBDJOV5BTN52FVQPER7F6D5GCE53PITQ3J
ORACLE             = CBABE5O7QJMXT2I42KHUV7ESNER3Z2BGJCF2QRKWMKVTCBEYFQNHV3J6
MARKET_FACTORY     = CBGX3EJFI3JRHSN5B533O2L5P57JFPTCRS55IPWFS5BNDXLJLXDWA5Z2
DEPOSIT_HANDLER    = CDWOFIP4YQJGMCYAOWLSRBAWN2OTJUG2I5WOFC32O2TX2SRU56RWBE5C
WITHDRAWAL_HANDLER = CCA5HRHMG6E6BVYRICSLZ5CK5KNPAAKXQ7XWDM34WWVGNHWHA26GRVVE
ORDER_HANDLER      = CC35OFZVWUTAZPV3B6UKSDVAVORZEWUUMOMTHO33H4YR4C5FKPEFODKY
EXCHANGE_ROUTER    = CBD6BQSQFROWIIT5QCYN7KL5LJJWUIH7CEWUSZIFMUJO6NPXE6CVGYNW
READER             = CC6OZUHF3LVO6PNP3V2EB36ORB3YSVYSH3LWD3RFLO4NUO3BYCXSWSYC
```

Faucet and test tokens:

```text
FAUCET = CCWXXBKXHHP5DXC6TYVIL22XUNHD5A75O6WM5D2KM5PY45IOV5VDMARJ
TUSDC  = CBAN5YU3KRDKPTQ2H76D6S7HQFPRBGUD524F65BUM2RQCITPTRLKWKES
TWBTC  = CCFTOPHUPSUDO2MB4X5D3XYJ2HRJ7NJPAW4UVPAVN7ZLE63EZLSMXDUO
TETH   = CAJ6BZKGFT47ALGMVFZZGAOXBV2RWIVYVCU4WJCQIURKRNXU346RWVAU
TXLM   = CAHNXBBSXVMGI6G3FUBY3OTNWKQ7434FDDEEE7ZT733WIW6NUZL4ONU6
```

Bootstrapped GM markets:

```text
TWBTC/TUSDC
  marketToken = CDDVSLBGGDV2UOFN5W72R4LW7ABYL7H7ZWVSFHGMXXB3D52ZYANC5G3L
  indexToken  = CCFTOPHUPSUDO2MB4X5D3XYJ2HRJ7NJPAW4UVPAVN7ZLE63EZLSMXDUO
  longToken   = CCFTOPHUPSUDO2MB4X5D3XYJ2HRJ7NJPAW4UVPAVN7ZLE63EZLSMXDUO
  shortToken  = CBAN5YU3KRDKPTQ2H76D6S7HQFPRBGUD524F65BUM2RQCITPTRLKWKES

TETH/TUSDC
  marketToken = CCBUUSYZJTGVA6PYUNQDFPZFHTBZ2QSHOUO7YAGRQVA46T3ZLSIYULS4
  indexToken  = CAJ6BZKGFT47ALGMVFZZGAOXBV2RWIVYVCU4WJCQIURKRNXU346RWVAU
  longToken   = CAJ6BZKGFT47ALGMVFZZGAOXBV2RWIVYVCU4WJCQIURKRNXU346RWVAU
  shortToken  = CBAN5YU3KRDKPTQ2H76D6S7HQFPRBGUD524F65BUM2RQCITPTRLKWKES

TXLM/TUSDC
  marketToken = CDIBR7BDCDWGAG3CC6PBKRSLMISPYKNDGE57DCZO5TMTLZK34TMGKFQQ
  indexToken  = CAHNXBBSXVMGI6G3FUBY3OTNWKQ7434FDDEEE7ZT733WIW6NUZL4ONU6
  longToken   = CAHNXBBSXVMGI6G3FUBY3OTNWKQ7434FDDEEE7ZT733WIW6NUZL4ONU6
  shortToken  = CBAN5YU3KRDKPTQ2H76D6S7HQFPRBGUD524F65BUM2RQCITPTRLKWKES
```

Important mismatch: `apps/web/.env.testnet` currently points to an older protocol deployment. Update it from the active contract IDs above before expecting live pool/faucet reads to match contracts.

## GMX Pools Page Pattern To Adapt

GMX's `src/pages/Pools/Pools.tsx` composes the page from small pieces:

- Page layout with title and chain header.
- TVL summary component.
- Time range state through `usePoolsTimeRange`.
- Data hooks for APY, annualized performance, performance snapshots, and stats.
- Responsive page behavior through `usePoolsIsMobilePage`.
- GLV list wrapped in an error boundary when GLV is supported.
- GM list wrapped separately in an error boundary.

GMX's `PoolsCard.tsx` is intentionally simple: title, description, optional content header, scrollable children, optional bottom area. Recreate this pattern locally instead of building one giant page component.

GMX's `PoolsTimeRangeFilter.tsx` turns a domain list of periods into tab options. SO4 should use the same idea, with local periods such as `total`, `7d`, `30d`, `90d`, even if APY starts as a calculated placeholder.

## Recommended SO4 Pool Feature Shape

Create a dedicated pools feature instead of continuing to stretch `features/earn`:

```text
apps/web/src/routes/pools.tsx
apps/web/src/features/pools/components/pools-page.tsx
apps/web/src/features/pools/components/pools-card.tsx
apps/web/src/features/pools/components/pools-time-range-filter.tsx
apps/web/src/features/pools/components/gm-pools-table.tsx
apps/web/src/features/pools/components/gm-pool-row.tsx
apps/web/src/features/pools/components/pool-composition-bar.tsx
apps/web/src/features/pools/components/pool-actions.tsx
apps/web/src/features/pools/data/markets.ts
apps/web/src/features/pools/hooks/use-pools-data.ts
apps/web/src/features/pools/hooks/use-pool-row-data.ts
apps/web/src/features/pools/hooks/use-pools-time-range.ts
apps/web/src/features/pools/lib/pool-math.ts
```

Also update:

```text
apps/web/src/ui/Navbar.tsx
apps/web/src/shared/lib/query-keys.ts
apps/web/src/app/config/env.ts
apps/web/src/app/config/contracts.ts
apps/web/.env.testnet
packages/contracts/src/clients/synthetics-reader.ts
packages/contracts/src/clients/sac-token.ts or a new token client
packages/contracts/src/index.ts
```

## Pool Page Data Model

Add a typed static address registry first. This should be generated or copied from `contracts/.deployed/frontend-testnet.ts` until an automated sync exists.

Recommended file: `apps/web/src/features/pools/data/markets.ts`

```ts
export type PoolMarketConfig = {
  label: "TWBTC/TUSDC" | "TETH/TUSDC" | "TXLM/TUSDC"
  displayName: string
  marketToken: string
  indexToken: string
  longToken: string
  shortToken: string
  longSymbol: "TWBTC" | "TETH" | "TXLM"
  shortSymbol: "TUSDC"
  decimals: 7
}
```

Use the real addresses from this doc. Do not use symbolic placeholders like `BTC-BTC-USDC`, `BTC`, or `USDC` for any contract call.

Pool row fields to show for MVP:

- Market label: `TWBTC/TUSDC`, `TETH/TUSDC`, `TXLM/TUSDC`.
- Token icons: derive display symbols by stripping leading `T` for icon lookup when desired.
- TVL / pool value: `reader.getMarketPoolValueInfo(...).poolValue`.
- Long amount and short amount: `longTokenAmount`, `shortTokenAmount`.
- Composition: compute percentages from long/short USD where available, otherwise raw amounts.
- Open interest: `reader.getOpenInterest(marketToken)`.
- Funding factor: `reader.getFundingInfo(marketToken)`.
- User GM balance: token client `balance({ id: wallet })` on the market token contract.
- GM total supply: token client `total_supply()` on the market token contract.
- Actions: Deposit, Withdraw. Disable or show empty state until liquidity seeding and transaction UX are confirmed.

## Contract SDK Status And Needed Updates

Current useful SDK surface:

- `packages/contracts/src/clients/synthetics-reader.ts`
  - `getMarket(marketToken)`
  - `getMarketPoolValueInfo(marketToken, maximize)`
  - `getMarketPoolAmounts(marketToken, maximize)`
  - `getOpenInterest(marketToken)`
  - `getFundingInfo(marketToken)`
- `packages/contracts/src/clients/exchange-router.ts`
  - `buildCreateDepositTransaction(params)`
  - `buildCreateWithdrawalTransaction(params)`
- `packages/contracts/src/generated/test-token/src/index.ts`
  - Generated token client already has `balance`, `total_supply`, `approve`, etc.
- `packages/contracts/src/generated/test-faucet/src/index.ts`
  - Generated faucet client already has `claim`, `claim_many`, `claim_amount`, `cooldown_ledgers`, `last_claim_ledger`.

SDK updates needed:

- [x] Add a reusable token client wrapper in `packages/contracts/src/clients/token.ts` for the custom test token / market token SEP-41-like surface.
- [x] Export that wrapper from `packages/contracts/src/index.ts`.
- [x] Replace `SacTokenClient` address encoding for current custom tokens or create a separate client. `SacTokenClient` currently encodes addresses as `scvString`, while generated custom-token bindings use proper generated argument encoders. For `test_token` and `market_token`, prefer generated clients or a wrapper around generated clients.
- [ ] Generate/add bindings for `market_token` if not already available in `packages/contracts/src/generated/market-token/src/index.ts`. The generated `test-token` client may be shape-compatible, but relying on that name for GM tokens is confusing.
- [ ] Generate/add bindings for `market_factory` if the frontend needs dynamic `get_markets(start,end)`. For MVP, static market registry is acceptable.
- [x] Add `marketFactory`, `depositHandler`, `withdrawalHandler`, `faucet`, test token IDs, and market token IDs to env/config types.
- [ ] Add a typed generated testnet config file or import path. Best source is the contracts repo output: `.deployed/frontend-testnet.ts`.
- [ ] Add a script to sync `/contracts/.deployed/frontend-testnet.ts` into the interface app or convert it into Vite env vars.

Reader update that would improve the frontend but is not mandatory for MVP:

- [ ] Add `reader.get_markets(data_store, start, end)` or expose market list through `market_factory` binding, so the frontend does not need a static registry.
- [ ] Add reader methods for market token price / total supply if the pool page should avoid direct token reads.

## Faucet Frontend Audit

Current faucet files:

```text
apps/web/src/routes/faucet.tsx
apps/web/src/features/faucet/components/faucet-page.tsx
apps/web/src/features/faucet/hooks/useFaucetData.ts
apps/web/src/features/faucet/hooks/useClaim.tsx
apps/web/src/features/faucet/lib/clients.ts
```

What is good:

- Uses generated `FaucetContractClient` and `TestTokenContractClient` from `@workspace/contracts`.
- Uses `claim_many`, which matches the faucet contract and is the right UX.
- Shows wallet/network mismatch state.
- Invalidates faucet query data after claim.
- Handles `ClaimTooSoon` error code `#6`.

What must change:

- It is hardcoded to stale IDs:
  - old faucet `CDAARNES...`
  - old TWBTC `CCJRNW...`
  - old TUSDC `CAURH...`
- It only supports TWBTC and TUSDC. Active faucet has TUSDC, TWBTC, TETH, TXLM.
- Contract address display is hardcoded inside the component instead of coming from config.
- Query key uses raw `['faucet','data',address]` instead of the central `queryKeys` registry.
- It does not show per-token cooldown/last claim status; the contract supports `last_claim_ledger(account, token)`.
- It does not expose single-token claim buttons, only claim-many.

Faucet implementation checklist:

- [x] Add faucet and test token IDs to `apps/web/src/app/config/env.ts` and `contracts.ts`.
- [x] Replace hardcoded IDs in `features/faucet/lib/clients.ts` with config-derived IDs.
- [x] Model faucet tokens as an array: `TUSDC`, `TWBTC`, `TETH`, `TXLM`.
- [x] Update `useFaucetData` to fetch all token balances and claim amounts via `Promise.all` over that array.
- [x] Update `useClaim` to claim all enabled tokens by default: `[TUSDC, TWBTC, TETH, TXLM]`.
- [x] Add optional per-token claim action if UX wants more control.
- [x] Display all four token cards in a responsive grid.
- [x] Read `last_claim_ledger` per token for the connected account and show cooldown state.
- [x] Keep testnet-only guard.
- [x] Replace inline contract-address list with config-driven address list.
- [x] Add `queryKeys.faucet.data(address)` and use it in faucet hooks.
- [ ] Run `bun run --cwd apps/web typecheck` after changes.

## Pool Page Implementation Checklist

Routing and navigation:

- [x] Add `apps/web/src/routes/pools.tsx` with `createFileRoute('/pools')`.
- [x] Add `Pools` to `APP_LINKS` in `apps/web/src/ui/Navbar.tsx`.
- [ ] Decide whether Earn keeps a Discover tab or links users to `/pools`. Prefer `/pools` for GM liquidity management and keep Earn for staking/rewards.

Config and addresses:

- [x] Update `apps/web/.env.testnet` to the active protocol IDs listed above.
- [x] Add env vars for `VITE_CONTRACT_MARKET_FACTORY`, `VITE_CONTRACT_DEPOSIT_HANDLER`, `VITE_CONTRACT_WITHDRAWAL_HANDLER`, `VITE_FAUCET`, `VITE_TOKEN_TUSDC`, `VITE_TOKEN_TWBTC`, `VITE_TOKEN_TETH`, `VITE_TOKEN_TXLM`, `VITE_MARKET_TOKEN_TWBTC_TUSDC`, `VITE_MARKET_TOKEN_TETH_TUSDC`, and `VITE_MARKET_TOKEN_TXLM_TUSDC`.
- [x] Extend `EnvContracts` / `CONTRACTS` to include the added protocol contracts.
- [x] Add a typed token/market config module for frontend consumption.
- [x] Remove symbolic IDs from `features/trade/data/markets.ts` or replace them with real market token addresses.
- [x] Remove symbolic token IDs from `features/trade/data/tokens.ts` or replace them with real token contract IDs.

SDK and data hooks:

- [x] Add central query keys: `queryKeys.pools.list()`, `queryKeys.pools.row(marketToken, address)`, `queryKeys.pools.userBalance(marketToken, address)`.
- [x] Implement `usePoolsData(timeRange)` to fetch all configured markets.
- [x] Implement `usePoolRowData(market)` to call reader methods in parallel: market, pool value, open interest, funding info.
- [x] Add token/market-token balance reads for connected wallets.
- [x] Add market token total supply reads.
- [x] Keep APY as `null` or clearly estimated until real performance snapshots exist. Do not fake production APY silently.
- [x] If APY is estimated, label it as estimated in the UI and code comments.

Components:

- [x] Implement `PoolsPage` with `Navbar`, page header, total TVL, and time-range tabs.
- [x] Implement `PoolsCard` as a reusable list shell, adapted from GMX's simple structure.
- [x] Implement `PoolsTimeRangeFilter` with tabs from local `usePoolsTimeRange`.
- [x] Implement `GmPoolsTable` for desktop columns: Pool, TVL, Composition, Open Interest, Funding, APY, Your GM, Actions.
- [x] Implement mobile pool cards instead of trying to squeeze the desktop table.
- [x] Implement `PoolCompositionBar` with stable dimensions and no layout shift.
- [x] Implement skeleton/loading states per row.
- [x] Implement error states per row/card so one failing market does not blank the entire page.
- [x] Keep GLV hidden with a clear feature flag, because GLV contracts are not deployed.

Deposit and withdrawal UX:

- [ ] Add Deposit dialog that accepts long and/or short token amount.
- [ ] Build approvals for long/short tokens before deposit. Use the correct custom token approval client, not SAC-only assumptions.
- [ ] Call `buildCreateDepositTransaction` with `market`, `initialLongToken`, `initialShortToken`, raw `longTokenAmount`, raw `shortTokenAmount`, and `minMarketTokens`.
- [ ] Sign and submit through existing wallet `signTransaction` and `sendAndPoll` flow.
- [ ] Add Withdraw dialog using GM balance and `buildCreateWithdrawalTransaction`.
- [ ] Add slippage/min-output fields, even if defaulted to zero for MVP.
- [ ] Invalidate pool and wallet balance queries after success.

Faucet dependency for pools:

- [x] Pool page empty state should link to `/faucet` when user has no test tokens.
- [ ] Deposit dialog should show available long/short token balances and link to faucet if zero.
- [ ] Wallet testnet XLM funding remains separate: use Friendbot link from wallet UI for XLM fees.

QA checklist:

- [ ] `bun run --cwd apps/web typecheck` passes or known unrelated failures are documented.
- [ ] `bun run --cwd apps/web build` passes.
- [ ] `/faucet` shows four active tokens and active contract IDs.
- [ ] `/faucet` claim-many signs and submits on Stellar testnet.
- [ ] `/pools` renders three GM markets using real market token addresses.
- [ ] `/pools` does not render GLV as active.
- [ ] Connected wallet GM balances are read from market token contracts.
- [ ] Deposit simulation succeeds after token approval and oracle prices exist.
- [ ] Withdrawal simulation succeeds after user has GM balance.
- [ ] Mobile viewport has no table overflow or overlapping action buttons.

## Known Backend/Deployment Preconditions

The frontend pool page can render configured markets now, but meaningful deposit/withdraw testing still depends on backend state:

- Oracle prices must be submitted for `TUSDC`, `TWBTC`, `TETH`, and `TXLM`.
- Initial liquidity should be seeded, otherwise TVL will be zero and deposit pricing may be first-deposit behavior.
- GLV remains out of scope until GLV contracts exist.
- Pool economics are simplified versus full GMX: borrowing fees and PnL caps are documented as incomplete in the contracts review plan.

## Suggested Implementation Order

- [x] Step 1: Update app env/config with active testnet protocol, token, faucet, and market IDs.
- [x] Step 2: Fix faucet to use config and all four tokens.
- [x] Step 3: Add reusable token/market-token client in `packages/contracts`.
- [x] Step 4: Replace symbolic trade/earn market data with real address configs.
- [x] Step 5: Add `/pools` route and static three-market list.
- [x] Step 6: Implement read-only pool rows using `SyntheticsReaderClient`.
- [x] Step 7: Add wallet GM/token balance reads.
- [ ] Step 8: Add deposit/withdraw dialogs and tx submission.
- [ ] Step 9: Run typecheck/build and test faucet + pools on desktop/mobile.
- [ ] Step 10: Only after GM pools are stable, revisit GLV UX.
