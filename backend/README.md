# GroupProof Backend API

REST API for the GroupProof blockchain contribution tracker.

## Setup

```bash
cp .env.example .env
# Edit .env with your contract address
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check |
| GET | `/api/projects` | No | List projects (paginated) |
| GET | `/api/projects/:id` | No | Project details |
| GET | `/api/projects/:id/commits` | No | Project commits (paginated) |
| GET | `/api/projects/:id/contributors` | No | Contributors with stats |
| GET | `/api/projects/:id/analytics` | No | Contribution analytics |
| GET | `/api/users/:address/projects` | No | User's projects |
| POST | `/api/projects` | Wallet sig | Create project (returns tx data) |
| POST | `/api/projects/:id/commits` | Wallet sig | Record commit (returns tx data) |

## Authentication

POST endpoints require EIP-191 wallet signature headers:
- `x-wallet-address`: Signer's Ethereum address
- `x-signature`: EIP-191 signature
- `x-message`: JSON message with `timestamp` field

## Tech Stack

Express, ethers v6, Helmet, CORS, rate limiting, in-memory TTL cache.

## Testing

```bash
npm test
```
