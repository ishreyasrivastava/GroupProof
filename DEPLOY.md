# GroupProof Deployment Guide

## Step 1: Deploy the Smart Contract

### Get Testnet MATIC
1. Go to [faucet.polygon.technology](https://faucet.polygon.technology/)
2. Enter wallet address: `0x3eef10655Bb8Df833e0c6c19135EF024DB8A779a`
3. Request Amoy testnet MATIC

### Deploy Contract
```bash
cd contracts

# Create .env file with the generated private key
echo "PRIVATE_KEY=0x13bfc7592bf5f91ee1da895d9d8b31efdb261dcb8f7a330defe3ba6fdea54c19" > .env

# Deploy to Polygon Amoy
npm run deploy:amoy

# Note the contract address output
```

## Step 2: Configure Dashboard

### Set Environment Variable on Vercel
1. Go to [Vercel Dashboard](https://vercel.com/shreya-srivastavas-projects-ce2c5853/groupproof/settings/environment-variables)
2. Add: `VITE_CONTRACT_ADDRESS` = `<your deployed contract address>`
3. Redeploy

Or via CLI:
```bash
vercel env add VITE_CONTRACT_ADDRESS <CONTRACT_ADDRESS>
vercel --prod
```

## Deployment Wallet

**Address:** `0x3eef10655Bb8Df833e0c6c19135EF024DB8A779a`
**Private Key:** `0x13bfc7592bf5f91ee1da895d9d8b31efdb261dcb8f7a330defe3ba6fdea54c19`

⚠️ This is a testnet-only wallet. Do not use with real funds.

## Links

- **Dashboard:** https://groupproof.vercel.app
- **GitHub:** https://github.com/ishreyasrivastava/GroupProof
- **Polygon Amoy Explorer:** https://amoy.polygonscan.com
