# StellarSend Frontend Architecture

## Directory Structure

```
src/
  components/       # UI components, organized by feature
    SendFlow/       # Multi-step payment flow
    ContactBook/    # Saved recipient management
    TransactionHistory/  # Payment history
    ExchangeRate/   # XLM price display
    common/         # Shared reusable components
  hooks/            # Custom React hooks
  pages/            # Top-level route pages
  utils/            # Pure utility functions
  types/            # TypeScript type definitions
  test/             # Test setup and utilities
```

## Key Design Decisions

- **Hooks-first**: State logic lives in hooks, not components
- **localStorage persistence**: Contacts and theme stored client-side
- **Horizon API**: Direct calls to Stellar Horizon for account and payment data
- **Freighter integration**: Browser wallet via `@stellar/freighter-api`
