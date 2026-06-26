#!/usr/bin/env bash
# scripts/validate-manifest.sh <path/to/contracts.<network>.json>
#
# Validates that a synced indexer manifest contains every required field. Used
# by scripts/check-integration.sh and the CI integration job to catch sync
# regressions without needing a live Stellar deploy.

set -euo pipefail

manifest="${1:-}"
if [ -z "$manifest" ] || [ ! -f "$manifest" ]; then
  echo "usage: $0 <path/to/contracts.<network>.json>" >&2
  exit 2
fi

required_contracts=(
  role_store
  data_store
  oracle
  market_factory
  deposit_handler
  withdrawal_handler
  order_handler
  liquidation_handler
  adl_handler
  fee_handler
  referral_storage
  reader
  exchange_router
)

required_tokens=(TUSDC TWBTC TETH TXLM faucet)

missing=()

has_field() {
  # JSON field-presence probe using bun -e so we don't add a jq dependency.
  bun -e "
    const data = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
    const path = process.argv[2].split('.');
    let v = data;
    for (const p of path) {
      if (v == null || !(p in v)) process.exit(1);
      v = v[p];
    }
    if (v == null || v === '') process.exit(1);
  " "$manifest" "$1"
}

for f in network.name network.passphrase network.horizonEndpoint network.sorobanRpcEndpoint; do
  has_field "$f" || missing+=("$f")
done

for c in "${required_contracts[@]}"; do
  has_field "contracts.$c" || missing+=("contracts.$c")
done

for t in "${required_tokens[@]}"; do
  has_field "tokens.$t" || missing+=("tokens.$t")
done

if [ "${#missing[@]}" -gt 0 ]; then
  echo "Manifest $manifest is missing required fields:" >&2
  for m in "${missing[@]}"; do echo "  - $m" >&2; done
  exit 1
fi

echo "Manifest $manifest passed validation."
