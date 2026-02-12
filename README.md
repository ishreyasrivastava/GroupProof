# GroupProof 🔗

**Blockchain-based contribution tracker for group projects**

Stop letting teammates take credit for your work. GroupProof records git commits on the Polygon blockchain, creating immutable proof of who contributed what.

[![Live Demo](https://img.shields.io/badge/Live-Demo-8247E5?style=for-the-badge)](https://groupproof.vercel.app)
[![Polygon](https://img.shields.io/badge/Polygon-Amoy-8247E5?style=for-the-badge)](https://amoy.polygonscan.com)

## ✨ Features

- **🔐 Immutable Proof** - Commits recorded on Polygon blockchain
- **📊 Contribution Dashboard** - Visual breakdown of who did what
- **🔧 Easy Setup** - CLI tool installs git hooks in seconds
- **👥 Team Tracking** - Multiple contributors per project
- **📱 Mobile Responsive** - Check contributions from anywhere
- **🆓 Free to Use** - Only testnet gas fees (free MATIC from faucet)

## 🚀 Quick Start

### For Project Owners

1. **Create a project** on the [dashboard](https://groupproof.vercel.app/create)
2. **Install the CLI** in your repository:
```bash
npx groupproof-cli init
```
3. **Share** the `.groupproof.json` file with your team

### For Team Members

1. Get the `.groupproof.json` from your project owner
2. **Join the project**:
```bash
npx groupproof-cli join
```
3. **Install hooks**:
```bash
npx groupproof-cli install
```

That's it! Every commit is now recorded on the blockchain.

## 📁 Project Structure

```
GroupProof/
├── contracts/          # Solidity smart contract
│   ├── GroupProof.sol  # Main contract
│   └── hardhat.config.js
├── cli/                # Command-line tool
│   └── bin/groupproof.js
└── dashboard/          # React web app
    └── src/
        ├── components/
        ├── pages/
        ├── hooks/
        └── utils/
```

## 🛠️ Technology Stack

- **Blockchain**: Polygon (Amoy Testnet)
- **Smart Contract**: Solidity 0.8.19
- **Frontend**: React 18 + Vite + TailwindCSS
- **CLI**: Node.js + Commander.js
- **Wallet**: MetaMask integration
- **Charts**: Recharts
- **Animations**: Framer Motion

## 📋 Smart Contract

The `GroupProof.sol` contract stores:
- Project metadata (name, description, owner)
- Commit details (hash, author, message, stats)
- Contributor statistics (commits, additions, deletions)

### Key Functions

| Function | Description |
|----------|-------------|
| `createProject` | Create a new project |
| `recordCommit` | Record a git commit |
| `getProject` | Get project details |
| `getCommits` | Get paginated commit history |
| `getContributorStats` | Get stats for a contributor |

## 🔒 Security

- Private keys are stored locally in `.env` (gitignored)
- Only commit authors can record their own commits
- Project owners can deactivate projects
- All data is publicly verifiable on blockchain

## 🌐 Networks

| Network | Chain ID | Status |
|---------|----------|--------|
| Polygon Amoy | 80002 | ✅ Testnet |
| Polygon Mainnet | 137 | 🔜 Coming |

## 📖 CLI Commands

```bash
# Initialize project (creates on blockchain)
groupproof init

# Join existing project
groupproof join

# Install git hooks
groupproof install

# Record current commit manually
groupproof record

# Sync all unrecorded commits
groupproof sync --limit 50

# Check status
groupproof status
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

MIT License - feel free to use this for your own projects!

## 👩‍💻 Author

**Shreya Srivastava** - [GitHub](https://github.com/ishreyasrivastava)

---

<p align="center">
  <strong>Built for JUIT Final Year Project Teams</strong><br>
  <em>Because proof beats promises.</em>
</p>
