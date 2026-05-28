# Contract Client Bindings

Auto-generated TypeScript SDK bindings for the SO4 Soroban contracts.

## Directory Layout

```
apps/web/src/lib/contracts/generated/
├── exchange-router/       # Exchange router bindings
├── synthetics-reader/     # Synthetics reader bindings
├── data-store/            # Data store bindings
├── order-vault/           # Order vault bindings
├── staking-router/        # Staking router bindings
├── glv-router/            # GLV router bindings
├── vesting-router/        # Vesting router bindings
├── referral-storage/      # Referral storage bindings
└── .gitkeep
```

## Prerequisites

- **stellar CLI** `v22.2.1` — must be installed and on `$PATH`
  - Install via Rust: `cargo install stellar-cli --version 22.2.1`
  - Install via Homebrew: `brew install stellar-cli`
  - Verify: `stellar --version`
  - Run `bun run contracts:check:cli` to verify compatibility
- **Target contract IDs** configured in `apps/web/.env.testnet`
- Network accessible (testnet by default)

> The CLI version is pinned to `22.2.1`. The `contracts:check:cli` script
> verifies that a matching `22.x` version is installed. Bump the version
> in this doc and in the check script when upgrading.

## Generate All Bindings (Testnet)

```bash
cd apps/web
bun run contracts:gen:all
```

This regenerates all 8 contract SDK packages from the currently-deployed testnet contracts.

> **Note:** The ExchangeRouter bindings were generated manually from the
> contract's expected interface (the contract is not yet deployed — see
> `.env.testnet` placeholder IDs). Once the actual WASM is deployed, run
> `stellar contract bindings typescript --contract-id <ID> --network testnet --output-dir src/lib/contracts/generated/exchange-router --overwrite`
> to overwrite with the true auto-generated bindings.

## Per-Contract Generation

```bash
cd apps/web
bun run contracts:gen:exchange-router
bun run contracts:gen:synthetics-reader
bun run contracts:gen:data-store
# ... etc
```

## Regenerating After a Contract Upgrade

1. Deploy the new Wasm to testnet
2. Update the contract address in `apps/web/.env.testnet`
3. Run `bun run contracts:gen:all`
4. Commit the updated generated files

## Generated Files

Generated bindings are **committed to the repository**. This avoids requiring every developer to re-run generation and makes code review of binding changes explicit. Bindings change infrequently (only when contracts are upgraded), so the churn cost is low.

If you prefer not to commit them, add `src/lib/contracts/generated/` to `.gitignore` and run generation in CI instead.

## Network

All generation scripts default to testnet (reading from `.env.testnet`). To generate from mainnet, substitute the env file:

```bash
grep -v '^#' .env.mainnet | xargs stellar contract bindings typescript --contract-id $VITE_CONTRACT_EXCHANGE_ROUTER --output-dir src/lib/contracts/generated/exchange-router --overwrite
```
