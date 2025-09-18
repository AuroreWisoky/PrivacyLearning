# Quick Start Guide - Hello FHEVM

Get your privacy learning dApp running in minutes!

## Prerequisites

- Node.js (v16+)
- MetaMask browser extension
- Git
- Basic knowledge of JavaScript and Solidity

## 🚀 Quick Setup (5 minutes)

### 1. Clone and Setup

```bash
# Clone this repository
git clone <your-repo-url>
cd hello-fhevm-tutorial

# Install dependencies
npm install

# Install Hardhat globally (optional)
npm install -g hardhat
```

### 2. Start Local Blockchain

```bash
# Terminal 1: Start Hardhat network
npx hardhat node
```

### 3. Deploy Contract

```bash
# Terminal 2: Deploy the smart contract
npx hardhat run scripts/deploy.js --network localhost

# Note the deployed contract address
```

### 4. Configure MetaMask

Add Hardhat Local Network:
- Network Name: `Hardhat Local`
- RPC URL: `http://localhost:8545`
- Chain ID: `31337`
- Currency Symbol: `ETH`

Import test account from Hardhat output.

### 5. Start Web Server

```bash
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js
npx http-server . -p 8000

# Option 3: VS Code Live Server extension
```

### 6. Open Application

1. Navigate to `http://localhost:8000`
2. Connect MetaMask wallet
3. Connect to deployed contract
4. Start learning with privacy!

## 🌐 Deploy to Zama Testnet

### 1. Get Testnet Tokens

Visit [Zama Faucet](https://faucet.zama.ai/) to get test tokens.

### 2. Configure Environment

```bash
# Set your private key
export PRIVATE_KEY="your_private_key_here"
```

### 3. Deploy

```bash
npx hardhat run scripts/deploy.js --network zama
```

### 4. Configure MetaMask

Add Zama Testnet:
- Network Name: `Zama Testnet`
- RPC URL: `https://devnet.zama.ai`
- Chain ID: `8009`
- Currency Symbol: `ZAMA`

## 📱 Using the Application

1. **Connect Wallet**: Click "Connect MetaMask"
2. **Deploy Contract**: Click "Connect to Contract"
3. **Learn**: Check off completed lessons
4. **Update Progress**: Click "Update Progress" to save to blockchain
5. **Track Stats**: View your learning progress and streaks

## 🔧 Development Commands

```bash
# Run tests
npx hardhat test

# Compile contracts
npx hardhat compile

# Local deployment
npx hardhat run scripts/deploy.js --network localhost

# Testnet deployment
npx hardhat run scripts/deploy.js --network zama

# Verify contract (after deployment)
npx hardhat verify --network zama DEPLOYED_CONTRACT_ADDRESS
```

## 📁 Project Structure

```
├── contracts/          # Smart contracts
│   └── PrivacyLearning.sol
├── scripts/            # Deployment scripts
│   └── deploy.js
├── test/              # Test files
│   └── PrivacyLearning.test.js
├── public/            # Static assets
├── index.html         # Main application
├── app.js            # Frontend JavaScript
├── styles.css        # Styling
├── hardhat.config.js # Hardhat configuration
└── TUTORIAL.md       # Complete tutorial
```

## 🐛 Troubleshooting

### Common Issues

**MetaMask Connection Issues:**
- Ensure you're on the correct network
- Clear MetaMask cache and restart browser
- Check that MetaMask is updated

**Contract Deployment Fails:**
- Verify you have enough test ETH/ZAMA
- Check network configuration in hardhat.config.js
- Ensure private key is set correctly

**Frontend Not Loading:**
- Check web server is running on correct port
- Verify all files are in correct directories
- Open browser console for error messages

**Transaction Failures:**
- Ensure student is enrolled before updating progress
- Check gas limits and prices
- Verify contract address is correct

### Getting Help

- Read the full [TUTORIAL.md](./TUTORIAL.md) for detailed explanations
- Check [Zama Documentation](https://docs.zama.ai)
- Join the [Zama Discord Community](https://discord.gg/zama)
- Open an issue on GitHub for bugs

## 📚 Learning Path

1. **Start Here**: Follow this Quick Start Guide
2. **Deep Dive**: Read the complete [TUTORIAL.md](./TUTORIAL.md)
3. **Experiment**: Modify the code and add features
4. **Learn More**: Explore FHEVM documentation
5. **Build**: Create your own privacy-preserving dApp

## 🎯 Next Steps

After completing this tutorial:

- Add more privacy features to the learning platform
- Explore other FHEVM use cases (voting, auctions, etc.)
- Learn about advanced FHE concepts
- Join the Zama developer community
- Build production-ready privacy applications

**Happy Learning! 🛡️**