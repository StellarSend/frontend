import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

type EnvMap = Record<string, string>;

type ContractsJson = {
  network?: string;
  network_passphrase?: string;
  contracts?: Record<string, string>;
};

type MarketConfig = {
  name: string;
  marketToken: string;
  indexToken: string;
  longToken: string;
  shortToken: string;
};

const CORE_CONTRACT_KEYS = [
  "role_store",
  "data_store",
  "oracle",
  "market_factory",
  "deposit_handler",
  "withdrawal_handler",
  "order_handler",
  "liquidation_handler",
  "adl_handler",
  "fee_handler",
  "referral_storage",
  "reader",
  "exchange_router",
] as const;

const TOKEN_KEYS = ["TUSDC", "TWBTC", "TETH", "TXLM", "faucet"] as const;

const NETWORK_DEFAULTS: Record<
  string,
  { horizonEndpoint: string; sorobanRpcEndpoint: string; networkPassphrase: string }
> = {
  testnet: {
    horizonEndpoint: "https://horizon-testnet.stellar.org",
    sorobanRpcEndpoint: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
  },
  local: {
    horizonEndpoint: "http://host.docker.internal:8000",
    sorobanRpcEndpoint: "http://host.docker.internal:8000/soroban/rpc",
    networkPassphrase: "Standalone Network ; February 2017",
  },
};

const args = parseArgs(process.argv.slice(2));
const network = (args.network ?? args._[0] ?? "testnet").toLowerCase();
const packageRoot = path.resolve(import.meta.dir, "..");
const repoRoot = path.resolve(packageRoot, "../..");
const contractsRepoPath = resolveContractsRepoPath(args.contractsRepo);
const outputPath = path.resolve(
  packageRoot,
  args.output ?? `config/contracts.${network}.json`,
);

const contractIdsPath = path.join(
  contractsRepoPath,
  ".stellar",
  "contract-ids",
  `${network}.json`,
);
const deployEnvPath = path.join(contractsRepoPath, ".deployed", `${network}.env`);
const tokensEnvPath = path.join(
  contractsRepoPath,
  ".deployed",
  `tokens-${network}.env`,
);
const frontendEnvPath = path.join(
  contractsRepoPath,
  ".deployed",
  `frontend-${network}.env`,
);
const frontendTsPath = path.join(
  contractsRepoPath,
  ".deployed",
  `frontend-${network}.ts`,
);

main();

function main(): void {
  const missingFiles = [
    contractIdsPath,
    deployEnvPath,
    tokensEnvPath,
    frontendEnvPath,
  ].filter((file) => !existsSync(file));

  if (missingFiles.length > 0) {
    fail(
      [
        `Missing deployment output for network "${network}".`,
        `Contracts repo: ${contractsRepoPath}`,
        "Expected files:",
        ...missingFiles.map((file) => `  - ${path.relative(contractsRepoPath, file)}`),
        "Deploy/bootstrap contracts first, or set SO4_CONTRACTS_REPO to the contracts repo path.",
      ].join("\n"),
    );
  }

  const contractIds = readJson<ContractsJson>(contractIdsPath);
  const deployedEnv = readEnvFile(deployEnvPath);
  const tokenEnv = readEnvFile(tokensEnvPath);
  const frontendEnv = readEnvFile(frontendEnvPath);
  const frontendTs = existsSync(frontendTsPath) ? readFileSync(frontendTsPath, "utf8") : "";

  const networkName = deployedEnv.NETWORK ?? contractIds.network ?? network;
  const defaults = NETWORK_DEFAULTS[networkName] ?? NETWORK_DEFAULTS[network];
  const networkPassphrase =
    process.env.INDEXER_NETWORK_PASSPHRASE ??
    contractIds.network_passphrase ??
    readTsString(frontendTs, "networkPassphrase") ??
    defaults?.networkPassphrase;
  const horizonEndpoint =
    process.env.INDEXER_HORIZON_ENDPOINT ??
    process.env.ENDPOINT ??
    defaults?.horizonEndpoint;
  const sorobanRpcEndpoint =
    process.env.INDEXER_SOROBAN_RPC_ENDPOINT ??
    process.env.SOROBAN_ENDPOINT ??
    readTsString(frontendTs, "rpcUrl") ??
    defaults?.sorobanRpcEndpoint;

  requireValue(networkName, "network name");
  requireValue(networkPassphrase, "network passphrase");
  requireValue(horizonEndpoint, "Horizon endpoint");
  requireValue(sorobanRpcEndpoint, "Soroban RPC endpoint");

  const coreContracts = collectCoreContracts(deployedEnv, frontendEnv, contractIds);
  const tokens = collectTokens(tokenEnv, frontendEnv);
  const { markets, warnings } = collectMarkets(deployedEnv);

  const config = {
    generatedAt: new Date().toISOString(),
    source: {
      contractsRepoPath,
      files: {
        contractIds: path.relative(contractsRepoPath, contractIdsPath),
        deployedEnv: path.relative(contractsRepoPath, deployEnvPath),
        tokensEnv: path.relative(contractsRepoPath, tokensEnvPath),
        frontendEnv: path.relative(contractsRepoPath, frontendEnvPath),
        frontendTs: existsSync(frontendTsPath)
          ? path.relative(contractsRepoPath, frontendTsPath)
          : null,
      },
    },
    network: {
      name: networkName,
      passphrase: networkPassphrase,
      horizonEndpoint,
      sorobanRpcEndpoint,
    },
    contracts: coreContracts,
    tokens,
    markets,
    warnings,
  };

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(config, null, 2)}\n`);

  console.log(`Synced ${networkName} contracts to ${path.relative(repoRoot, outputPath)}`);
  console.log(`Core contracts: ${Object.keys(coreContracts).length}`);
  console.log(`Tokens: ${Object.keys(tokens).length}`);
  console.log(`Markets: ${markets.length}`);
  for (const warning of warnings) {
    console.warn(`Warning: ${warning}`);
  }
}

function collectCoreContracts(
  deployedEnv: EnvMap,
  frontendEnv: EnvMap,
  contractIds: ContractsJson,
): Record<(typeof CORE_CONTRACT_KEYS)[number], string> {
  const contracts = {} as Record<(typeof CORE_CONTRACT_KEYS)[number], string>;
  const missing: string[] = [];

  for (const key of CORE_CONTRACT_KEYS) {
    const envKey = key.toUpperCase();
    const value =
      deployedEnv[envKey] ??
      frontendEnv[envKey] ??
      contractIds.contracts?.[key];

    if (!value) {
      missing.push(envKey);
      continue;
    }
    assertContractId(value, envKey);
    contracts[key] = value;
  }

  if (missing.length > 0) {
    fail(`Missing required core contract IDs: ${missing.join(", ")}`);
  }

  return contracts;
}

function collectTokens(
  tokenEnv: EnvMap,
  frontendEnv: EnvMap,
): Record<(typeof TOKEN_KEYS)[number], string> {
  const tokens = {} as Record<(typeof TOKEN_KEYS)[number], string>;
  const missing: string[] = [];

  for (const key of TOKEN_KEYS) {
    const envKey = key === "faucet" ? "FAUCET" : key;
    const frontendKey = key === "faucet" ? "FAUCET" : `TOKEN_${key}`;
    const value = tokenEnv[envKey] ?? frontendEnv[frontendKey];

    if (!value) {
      missing.push(envKey);
      continue;
    }
    assertContractId(value, envKey);
    tokens[key] = value;
  }

  if (missing.length > 0) {
    fail(`Missing required test token contract IDs: ${missing.join(", ")}`);
  }

  return tokens;
}

function collectMarkets(deployedEnv: EnvMap): { markets: MarketConfig[]; warnings: string[] } {
  const warnings: string[] = [];
  const marketNames = new Set<string>();

  for (const key of Object.keys(deployedEnv)) {
    const match = key.match(/^MARKET_TOKEN_(.+)_(LONG|SHORT|INDEX)$/);
    if (match) {
      marketNames.add(match[1]);
    }
  }

  const markets: MarketConfig[] = [];
  const incomplete: string[] = [];

  for (const envName of [...marketNames].sort()) {
    const displayName = envName.replace("_", "/");
    const marketToken = deployedEnv[`MARKET_TOKEN_${envName}`];
    const indexToken = deployedEnv[`MARKET_TOKEN_${envName}_INDEX`];
    const longToken = deployedEnv[`MARKET_TOKEN_${envName}_LONG`];
    const shortToken = deployedEnv[`MARKET_TOKEN_${envName}_SHORT`];
    const missing = [
      [`MARKET_TOKEN_${envName}`, marketToken],
      [`MARKET_TOKEN_${envName}_INDEX`, indexToken],
      [`MARKET_TOKEN_${envName}_LONG`, longToken],
      [`MARKET_TOKEN_${envName}_SHORT`, shortToken],
    ]
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      incomplete.push(`${displayName}: ${missing.join(", ")}`);
      continue;
    }

    assertContractId(marketToken, `MARKET_TOKEN_${envName}`);
    assertContractId(indexToken, `MARKET_TOKEN_${envName}_INDEX`);
    assertContractId(longToken, `MARKET_TOKEN_${envName}_LONG`);
    assertContractId(shortToken, `MARKET_TOKEN_${envName}_SHORT`);
    markets.push({ name: displayName, marketToken, indexToken, longToken, shortToken });
  }

  if (incomplete.length > 0) {
    warnings.push(
      `Some MARKET_TOKEN_* values are missing. This is only expected before market bootstrap: ${incomplete.join("; ")}`,
    );
  }

  if (markets.length === 0) {
    warnings.push(
      "No complete market token triplets found. Run market bootstrap before indexing market-specific contract events.",
    );
  }

  return { markets, warnings };
}

function resolveContractsRepoPath(cliPath?: string): string {
  const configured =
    cliPath ??
    process.env.SO4_CONTRACTS_REPO ??
    process.env.CONTRACTS_REPO_PATH ??
    process.env.CONTRACTS_REPO;

  if (configured) {
    return path.resolve(configured);
  }

  const candidates = [
    path.resolve(repoRoot, "../contracts"),
    path.resolve(packageRoot, "../contracts"),
    "/home/sunny/zero/so4-market-project/contracts",
  ];

  const found = candidates.find((candidate) =>
    existsSync(path.join(candidate, ".deployed")),
  );

  return found ?? candidates[0];
}

function readEnvFile(filePath: string): EnvMap {
  const contents = readFileSync(filePath, "utf8");
  const env: EnvMap = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    env[key] = stripQuotes(rawValue);
  }

  return env;
}

function readJson<T>(filePath: string): T {
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch (error) {
    fail(`Could not parse ${filePath}: ${formatError(error)}`);
  }
}

function readTsString(contents: string, propertyName: string): string | undefined {
  const match = contents.match(new RegExp(`${propertyName}:\\s*"([^"]+)"`));
  return match?.[1];
}

function requireValue(value: string | undefined, label: string): asserts value is string {
  if (!value) {
    fail(`Missing ${label}. Set it in deployment output or an INDEXER_* environment override.`);
  }
}

function assertContractId(value: string, label: string): void {
  if (!/^C[A-Z2-7]{55}$/.test(value)) {
    fail(`${label} is not a valid Stellar contract ID: ${value}`);
  }
}

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseArgs(argv: string[]): Record<string, string | string[]> & { _: string[] } {
  const parsed: Record<string, string | string[]> & { _: string[] } = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      parsed._.push(arg);
      continue;
    }

    const [rawKey, inlineValue] = arg.slice(2).split("=", 2);
    const key = rawKey.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
    const value = inlineValue ?? argv[index + 1];
    if (inlineValue === undefined) {
      index += 1;
    }
    parsed[key] = value;
  }

  return parsed;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}
