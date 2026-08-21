# Changelog
## [Unreleased]
### Added
- SendFlow multi-step form
- Contact book
- Transaction history
- Dark mode
- Exchange rate display
- Test coverage for `horizonUrl`/`fetchAccountFromHorizon`'s
  testnet/mainnet host selection, error handling, and account-info
  mapping (#21)

### Fixed
- EscrowForm now rejects self-escrow (beneficiary === depositor) and
  arbiter addresses that match the depositor or beneficiary (#23)
- `useTheme` now subscribes to live OS theme changes when set to
  `'system'`, instead of reading `matchMedia(...).matches` once and
  going stale until `theme` itself changes (#31)
- `useRecentTransactions(limit)`'s query key now includes `limit`, so
  Dashboard's RecentTransactions(5)/QuickStats(50)/ActivityChart(50) and
  History's HistoryChart(100)/HistorySummary(50) no longer collide on one
  shared cache entry and silently receive the wrong dataset size (#51)

### Removed
- Removed the orphaned `useStellarAccount` hook: it had no call sites,
  hardcoded mainnet Horizon regardless of the selected network, and
  duplicated the network-aware account fetching already provided by
  `useWallet`/`fetchAccountFromHorizon` (#21)
