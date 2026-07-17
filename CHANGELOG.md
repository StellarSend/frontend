# Changelog
## [Unreleased]
### Added
- SendFlow multi-step form
- Contact book
- Transaction history
- Dark mode
- Exchange rate display

### Fixed
- EscrowForm now rejects self-escrow (beneficiary === depositor) and
  arbiter addresses that match the depositor or beneficiary (#23)

### Removed
- Removed the orphaned `useStellarAccount` hook: it had no call sites,
  hardcoded mainnet Horizon regardless of the selected network, and
  duplicated the network-aware account fetching already provided by
  `useWallet`/`fetchAccountFromHorizon` (#21)
