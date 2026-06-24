// Reset local indexer state so the smoke flow can be rerun cleanly.
//
// SubQuery persists indexed entities in the Postgres volume started by
// docker-compose. Re-running the smoke flow against a stale database double-counts
// entities and makes assertions ambiguous, so this script tears the stack down
// (optionally removing the volume) and clears the local report.
//
// Usage:
//   bun run scripts/clean-local.ts            # stop stack + drop DB volume + clear report
//   bun run scripts/clean-local.ts --keep-db  # stop stack only, keep indexed data
//   bun run scripts/clean-local.ts --reports  # only delete the .smoke report dir

import { existsSync, rmSync } from "node:fs";
import path from "node:path";

import { parseArgs } from "./lib/config";
import { hasBinary, run } from "./lib/process";

const packageRoot = path.resolve(import.meta.dir, "..");
const { bools } = parseArgs(process.argv.slice(2));

const reportsOnly = bools.has("reports");
const keepDb = bools.has("keepDb");

function clearReports(): void {
  const smokeDir = path.join(packageRoot, ".smoke");
  if (existsSync(smokeDir)) {
    rmSync(smokeDir, { recursive: true, force: true });
    process.stdout.write(`Removed ${smokeDir}\n`);
  } else {
    process.stdout.write("No .smoke report directory to remove.\n");
  }
}

function stopStack(): void {
  if (!hasBinary("docker")) {
    process.stdout.write("docker not found — skipping stack teardown.\n");
    return;
  }

  const args = ["compose", "down", "--remove-orphans"];
  if (!keepDb) {
    args.push("--volumes");
  }
  run("docker", args, { cwd: packageRoot, stream: true });

  // The Postgres volume is also bind-mounted at .data/postgres in this repo.
  // The container writes those files as root, so a plain rm may be denied — fall
  // back to removing them from inside a throwaway container.
  if (!keepDb) {
    const dataDir = path.join(packageRoot, ".data");
    if (existsSync(dataDir)) {
      try {
        rmSync(dataDir, { recursive: true, force: true });
        process.stdout.write(`Removed ${dataDir}\n`);
      } catch {
        run("docker", ["run", "--rm", "-v", `${packageRoot}:/work`, "alpine", "rm", "-rf", "/work/.data"], {
          stream: true,
        });
        process.stdout.write(`Removed ${dataDir} (via container)\n`);
      }
    }
  }
}

if (reportsOnly) {
  clearReports();
} else {
  stopStack();
  clearReports();
  process.stdout.write(
    keepDb
      ? "Indexer stack stopped (database preserved).\n"
      : "Indexer stack stopped and local database cleared. Safe to rerun smoke:local.\n",
  );
}
