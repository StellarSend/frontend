// Local SO4 indexing smoke flow.
//
// One command that proves contracts + indexer + GraphQL work together end to end:
// deploy/bootstrap (or validate an existing local deployment), run real protocol
// actions (deposit, open position, close position, optional referral), then assert
// the SubQuery indexer turned those events into GraphQL entities. Writes a JSON
// report whose first failure names the broken layer.
//
// Usage:
//   bun run scripts/local-smoke.ts [--mode auto|fresh|existing] [--contracts-repo PATH]
//   bun run --cwd apps/s03-indexer smoke:local
//
// See README "Local Smoke Flow" for the full option list.

import path from "node:path";

import { buildConfig, SMOKE_PATHS } from "./lib/config";
import {
  checkCoreContracts,
  loadDeployment,
  resolveMarket,
  resolveToken,
  type MarketTriplet,
} from "./lib/deployment";
import { fetchEntityCounts, waitForIndexer } from "./lib/graphql";
import { hasBinary, run } from "./lib/process";
import {
  claimFaucet,
  closePositionFlow,
  depositFlow,
  FLOAT_PRECISION,
  ONE_TOKEN,
  openPositionFlow,
  priceFor,
  referralFlow,
  submitPrices,
  type PriceEntry,
} from "./lib/protocol";
import { existsSync } from "node:fs";
import { buildAssertions, SmokeRun, StepAborted } from "./lib/report";
import {
  ensureKey,
  fundFromFriendbot,
  getLatestLedger,
  httpReachable,
  keyAddress,
  rpcReachable,
  type StellarContext,
} from "./lib/stellar";
import type { SmokeConfig } from "./lib/types";

const config = buildConfig(process.argv.slice(2));
const ctx: StellarContext = {
  network: config.network,
  source: config.source,
  rpcUrl: config.sorobanRpcEndpoint,
};
const smoke = new SmokeRun(config);

main()
  .then((ok) => finish(ok))
  .catch((error) => {
    if (!(error instanceof StepAborted)) {
      process.stderr.write(`\nUnexpected error: ${error instanceof Error ? error.stack : error}\n`);
    }
    finish(false);
  });

async function main(): Promise<boolean> {
  printHeader();

  await preflight();
  const keeperAddr = await ensureKeys();
  await checkServices();

  const market = await ensureDeployment();
  const deployment = loadDeployment(config.contractsRepo, config.network);
  recordDeploymentArtifacts(deployment.env, market);

  await syncIndexerConfig();
  await prepareIndexer();

  const ledgerBefore = await getLatestLedger(config.sorobanRpcEndpoint);
  await runProtocolActions(keeperAddr, deployment.env, market);
  const ledgerAfter = (await getLatestLedger(config.sorobanRpcEndpoint)) ?? ledgerBefore;

  await assertIndexedEntities(ledgerAfter ?? 0);

  return !smoke.hasFailure();
}

// ── Phase: preflight ────────────────────────────────────────────────────────────

async function preflight(): Promise<void> {
  await smoke.step("Check required binaries", "preflight", () => {
    const required = ["stellar"];
    const missing = required.filter((bin) => !hasBinary(bin));
    if (missing.length) {
      throw new Error(`Missing required CLI tools: ${missing.join(", ")}`);
    }
    return {
      stellar: true,
      make: hasBinary("make"),
      docker: hasBinary("docker"),
      cargo: hasBinary("cargo"),
    };
  });

  await smoke.step("Locate contracts repo", "preflight", () => {
    const scripts = path.join(config.contractsRepo, "scripts");
    if (!existsSync(scripts)) {
      throw new Error(
        `Contracts repo not usable at ${config.contractsRepo} (no scripts/ directory). Set SO4_CONTRACTS_REPO.`,
      );
    }
    return { contractsRepo: config.contractsRepo };
  });
}

async function ensureKeys(): Promise<string> {
  const result = await smoke.step("Ensure local signing keys", "preflight", async () => {
    const sourceAddr = ensureKey(config.source, config.network);
    const keeperAddr = config.keeper === config.source ? sourceAddr : ensureKey(config.keeper, config.network);

    // Fresh local networks need the keys funded before any transaction.
    if (config.friendbotUrl) {
      await fundFromFriendbot(config.friendbotUrl, sourceAddr);
      if (keeperAddr !== sourceAddr) {
        await fundFromFriendbot(config.friendbotUrl, keeperAddr);
      }
    }
    return { sourceAddr, keeperAddr };
  });

  const keeperAddr = (result?.keeperAddr as string) ?? keyAddress(config.keeper) ?? "";
  if (keeperAddr) {
    smoke.setKeeperAddress(keeperAddr);
  }
  return keeperAddr;
}

// ── Phase: services ─────────────────────────────────────────────────────────────

async function checkServices(): Promise<void> {
  await smoke.step("Soroban RPC reachable", "services", async () => {
    const reachable = await rpcReachable(config.sorobanRpcEndpoint);
    smoke.setService("sorobanRpc", reachable);
    if (!reachable) {
      throw new Error(`Soroban RPC not reachable at ${config.sorobanRpcEndpoint}. Start your local network first.`);
    }
    return { endpoint: config.sorobanRpcEndpoint };
  });

  await smoke.step("Horizon reachable", "services", async () => {
    const reachable = await httpReachable(config.horizonEndpoint);
    smoke.setService("horizon", reachable);
    return { endpoint: config.horizonEndpoint, reachable };
  }, { fatal: false });

  if (!config.skipIndexerCheck) {
    await smoke.step("GraphQL endpoint reachable", "services", async () => {
      const reachable = await httpReachable(config.graphqlEndpoint);
      smoke.setService("graphql", reachable);
      return { endpoint: config.graphqlEndpoint, reachable };
    }, { fatal: false });
  }
}

// ── Phase: deployment ───────────────────────────────────────────────────────────

async function ensureDeployment(): Promise<MarketTriplet> {
  const initial = loadDeployment(config.contractsRepo, config.network);
  const coreOk = checkCoreContracts(initial.env).ok;
  const existingMarket = resolveMarket(initial.env, config.longCode, config.shortCode);
  const usable = coreOk && existingMarket !== undefined;

  if (config.mode === "existing") {
    await smoke.step("Validate existing deployment", "contracts-deploy", () => {
      const check = checkCoreContracts(initial.env);
      if (!check.ok) {
        throw new Error(
          `Existing deployment incomplete. Missing: ${check.missing.join(", ") || "none"}; invalid: ${check.invalid.join(", ") || "none"}.`,
        );
      }
      if (!existingMarket) {
        throw new Error(`No bootstrapped ${config.longCode}/${config.shortCode} market in ${initial.paths.deployEnv}.`);
      }
      return { deployEnv: initial.paths.deployEnv, market: existingMarket.marketToken };
    });
    return existingMarket as MarketTriplet;
  }

  if (config.mode === "auto" && usable) {
    smoke.skip("Deploy contracts", "contracts-deploy", "existing deployment detected");
    return existingMarket as MarketTriplet;
  }

  // Fresh path: deploy/bootstrap through the contract repo's maintained targets.
  if (!hasBinary("make")) {
    throw new Error("`make` is required to deploy contracts. Provide an existing deployment with --mode existing.");
  }

  await smoke.step("Deploy test tokens + faucet", "contracts-deploy", () => {
    makeTarget("test-tokens-with-faucet", [
      `LONG_CODE=${config.longCode}`,
      `SHORT_CODE=${config.shortCode}`,
    ]);
    return { target: "test-tokens-with-faucet" };
  });

  await smoke.step("Deploy protocol contracts", "contracts-deploy", () => {
    makeTarget("deploy-all", []);
    return { target: "deploy-all" };
  });

  await smoke.step("Bootstrap market", "contracts-deploy", () => {
    makeTarget("bootstrap", [
      `LONG_CODE=${config.longCode}`,
      `SHORT_CODE=${config.shortCode}`,
      `KEEPER=${config.keeper}`,
    ]);
    return { target: "bootstrap" };
  });

  const reloaded = loadDeployment(config.contractsRepo, config.network);
  const market = resolveMarket(reloaded.env, config.longCode, config.shortCode);
  if (!market) {
    throw new Error(`Bootstrap completed but no ${config.longCode}/${config.shortCode} market was found.`);
  }
  return market;
}

function makeTarget(target: string, vars: string[]): void {
  run(
    "make",
    [target, `NETWORK=${config.network}`, `SOURCE=${config.source}`, ...vars],
    { cwd: config.contractsRepo, stream: true, check: true },
  );
}

function recordDeploymentArtifacts(env: Record<string, string>, market: MarketTriplet): void {
  smoke.mergeArtifacts({
    market: {
      key: market.envKey,
      marketToken: market.marketToken,
      indexToken: market.indexToken,
      longToken: market.longToken,
      shortToken: market.shortToken,
    },
    contracts: {
      oracle: env.ORACLE,
      depositHandler: env.DEPOSIT_HANDLER,
      orderHandler: env.ORDER_HANDLER,
      orderVault: env.ORDER_VAULT,
      exchangeRouter: env.EXCHANGE_ROUTER,
      referralStorage: env.REFERRAL_STORAGE,
    },
    faucet: env.FAUCET,
  });
}

// ── Phase: indexer config + runtime ──────────────────────────────────────────────

async function syncIndexerConfig(): Promise<void> {
  await smoke.step("Sync indexer contract manifest", "frontend-config", () => {
    run("bun", ["run", "scripts/sync-contracts.ts", "--network", config.network], {
      cwd: SMOKE_PATHS.packageRoot,
      env: { ...process.env, SO4_CONTRACTS_REPO: config.contractsRepo },
      stream: true,
      check: true,
    });
    return { config: `config/contracts.${config.network}.json` };
  });
}

async function prepareIndexer(): Promise<void> {
  if (config.skipIndexerCheck) {
    smoke.skip("Prepare indexer runtime", "indexer-runtime", "--skip-indexer-check");
    return;
  }

  if (config.skipIndexerRestart) {
    smoke.skip("Rebuild + restart indexer", "indexer-runtime", "--skip-indexer-restart");
  } else {
    await smoke.step("Rebuild indexer for local config", "indexer-runtime", () => {
      // project.ts reads endpoints/contracts from the synced local config; clear the
      // host-only endpoint overrides so the container uses host.docker.internal.
      const buildEnv = { ...process.env, INDEXER_NETWORK: config.network, INDEXER_START_LEDGER: "1" };
      delete buildEnv.ENDPOINT;
      delete buildEnv.SOROBAN_ENDPOINT;
      delete buildEnv.CHAIN_ID;
      run("bun", ["run", "build"], { cwd: SMOKE_PATHS.packageRoot, env: buildEnv, stream: true, check: true });
      return { startLedger: 1 };
    });

    await smoke.step("Start indexer stack", "indexer-runtime", () => {
      if (!hasBinary("docker")) {
        throw new Error("`docker` is required to start the indexer stack. Re-run with --skip-indexer-restart if it is already running.");
      }
      run("docker", ["compose", "up", "-d", "--remove-orphans"], {
        cwd: SMOKE_PATHS.packageRoot,
        stream: true,
        check: true,
      });
      return { stack: "docker compose" };
    });
  }
}

// ── Phase: protocol actions ──────────────────────────────────────────────────────

async function runProtocolActions(
  keeperAddr: string,
  env: Record<string, string>,
  market: MarketTriplet,
): Promise<void> {
  const oracle = requireContract(env, "ORACLE");
  const depositHandler = requireContract(env, "DEPOSIT_HANDLER");
  const orderHandler = requireContract(env, "ORDER_HANDLER");
  const orderVault = requireContract(env, "ORDER_VAULT");
  const exchangeRouter = requireContract(env, "EXCHANGE_ROUTER");

  const prices = marketPrices(market);
  const currentLedger = (await getLatestLedger(config.sorobanRpcEndpoint)) ?? 0;
  const expirationLedger = currentLedger + 50_000;

  await smoke.step("Submit initial oracle prices", "contract-action", () => {
    // Submit up front so we fail early if the oracle rejects fixed prices
    // (wrong keeper role, missing testutils build, etc.).
    submitPrices(ctx, oracle, keeperAddr, prices);
    return { tokens: prices.length };
  });

  await smoke.step("Claim test tokens from faucet", "contract-action", () => {
    const faucet = env.FAUCET;
    if (!faucet) {
      return { claimed: false, reason: "no FAUCET in deployment" };
    }
    const long = claimFaucet(ctx, faucet, keeperAddr, market.longToken);
    const short = claimFaucet(ctx, faucet, keeperAddr, market.shortToken);
    return { longClaimed: long, shortClaimed: short };
  }, { fatal: false });

  const deposit = await smoke.step("Create + execute deposit", "contract-action", () =>
    depositFlow(ctx, {
      depositHandler,
      oracle,
      market: market.marketToken,
      longToken: market.longToken,
      shortToken: market.shortToken,
      keeperAddr,
      longAmount: 10n * ONE_TOKEN,
      shortAmount: 10n * ONE_TOKEN,
      expirationLedger,
      prices,
    }),
  );
  smoke.setArtifact("deposit", deposit);

  const longPrice = priceFor(config.longCode);
  const sizeDeltaUsd = longPrice * 2n; // 2x leverage on 1 token of collateral
  const open = await smoke.step("Open long position (MarketIncrease)", "contract-action", () =>
    openPositionFlow(ctx, {
      orderHandler,
      orderVault,
      exchangeRouter,
      oracle,
      market: market.marketToken,
      keeperAddr,
      collateralToken: market.longToken,
      collateralAmount: ONE_TOKEN,
      sizeDeltaUsd,
      acceptablePrice: (longPrice * 101n) / 100n,
      isLong: true,
      expirationLedger,
      prices,
    }),
  );
  smoke.setArtifact("openOrder", open);

  const close = await smoke.step("Close long position (MarketDecrease)", "contract-action", () =>
    closePositionFlow(ctx, {
      orderHandler,
      oracle,
      market: market.marketToken,
      keeperAddr,
      collateralToken: market.longToken,
      sizeDeltaUsd,
      acceptablePrice: (longPrice * 99n) / 100n,
      isLong: true,
      prices,
    }),
  );
  smoke.setArtifact("closeOrder", close);

  if (config.skipReferral) {
    smoke.skip("Register + set referral code", "contract-action", "--skip-referral");
  } else {
    const referral = await smoke.step(
      "Register + set referral code",
      "contract-action",
      () => referralFlow(ctx, requireContract(env, "REFERRAL_STORAGE"), keeperAddr, "SO4LOCAL"),
      { fatal: false },
    );
    if (referral) {
      smoke.setArtifact("referral", referral);
    }
  }
}

function marketPrices(market: MarketTriplet): PriceEntry[] {
  const entries = new Map<string, bigint>();
  entries.set(market.longToken, priceFor(config.longCode));
  entries.set(market.indexToken, priceFor(config.longCode));
  entries.set(market.shortToken, priceFor(config.shortCode));
  return [...entries].map(([token, price]) => ({ token, price }));
}

// ── Phase: GraphQL assertions ────────────────────────────────────────────────────

async function assertIndexedEntities(targetLedger: number): Promise<void> {
  if (config.skipIndexerCheck) {
    smoke.skip("Assert indexed entities", "graphql-query", "--skip-indexer-check");
    return;
  }

  await smoke.step("Wait for indexer to catch up", "indexer-runtime", async () => {
    const { caughtUp, metadata } = await waitForIndexer(config.graphqlEndpoint, targetLedger, {
      lagTolerance: config.indexerLagTolerance,
      timeoutMs: config.waitTimeoutMs,
    });
    if (!caughtUp) {
      throw new Error(
        `Indexer did not reach ledger ${targetLedger} within ${config.waitTimeoutMs}ms ` +
          `(last processed: ${metadata?.lastProcessedHeight ?? "unknown"}).`,
      );
    }
    return { targetLedger, lastProcessedHeight: metadata?.lastProcessedHeight };
  });

  await smoke.step("Assert indexed entities via GraphQL", "graphql-query", async () => {
    const counts = await fetchEntityCounts(config.graphqlEndpoint);
    const expected = {
      markets: 1,
      deposits: 1,
      orders: 2,
      positions: 1,
      transfers: 1,
    };
    const assertions = buildAssertions(counts, expected);
    const failed = assertions.filter((a) => !a.ok);

    smoke.setGraphql({
      endpoint: config.graphqlEndpoint,
      reachable: true,
      counts,
      assertions,
    });

    if (failed.length) {
      throw new Error(
        `Entity assertions failed: ${failed.map((a) => `${a.entity} ${a.actual}<${a.expected}`).join(", ")}`,
      );
    }
    return counts;
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────────

function requireContract(env: Record<string, string>, key: string): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Required contract ${key} missing from deployment output.`);
  }
  return value;
}

function printHeader(): void {
  process.stdout.write(
    [
      "SO4 local indexing smoke flow",
      `  network        : ${config.network}`,
      `  mode           : ${config.mode}`,
      `  contracts repo : ${config.contractsRepo}`,
      `  source / keeper: ${config.source} / ${config.keeper}`,
      `  soroban rpc    : ${config.sorobanRpcEndpoint}`,
      `  graphql        : ${config.graphqlEndpoint}`,
      `  report         : ${config.reportPath}`,
      "",
    ].join("\n") + "\n",
  );
}

function finish(success: boolean): void {
  const reportPath = smoke.write();
  const report = smoke.build();

  process.stdout.write("\n──────────────────────────────────────────────\n");
  process.stdout.write(`Smoke run ${success ? "PASSED" : "FAILED"} in ${report.durationMs}ms\n`);
  if (report.graphql?.counts) {
    const c = report.graphql.counts;
    process.stdout.write(
      `Entity counts: markets=${c.markets} deposits=${c.deposits} orders=${c.orders} ` +
        `positions=${c.positions} transfers=${c.transfers}\n`,
    );
  }
  if (report.failure) {
    process.stdout.write(`Broken layer: ${report.failure.layer} — ${report.failure.step}\n`);
    process.stdout.write(`  ${report.failure.error}\n`);
  }
  process.stdout.write(`Report: ${reportPath}\n`);

  process.exit(success ? 0 : 1);
}
