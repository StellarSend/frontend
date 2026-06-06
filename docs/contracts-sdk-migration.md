# `@workspace/contracts` — SO4 Market Contracts SDK Migration

Moves all contract client code from `apps/web/src/lib/contracts/` and `apps/web/src/lib/soroban/`
into a standalone `packages/contracts` workspace package.

**Design principle:** Each client class accepts `rpcUrl` and `networkPassphrase` as constructor
params — no imports of `NETWORK`, `CONTRACTS`, or `sorobanRpc` from the app config.

---

## Progress

### Phase 1 — Package skeleton
- [x] `packages/contracts/package.json`
- [x] `packages/contracts/tsconfig.json`

### Phase 2 — Core utilities
- [x] `packages/contracts/src/types.ts` — `NetworkConfig` type
- [x] `packages/contracts/src/scval.ts` — `i128ToScVal` (copy from web app)
- [x] `packages/contracts/src/errors.ts` — `parseSorobanError` (copy from web app)
- [x] `packages/contracts/src/soroban/referral-code.ts` — pure encoding utils (copy from web app)

### Phase 3 — Generated bindings (copy verbatim)
- [x] `packages/contracts/src/generated/exchange-router/src/index.ts`
- [x] `packages/contracts/src/generated/synthetics-reader/src/index.ts`
- [x] `packages/contracts/src/generated/glv-router/src/index.ts`
- [x] `packages/contracts/src/generated/test-faucet/src/index.ts`
- [x] `packages/contracts/src/generated/test-token/src/index.ts`

### Phase 4 — Client classes (refactored, config-injectable)
- [x] `packages/contracts/src/clients/exchange-router.ts`
  - Converts standalone functions to methods; replaces `sorobanRpc`/`CONTRACTS`/`NETWORK` with `this.server`/`this.config`
- [x] `packages/contracts/src/clients/synthetics-reader.ts`
  - Wraps generated `Client`; takes `contractId`, `dataStore`, `oracle`, `orderHandler` as config
- [x] `packages/contracts/src/clients/glv-router.ts`
  - Thin wrapper around generated GLV `Client`; exposes `createDeposit`, `createWithdrawal`, `getGlvInfo`
  - NOTE: App's `glv-router-client.ts` keeps `submitTx`/`walletKit`/`queryClient` logic and is updated to use this wrapper
- [x] `packages/contracts/src/clients/staking-router.ts`
  - Converts standalone tx builders to methods; replaces `sorobanRpc`/`CONTRACTS`/`NETWORK`
- [x] `packages/contracts/src/clients/vesting-router.ts`
  - Merges `contracts/vesting-router.ts` + `soroban/vesting.ts`; `getVestingSchedule` + `buildDepositForVestingTransaction`
- [x] `packages/contracts/src/clients/referral-storage.ts`
  - Merges `contracts/referral-storage.ts` + `soroban/referral-storage.ts`; all read and write methods in one class
- [x] `packages/contracts/src/clients/order-vault.ts`
  - Removes `CONTRACTS` default; takes `contractId` as required config
- [x] `packages/contracts/src/clients/sac-token.ts`
  - Replaces `sorobanRpc`/`NETWORK` with `this.server`/`this.config`

### Phase 5 — Barrel export
- [x] `packages/contracts/src/index.ts` — exports everything from types, errors, scval, soroban/referral-code, generated clients, and client classes

### Phase 6 — Update apps/web
- [x] Add `"@workspace/contracts": "workspace:*"` to `apps/web/package.json` dependencies
- [x] Add `"@workspace/contracts": ["../../packages/contracts/src/index.ts"]` to `apps/web/tsconfig.json` `paths`
- [x] Create `apps/web/src/lib/contracts.ts` — thin adapter: instantiates all client singletons using `NETWORK` + `CONTRACTS` env config; re-exports all types
- [x] Update `apps/web/src/lib/contracts/glv-router-client.ts` — change imports to use `@workspace/contracts`'s `GlvRouterClient`; keep `submitTx`/`walletKit` logic here
- [x] Update feature imports (30 files — see list below)
- [x] Delete old files (see list below)

Current verification:
- `bun run --cwd packages/contracts typecheck` passes.
- No feature imports still point at deleted `apps/web/src/lib/contracts/*`, `apps/web/src/lib/contracts/generated/*`, or moved `apps/web/src/lib/soroban/*` files.
- `bun run --cwd apps/web typecheck` still fails on existing feature/model type issues outside the SDK move, such as position view fields, trade-panel `Input`, test `assert` globals, and a few unrelated strictness errors. The old app-local generated binding errors are gone.

#### Feature files to update imports
| File | Old import | New import |
|------|-----------|------------|
| `earn/lib/earn.ts` | `@/lib/contracts/staking-router` | `@/lib/contracts` |
| `earn/queries/useStakingInfo.ts` | `@/lib/contracts/staking-router` | `@/lib/contracts` |
| `earn/queries/useVestingSchedule.ts` | `@/lib/contracts/vesting-router` or `@/lib/soroban/vesting` | `@/lib/contracts` |
| `earn/queries/useGLVVaultData.ts` | `@/lib/contracts/...` | `@/lib/contracts` |
| `earn/queries/useGMPoolData.ts` | `@/lib/contracts/...` | `@/lib/contracts` |
| `earn/hooks/useMarketPoolAmounts.ts` | `@/lib/contracts/...` | `@/lib/contracts` |
| `faucet/lib/clients.ts` | generated test-faucet/test-token | `@workspace/contracts` |
| `faucet/hooks/useClaim.tsx` | `@/lib/soroban/errors` | `@/lib/contracts` |
| `referrals/hooks/use-referrals-data.ts` | `@/lib/soroban/referral-storage` | `@/lib/contracts` |
| `referrals/lib/referrals.ts` | `@/lib/soroban/referral-storage` | `@/lib/contracts` |
| `referrals/queries/useReferralCode.ts` | `@/lib/soroban/referral-storage` | `@/lib/contracts` |
| `referrals/queries/useReferralStats.ts` | `@/lib/contracts/referral-storage` | `@/lib/contracts` |
| `referrals/queries/useReferralTier.ts` | `@/lib/contracts/referral-storage` | `@/lib/contracts` |
| `trade/components/TradePage.tsx` | `@/lib/soroban/referral-code` | `@/lib/contracts` |
| `trade/components/trade-panel/ApplyReferralCodePrompt.tsx` | `@/lib/soroban/referral-storage` | `@/lib/contracts` |
| `trade/components/trade-panel/ConfirmationDialog.tsx` | `@/lib/contracts/exchange-router-client` | `@/lib/contracts` |
| `trade/components/positions/OrderExecutionFrozenBanner.tsx` | `@/lib/soroban/errors` | `@/lib/contracts` |
| `trade/components/positions/OrdersList.tsx` | `@/lib/contracts/...` | `@/lib/contracts` |
| `trade/hooks/useFundingRate.ts` | `@/lib/contracts/synthetics-reader` | `@/lib/contracts` |
| `trade/hooks/useMarketsInfo.ts` | `@/lib/contracts/synthetics-reader` | `@/lib/contracts` |
| `trade/hooks/useMarkets.ts` | `@/lib/contracts/synthetics-reader` | `@/lib/contracts` |
| `trade/hooks/useOpenInterest.ts` | `@/lib/contracts/synthetics-reader` | `@/lib/contracts` |
| `trade/hooks/useOrderEventPolling.ts` | `@/lib/contracts/...` | `@/lib/contracts` |
| `trade/hooks/useOrders.ts` | `@/lib/contracts/synthetics-reader` | `@/lib/contracts` |
| `trade/hooks/usePositions.ts` | `@/lib/contracts/synthetics-reader` | `@/lib/contracts` |
| `trade/lib/data-store.ts` | `@/lib/contracts/...` | `@/lib/contracts` |
| `trade/lib/order-encoding.ts` | generated exchange-router | `@/lib/contracts` |
| `trade/lib/stellar.ts` | `@/lib/contracts/...` | `@/lib/contracts` |
| `wallet/lib/wallet-kit.ts` | `@/lib/contracts/sac-token-client` | `@/lib/contracts` |

#### Files to delete after Phase 6
- `apps/web/src/lib/contracts/exchange-router-client.ts`
- `apps/web/src/lib/contracts/synthetics-reader.ts`
- `apps/web/src/lib/contracts/staking-router.ts`
- `apps/web/src/lib/contracts/vesting-router.ts`
- `apps/web/src/lib/contracts/referral-storage.ts`
- `apps/web/src/lib/contracts/referral-storage-types.ts`
- `apps/web/src/lib/contracts/order-vault.ts`
- `apps/web/src/lib/contracts/sac-token-client.ts`
- `apps/web/src/lib/contracts/scval.ts`
- `apps/web/src/lib/contracts/generated/exchange-router/` (entire dir)
- `apps/web/src/lib/contracts/generated/synthetics-reader/` (entire dir)
- `apps/web/src/lib/contracts/generated/glv-router/` (entire dir)
- `apps/web/src/lib/contracts/generated/test-faucet/` (entire dir)
- `apps/web/src/lib/contracts/generated/test-token/` (entire dir)
- `apps/web/src/lib/contracts/generated/.gitkeep`
- `apps/web/src/lib/soroban/errors.ts`
- `apps/web/src/lib/soroban/referral-code.ts`
- `apps/web/src/lib/soroban/referral-storage.ts`
- `apps/web/src/lib/soroban/vesting.ts`

#### Files to KEEP in apps/web/src/lib/soroban/ (env-dependent, not moving)
- `client.ts` — `sorobanRpc` singleton using `VITE_RPC_URL`
- `tx-builder.ts` — `prepareAndSign` using `sorobanRpc`
- `simulate.ts` — `simulateTx`/`estimateFee` using `sorobanRpc`

---

## Key decisions

- **Config injection**: clients accept `{ rpcUrl, networkPassphrase, contractId }` — no env imports in package
- **ReferralStorage**: soroban-level read/write functions merged into `ReferralStorageClient` class methods
- **VestingRouter**: merged `VestingRouterClient.getVestingSchedule` + standalone `buildDepositForVestingTransaction` into one class
- **GLV router**: package exposes `GlvRouterClient` wrapper; app's `glv-router-client.ts` keeps `submitTx`/`walletKit`/`queryClient` logic and imports from `@workspace/contracts`
- **Thin adapter** (`apps/web/src/lib/contracts.ts`): instantiates all singletons; feature code imports everything from `@/lib/contracts`
- **Faucet feature**: `clients.ts` updated to use `FaucetContractClient` / `TestTokenContractClient` from `@workspace/contracts`

---

## What to check after implementation
```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep -E "contracts|soroban" | grep -v "node_modules" | head -30
```
Pre-existing errors (not from this refactor): ~79 errors in trade/earn/referrals/wallet features.
New errors from this refactor should be zero.
