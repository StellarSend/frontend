#!/usr/bin/env bash
# scripts/check-integration.sh
#
# Local pre-PR integration check. Mirrors the matrix in
# .github/workflows/integration-checks.yml so contributors can catch schema,
# mapping, and manifest-sync regressions before pushing.
#
# Usage:
#   bash scripts/check-integration.sh
#   bash scripts/check-integration.sh --skip-web
#   bash scripts/check-integration.sh --skip-sync
#
# Requires: Bun, and a clean workspace install (`bun install`).

set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_root"

skip_web=0
skip_sync=0

for arg in "$@"; do
  case "$arg" in
    --skip-web)  skip_web=1 ;;
    --skip-sync) skip_sync=1 ;;
    -h|--help)
      sed -n '2,16p' "$0"
      exit 0
      ;;
    *)
      echo "unknown option: $arg" >&2
      exit 2
      ;;
  esac
done

step() {
  printf '\n\033[1;34m==> %s\033[0m\n' "$1"
}

step "Indexer codegen (subql codegen)"
bun run --cwd apps/s03-indexer codegen

step "Indexer build (subql build)"
bun run --cwd apps/s03-indexer build

step "Indexer mapping unit tests"
bun run --cwd apps/s03-indexer test

if [ "$skip_sync" -eq 0 ]; then
  step "Manifest sync against offline fixtures"
  SO4_CONTRACTS_REPO="$repo_root/apps/s03-indexer/tests/fixtures/contracts-repo" \
    bun run --cwd apps/s03-indexer sync:contracts:local
  bash scripts/validate-manifest.sh apps/s03-indexer/config/contracts.local.json
fi

if [ "$skip_web" -eq 0 ]; then
  step "Web typecheck"
  bun run --cwd apps/web typecheck

  step "Web production build"
  bun run --cwd apps/web build
fi

printf '\n\033[1;32mAll integration checks passed.\033[0m\n'
