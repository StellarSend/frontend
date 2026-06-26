# SO4 Local Full-Stack Integration Guide

This guide walks a new contributor through running the SO4 stack — **contracts**,
**indexer**, and **web app** — locally, from a clean clone, using a single
documented path. Follow it top to bottom: each step builds on the previous one,
and the verification commands at the end exist to catch regressions before
review.

> **Scope:** `local` (a standalone/quickstart Stellar node + locally deployed
> contracts), `testnet` (public SDF testnet), and a forward note on `mainnet`.
> Local is the default development path.

---

## Table of contents

- [Prerequisites](#prerequisites)
- [Repository layout](#repository-layout)
- [1. Build the contracts](#1-build-the-contracts)
- [2. Deploy and bootstrap contracts](#2-deploy-and-bootstrap-contracts)
- [3. Sync manifests into the indexer](#3-sync-manifests-into-the-indexer)
- [4. Start the indexer services](#4-start-the-indexer-services)
- [5. Run the local smoke scenario](#5-run-the-local-smoke-scenario)
- [6. Start the web app](#6-start-the-web-app)
- [7. Verify GraphQL data](#7-verify-graphql-data)
- [8. Verify the UI is reading indexed data](#8-verify-the-ui-is-reading-indexed-data)
- [Expected URLs and ports](#expected-urls-and-ports)
- [Local vs testnet vs mainnet](#local-vs-testnet-vs-mainnet)
- [Troubleshooting](#troubleshooting)
- [Automated checks](#automated-checks)
- [Definition of done](#definition-of-done)

---

## Prerequisites

| Tool | Version / notes |
| --- | --- |
| [Bun](https://bun.sh) | `>= 1.3` — the workspace package manager and task runner. The root `package.json` pins `bun@1.3.13` via `packageManager`. |
| [Docker Engine](https://docs.docker.com/engine/) | With Docker Compose v2. The indexer stack (`postgres`, `subquery-node`, `graphql-engine`) runs in containers. |
| [Stellar CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup#install-the-stellar-cli) | `stellar` must be on `PATH` for contract deploys and smoke runs. |
| [Rust toolchain](https://www.rust-lang.org/tools/install) | Stable Rust with the `wasm32-unknown-unknown` target for Soroban contracts: `rustup target add wasm32-unknown-unknown`. |
| `make` | Used by the contracts repo deploy/bootstrap targets. |
| Node.js | `>= 20` (Bun bundles its own runtime, but some tooling still expects Node on `PATH`). |

### Stellar keys (local + testnet)

The local smoke flow uses local-only Stellar CLI keys; production keys are never
touched. From the contracts repo (default sibling path
`/home/sunny/zero/so4-market-project/contracts`):

```bash
stellar keys generate so4-local --network local --fund
stellar keys generate so4-testnet --network testnet --fund
```

These keys live under `~/.config/stellar/identity/` and are friendbot-funded
automatically when generated against a known network.

---

## Repository layout

```
so4-market-project/
├── interface/          # this repo (web app, indexer, docs)
│   ├── apps/
│   │   ├── s03-indexer/    # SubQuery indexer (Bun workspace)
│   │   └── web/            # React + Vite trading UI
│   └── docs/               # you are here
└── contracts/          # SO4 Soroban contracts (sibling repo)
    ├── .deployed/      # generated deployment env files
    └── .stellar/       # generated contract ID / wasm hash JSON
```

The indexer's `sync:contracts:*` script reads `../contracts` by default. Override
with `SO4_CONTRACTS_REPO=/abs/path` if your layout differs.

---

## 1. Build the contracts

From the contracts repo:

```bash
cd ../contracts
make build          # cargo build + soroban contract build for every workspace contract
```

> Expected: `target/wasm32-unknown-unknown/release/*.wasm` exist for every
> handler/store/router contract.

## 2. Deploy and bootstrap contracts

```bash
# Local standalone network (default for development)
make deploy NETWORK=local
make bootstrap NETWORK=local

# Or against public testnet
make deploy NETWORK=testnet
make bootstrap NETWORK=testnet
```

The deploy step writes:

- `.deployed/<network>.env` — every protocol contract ID + role config
- `.deployed/tokens-<network>.env` — `TUSDC`, `TWBTC`, `TETH`, `TXLM`, `faucet`
- `.deployed/frontend-<network>.env` and `.deployed/frontend-<network>.ts` —
  frontend-friendly exports
- `.stellar/contract-ids/<network>.json` — combined contract ID + network passphrase

Bootstrap creates markets and writes `MARKET_TOKEN_*` values back into the env
file. If you skip bootstrap, the indexer sync will warn (not fail) about missing
market tokens.

## 3. Sync manifests into the indexer

```bash
cd ../interface
bun run --cwd apps/s03-indexer sync:contracts:local      # for local
bun run --cwd apps/s03-indexer sync:contracts:testnet    # for testnet
```

This writes `apps/s03-indexer/config/contracts.<network>.json` containing
network metadata, Horizon/Soroban RPC endpoints, core contracts, test tokens,
and market triplets. `project.ts` picks the right manifest by reading
`INDEXER_NETWORK` (or the explicit `INDEXER_CONTRACTS_CONFIG` override) from
`apps/s03-indexer/.env`.

## 4. Start the indexer services

```bash
# One-shot clean checkout path: codegen + build + docker compose up
bun run indexer:dev
```

Or, step by step:

```bash
bun run indexer:codegen     # subql codegen — regenerates src/types/
bun run indexer:build       # subql build — produces dist/ mappings
bun run indexer:start       # docker compose pull && up --remove-orphans
```

Services come up on:

| Service | URL |
| --- | --- |
| GraphQL playground / query API | <http://localhost:3000> |
| Postgres (indexed entities + metadata) | `postgres://postgres:postgres@localhost:5432/postgres` |
| Stellar Horizon (local quickstart) | <http://localhost:8000> |
| Soroban RPC (local quickstart) | <http://localhost:8000/soroban/rpc> |

## 5. Run the local smoke scenario

`smoke:local` is the single end-to-end check that ties everything together.

```bash
bun run --cwd apps/s03-indexer build
bun run --cwd apps/s03-indexer smoke:local
```

It runs preflight → service checks → deploy (if needed) → manifest sync →
indexer rebuild → contract actions → GraphQL assertions, and writes
`.smoke/report.json`. Re-run against a clean DB with
`bun run --cwd apps/s03-indexer smoke:clean`.

See `apps/s03-indexer/README.md` for the full flag reference (`--mode`,
`--source`, `--keeper`, `--report`, `--skip-*` flags, and the `SMOKE_*` env-var
equivalents).

## 6. Start the web app

```bash
bun run --cwd apps/web dev
```

The web app comes up at <http://localhost:3000> in dev mode. (The indexer
GraphQL service also defaults to port `3000` — when you need both at once, run
the web app with `bun run --cwd apps/web dev --port 3001` or stop the indexer's
`graphql-engine` container.)

For production builds:

```bash
bun run --cwd apps/web build
```

## 7. Verify GraphQL data

Open the GraphQL playground at <http://localhost:3000> and run:

```graphql
{
  query {
    markets(first: 5) {
      totalCount
      nodes { id marketToken indexToken longToken shortToken }
    }
    deposits(first: 5, orderBy: LEDGER_DESC) {
      nodes { id account market amount ledger }
    }
    positions(first: 5) {
      nodes { id account market sizeUsd entryPrice }
    }
  }
}
```

Expected after a successful smoke run:

- `markets.totalCount >= 1` (at least the bootstrapped market)
- `deposits` shows the smoke-run deposit
- `positions` shows the long opened by the `MarketIncrease` step

If counts are zero, jump to [Troubleshooting → indexer behind latest
ledger](#indexer-is-behind-latest-ledger).

## 8. Verify the UI is reading indexed data

With the web app running:

1. Open <http://localhost:3000> (or `:3001` if you remapped).
2. Connect a wallet funded against the same network you deployed to.
3. The **Earn** page should list the bootstrapped market with non-zero pool
   metadata sourced from `pools` / `markets` GraphQL queries.
4. The **Trade** page chart should resolve the market by `marketToken` and
   surface any open positions / orders for the connected account.

If the UI shows empty state while GraphQL has data, check the browser network
tab — the most common cause is the web app pointing at the wrong GraphQL
endpoint (see `apps/web/src/lib/*` and any `VITE_GRAPHQL_*` env vars).

---

## Expected URLs and ports

| What | Where |
| --- | --- |
| Web app (Vite dev) | <http://localhost:3000> (default) or `:3001` when remapped |
| SubQuery GraphQL playground | <http://localhost:3000> |
| Postgres | `localhost:5432` (user/db: `postgres`) |
| Stellar Horizon (local) | <http://localhost:8000> |
| Soroban RPC (local) | <http://localhost:8000/soroban/rpc> |
| Stellar Horizon (testnet) | <https://horizon-testnet.stellar.org> |
| Soroban RPC (testnet) | <https://soroban-testnet.stellar.org> |
| Docker services | `docker compose -f apps/s03-indexer/docker-compose.yml ps` |

---

## Local vs testnet vs mainnet

| Environment | When to use | Endpoint defaults | Indexer config |
| --- | --- | --- | --- |
| **local** | Fast iteration, fixture data, deterministic test runs | `host.docker.internal:8000` Horizon + Soroban RPC | `config/contracts.local.json`, `INDEXER_NETWORK=local` |
| **testnet** | Shared remote network, multi-contributor reproduction | `horizon-testnet.stellar.org` + `soroban-testnet.stellar.org` | `config/contracts.testnet.json`, `INDEXER_NETWORK=testnet` |
| **mainnet** | **Not yet supported.** Future: separate manifest + RPC endpoints + signed deploys; never reuse local/testnet keys. |

Keep local and testnet manifests in version control side-by-side —
`sync:contracts:*` writes to network-specific files and never overwrites the
other.

---

## Troubleshooting

### Missing `.deployed/<network>.env`

**Symptom:** `sync:contracts:*` fails with `deployment file not found` or
`smoke:local` exits at the `contracts-deploy` step.

**Fix:** You have not deployed contracts for that network yet. Run
`make deploy NETWORK=<network>` in the contracts repo. If you deployed but the
file is in an unexpected location, set `SO4_CONTRACTS_REPO=/abs/path` so the
sync script can find it.

### Wrong network passphrase

**Symptom:** `Soroban RPC rejects transaction: NetworkMismatch`, or the indexer
silently produces zero events even though Horizon shows transactions.

**Fix:** The passphrase in `.env` / generated config must match the network you
deployed against. Local standalone uses
`Standalone Network ; February 2017`; testnet uses
`Test SDF Network ; September 2015`. Re-run
`bun run --cwd apps/s03-indexer sync:contracts:<network>` to regenerate from
the source of truth and double-check `INDEXER_NETWORK` in
`apps/s03-indexer/.env`.

### Stale market token IDs

**Symptom:** Web app shows the right markets but UI rows look empty, or smoke
asserts the wrong number of `position` entities.

**Fix:** Market tokens are created during `make bootstrap`. If you re-bootstrap
without re-syncing, the indexer keeps watching the previous tokens. Always run
`sync:contracts:<network>` after `make bootstrap`, then rebuild the indexer
(`bun run indexer:build`) and restart it.

### SubQuery database not ready

**Symptom:** `subquery-node` logs `connection refused` or `relation does not
exist` errors on startup.

**Fix:** Postgres needs a few seconds to initialize on first boot. Stop the
stack, then start it again:

```bash
docker compose -f apps/s03-indexer/docker-compose.yml down
docker compose -f apps/s03-indexer/docker-compose.yml up
```

If the error persists, wipe state with
`bun run --cwd apps/s03-indexer smoke:clean` (drops the DB volume) and re-start.

### Indexer is behind latest ledger

**Symptom:** GraphQL returns zero rows for an event you just submitted, or the
smoke run times out in the `graphql-query` step.

**Fix:** The indexer cursors lag the chain by a few ledgers under normal load.
Check `subquery-node` logs for the current cursor vs Horizon's latest ledger:

```bash
docker compose -f apps/s03-indexer/docker-compose.yml logs -f subquery-node
```

If the lag is growing instead of catching up, you likely have the wrong
endpoint, wrong passphrase, or a malformed manifest. Re-run sync and rebuild.

### Missing local token balances or approvals

**Symptom:** Smoke step `contract-action` fails on the deposit/order with
`InsufficientBalance` or `AllowanceMissing`.

**Fix:** The faucet has not been claimed for the smoke-run key, or token
allowances against `exchange_router` / `deposit_handler` were not set. The
default smoke flow claims the faucet and approves tokens automatically; if you
ran it with `--skip-*` flags, do the missed steps manually using the contracts
repo `make faucet` / `make approve` targets. As a last resort, regenerate keys
and re-run with `--mode fresh`.

### Web app shows "no data" with healthy GraphQL

**Symptom:** GraphQL playground returns rows; the UI still renders empty
states.

**Fix:** The web app is pointing at the wrong endpoint or has cached an old
schema. Check `apps/web/.env` and any `VITE_GRAPHQL_*` variables; then hard
reload the browser (the TanStack Query cache and service worker can hold stale
nulls).

---

## Automated checks

Run these from the repo root before opening a PR. They mirror the CI workflow
under `.github/workflows/` and catch the most common schema / mapping / config
regressions:

```bash
bun install                                         # workspace install
bun run --cwd apps/s03-indexer codegen              # schema -> types
bun run --cwd apps/s03-indexer build                # mappings build
bun run --cwd apps/s03-indexer test                 # mapping unit tests
bun run --cwd apps/web typecheck                    # web app type safety
bun run --cwd apps/web build                        # web app production build
```

Manifest sync also has a fixture-based check that does not require a live
Stellar deploy. See `scripts/check-integration.sh` for the bundled local check
script and `apps/s03-indexer/tests/fixtures/` for offline deployment fixtures.

---

## Definition of done

A local integration is "done" when **every** box below is true:

- [ ] `bun install` completes from a clean clone with no warnings about
      `npm`/`yarn`/`pnpm` lockfiles.
- [ ] Contracts deploy + bootstrap against the chosen network (`local` or
      `testnet`) and produce a complete `.deployed/<network>.env`.
- [ ] `bun run --cwd apps/s03-indexer sync:contracts:<network>` writes a fresh
      `config/contracts.<network>.json` with the matching network passphrase,
      every core contract, every test token, and the bootstrapped market
      triplets.
- [ ] `bun run --cwd apps/s03-indexer codegen` succeeds.
- [ ] `bun run --cwd apps/s03-indexer build` succeeds.
- [ ] `bun run --cwd apps/s03-indexer test` passes (mapping unit tests).
- [ ] `bun run --cwd apps/s03-indexer smoke:local` exits zero and the resulting
      `.smoke/report.json` shows passing assertions for every layer.
- [ ] GraphQL playground at <http://localhost:3000> returns non-zero rows for
      `markets`, `deposits`, and `positions`.
- [ ] `bun run --cwd apps/web typecheck` passes.
- [ ] `bun run --cwd apps/web build` produces a clean production bundle.
- [ ] `bun run --cwd apps/web dev` shows the same markets, deposits, and
      positions in the UI that the GraphQL playground returned.
- [ ] The contributor can hand off the running stack to a teammate using only
      this document plus the smoke `report.json` for diagnostics.
