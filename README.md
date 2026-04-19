# SoroProtocol App

Next.js dashboard for creating and managing payment streams on Stellar.

## Features

- Connect Freighter wallet
- Create, view, and cancel payment streams
- Real-time balance counter (updates every 200ms)
- Vesting schedule management
- Dark / light mode

## Getting Started

```bash
npm install
cp .env.example .env.local
# Fill in contract IDs in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_NETWORK` | `testnet` or `mainnet` |
| `NEXT_PUBLIC_STREAM_CONTRACT_ID` | Deployed stream contract ID |
| `NEXT_PUBLIC_VESTING_CONTRACT_ID` | Deployed vesting contract ID |
| `NEXT_PUBLIC_API_URL` | Backend API URL |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
