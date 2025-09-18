# Deployment Guide - Hello FHEVM Privacy Learning dApp

Complete guide for deploying your FHEVM privacy learning application to various networks.

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Local Development](#local-development)
3. [Testnet Deployment](#testnet-deployment)
4. [Production Deployment](#production-deployment)
5. [Frontend Hosting](#frontend-hosting)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)

## Deployment Overview

### Deployment Targets

| Environment | Purpose | Network | Cost |
|-------------|---------|---------|------|
| Local | Development & Testing | Hardhat | Free |
| Zama Testnet | Integration Testing | Zama Devnet | Free (Testnet) |
| Zama Mainnet | Production | Zama Mainnet | Real Cost |
| Frontend | User Interface | Vercel/Netlify | Free Tier |

### Prerequisites

- Node.js v16 or higher
- Hardhat development environment
- MetaMask wallet with test/main tokens
- Private key for deployment account
- Git for version control

## Local Development

### 1. Setup Local Environment

```bash
# Clone the repository
git clone <your-repository-url>
cd hello-fhevm-tutorial

# Install dependencies
npm install

# Verify Hardhat installation
npx hardhat --version
```

### 2. Configure Hardhat

Ensure your `hardhat.config.js` includes local network:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
      evmVersion: "london",
    },
  },
  networks: {
    hardhat: {
      accounts: {
        count: 100,
        accountsBalance: "10000000000000000000000000", // 10M ETH
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: {
        mnemonic: "test test test test test test test test test test test junk"
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  }
};
```

### 3. Start Local Blockchain

```bash
# Terminal 1: Start Hardhat network
npx hardhat node

# Expected output:
# Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
#
# Accounts:
# Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
# Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 4. Deploy Contract Locally

```bash
# Terminal 2: Deploy contract
npx hardhat run scripts/deploy.js --network localhost

# Expected output:
# Deploying contracts with the account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
# Account balance: 10000000000000000000000000
# PrivacyLearning contract deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
# Total modules initialized: 4
```

### 5. Configure MetaMask for Local Testing

1. **Add Hardhat Network**:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. **Import Test Account**:
   - Use private key from Hardhat output
   - Account will have 10,000 ETH for testing

### 6. Test Local Deployment

```bash
# Run contract tests
npx hardhat test

# Test specific functionality
npx hardhat run scripts/test-deployment.js --network localhost
```

Create `scripts/test-deployment.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // From deployment
    const [signer] = await ethers.getSigners();

    const PrivacyLearning = await ethers.getContractFactory("PrivacyLearning");
    const contract = PrivacyLearning.attach(contractAddress);

    console.log("Testing deployed contract...");

    // Test enrollment
    const tx1 = await contract.enrollStudent();
    await tx1.wait();
    console.log("✓ Student enrolled successfully");

    // Test lesson completion
    const tx2 = await contract.completeLesson(0, 0, true);
    await tx2.wait();
    console.log("✓ Lesson completed successfully");

    // Check progress
    const progress = await contract.getMyModuleProgress(0);
    console.log(`✓ Module progress: ${progress}%`);

    console.log("All tests passed!");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
```

## Testnet Deployment

### 1. Zama Testnet Setup

#### Get Test Tokens

1. Visit [Zama Faucet](https://faucet.zama.ai/)
2. Enter your wallet address
3. Request test ZAMA tokens
4. Verify tokens received in MetaMask

#### Configure Environment Variables

```bash
# Create .env file (NEVER commit to git)
echo "PRIVATE_KEY=your_private_key_here" > .env

# Install dotenv for environment variables
npm install dotenv
```

Update `hardhat.config.js`:

```javascript
require("dotenv").config();

module.exports = {
  // ... other config
  networks: {
    zama: {
      url: "https://devnet.zama.ai",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 8009,
      gasPrice: "auto",
      gas: "auto",
    }
  }
};
```

### 2. Deploy to Zama Testnet

```bash
# Compile contracts
npx hardhat compile

# Deploy to Zama testnet
npx hardhat run scripts/deploy.js --network zama

# Expected output:
# Deploying contracts with the account: 0x742d35Cc6624C0532abcd0d1234567890123456
# Account balance: 1000000000000000000 (1 ZAMA)
# PrivacyLearning contract deployed to: 0x1234567890123456789012345678901234567890
```

### 3. Verify Contract on Explorer

```bash
# Install verification plugin
npm install --save-dev @nomiclabs/hardhat-etherscan

# Verify contract (if explorer supports it)
npx hardhat verify --network zama DEPLOYED_CONTRACT_ADDRESS
```

### 4. Configure MetaMask for Zama Testnet

1. **Add Zama Testnet**:
   - Network Name: `Zama Testnet`
   - RPC URL: `https://devnet.zama.ai`
   - Chain ID: `8009`
   - Currency Symbol: `ZAMA`
   - Block Explorer: `https://explorer.zama.ai` (if available)

2. **Import Your Deployment Account**:
   - Use the same private key used for deployment
   - Verify you have test ZAMA tokens

### 5. Test Testnet Deployment

Create `scripts/testnet-verification.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
    const contractAddress = process.env.CONTRACT_ADDRESS; // Set this after deployment

    if (!contractAddress) {
        console.error("Please set CONTRACT_ADDRESS environment variable");
        return;
    }

    const [signer] = await ethers.getSigners();
    console.log("Testing with account:", await signer.getAddress());

    const PrivacyLearning = await ethers.getContractFactory("PrivacyLearning");
    const contract = PrivacyLearning.attach(contractAddress);

    try {
        // Test contract is accessible
        const totalModules = await contract.getTotalModules();
        console.log(`✓ Contract accessible. Total modules: ${totalModules}`);

        // Test module info
        const [name, lessons, active] = await contract.getModuleInfo(0);
        console.log(`✓ Module 0: ${name} (${lessons} lessons, active: ${active})`);

        // Test enrollment (if not already enrolled)
        try {
            const tx = await contract.enrollStudent();
            await tx.wait();
            console.log("✓ Student enrollment successful");
        } catch (error) {
            if (error.message.includes("Already enrolled")) {
                console.log("✓ Student already enrolled");
            } else {
                throw error;
            }
        }

        console.log("Testnet deployment verification complete!");

    } catch (error) {
        console.error("Verification failed:", error.message);
    }
}

main().catch(console.error);
```

Run verification:

```bash
export CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
npx hardhat run scripts/testnet-verification.js --network zama
```

## Production Deployment

### 1. Pre-Production Checklist

- [ ] All tests passing locally and on testnet
- [ ] Smart contract security audit completed
- [ ] Gas optimization analysis performed
- [ ] Frontend thoroughly tested
- [ ] Backup and recovery procedures documented
- [ ] Monitoring tools configured

### 2. Security Considerations

#### Smart Contract Security

```solidity
// Add circuit breaker for emergencies
bool public paused = false;

modifier whenNotPaused() {
    require(!paused, "Contract is paused");
    _;
}

function pause() external onlyOwner {
    paused = true;
}

function unpause() external onlyOwner {
    paused = false;
}
```

#### Environment Security

```bash
# Use hardware wallet for mainnet deployment
# Never store private keys in code or config files
# Use environment variables or secret management

# For production, use dedicated deployment account
# with minimal necessary permissions
```

### 3. Mainnet Deployment Process

```bash
# Final testing
npm run test:full

# Compile with production optimization
npx hardhat compile

# Deploy to mainnet (when Zama mainnet is available)
npx hardhat run scripts/deploy.js --network zama-mainnet

# Verify deployment
npx hardhat run scripts/production-verification.js --network zama-mainnet
```

### 4. Post-Deployment Steps

1. **Verify Contract**: Confirm deployment on block explorer
2. **Test Core Functions**: Execute critical user flows
3. **Monitor Gas Usage**: Track transaction costs
4. **Update Frontend**: Point to production contract address
5. **Document Deployment**: Record addresses and transaction hashes

## Frontend Hosting

### 1. Prepare Frontend for Deployment

Update contract addresses in `app.js`:

```javascript
// Production configuration
const PRODUCTION_CONFIG = {
    contractAddress: "0x1234567890123456789012345678901234567890",
    networkId: 8009,
    networkName: "Zama Testnet"
};

// Use production config when deployed
this.deployedContractAddress = PRODUCTION_CONFIG.contractAddress;
```

### 2. Deploy to Vercel

#### Setup Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Initialize project
vercel init
```

#### Configure `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "functions": {},
  "trailingSlash": false
}
```

#### Deploy

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Custom domain (optional)
vercel domains add yourdomain.com
```

### 3. Deploy to Netlify

#### Setup Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize project
netlify init
```

#### Configure `netlify.toml`

```toml
[build]
  publish = "."
  command = "echo 'No build needed for static site'"

[build.environment]
  NODE_VERSION = "16"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Deploy

```bash
# Deploy to preview
netlify deploy

# Deploy to production
netlify deploy --prod

# Custom domain
netlify domains:add yourdomain.com
```

### 4. IPFS Deployment (Decentralized)

```bash
# Install IPFS
# Download from https://ipfs.io/

# Add files to IPFS
ipfs add -r .

# Pin to ensure availability
ipfs pin add <hash>

# Access via gateway
# https://ipfs.io/ipfs/<hash>
```

## Monitoring and Maintenance

### 1. Contract Monitoring

#### Event Monitoring

```javascript
// Monitor important events
const contract = new ethers.Contract(contractAddress, abi, provider);

contract.on("StudentEnrolled", (student, event) => {
    console.log("New student enrolled:", student);
    // Log to monitoring system
});

contract.on("LessonCompleted", (student, moduleId, lessonId, event) => {
    console.log(`Lesson completed: Student ${student}, Module ${moduleId}, Lesson ${lessonId}`);
    // Update analytics
});
```

#### Health Checks

```javascript
// Regular health check script
async function healthCheck() {
    try {
        const totalModules = await contract.getTotalModules();
        const blockNumber = await provider.getBlockNumber();

        console.log("✓ Contract responsive");
        console.log("✓ Total modules:", totalModules);
        console.log("✓ Latest block:", blockNumber);

        return true;
    } catch (error) {
        console.error("❌ Health check failed:", error);
        return false;
    }
}

// Run every 5 minutes
setInterval(healthCheck, 5 * 60 * 1000);
```

### 2. Performance Monitoring

#### Gas Usage Tracking

```javascript
// Track gas usage for optimization
contract.on("*", async (event) => {
    const receipt = await event.getTransactionReceipt();
    console.log(`Gas used: ${receipt.gasUsed} for ${event.event}`);

    // Alert if gas usage is high
    if (receipt.gasUsed > 500000) {
        console.warn("High gas usage detected!");
    }
});
```

#### User Analytics

```javascript
// Track user interactions (privacy-preserving)
function trackEvent(eventName, data = {}) {
    const event = {
        name: eventName,
        timestamp: Date.now(),
        ...data
    };

    // Send to analytics service (ensure privacy compliance)
    console.log("Event tracked:", event);
}

// Usage
trackEvent("lesson_completed", { moduleId: 0, lessonId: 1 });
trackEvent("progress_updated", { totalProgress: 25 });
```

### 3. Automated Maintenance

#### Deployment Script

```bash
#!/bin/bash
# deploy.sh - Automated deployment script

set -e

echo "Starting deployment process..."

# Run tests
echo "Running tests..."
npm test

# Compile contracts
echo "Compiling contracts..."
npx hardhat compile

# Deploy to network
echo "Deploying to $NETWORK..."
npx hardhat run scripts/deploy.js --network $NETWORK

# Verify deployment
echo "Verifying deployment..."
npx hardhat run scripts/verify-deployment.js --network $NETWORK

# Update frontend
echo "Updating frontend configuration..."
node scripts/update-frontend-config.js

# Deploy frontend
echo "Deploying frontend..."
vercel --prod

echo "Deployment complete!"
```

## Troubleshooting

### Common Issues

#### 1. MetaMask Connection Issues

**Problem**: MetaMask not connecting or wrong network

**Solutions**:
```javascript
// Check MetaMask installation
if (typeof window.ethereum === 'undefined') {
    alert('Please install MetaMask');
    return;
}

// Check network
const chainId = await window.ethereum.request({ method: 'eth_chainId' });
if (chainId !== '0x1F49') { // 8009 in hex
    await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1F49' }],
    });
}
```

#### 2. Contract Deployment Failures

**Problem**: Deployment fails with gas errors

**Solutions**:
```javascript
// Increase gas limit
module.exports = {
    networks: {
        zama: {
            gas: 8000000,
            gasPrice: 20000000000, // 20 gwei
        }
    }
};

// Check account balance
const balance = await signer.getBalance();
console.log("Account balance:", ethers.utils.formatEther(balance));
```

#### 3. Transaction Failures

**Problem**: Transactions revert or fail

**Debug Steps**:
```javascript
try {
    const tx = await contract.completeLesson(0, 0, true);
    await tx.wait();
} catch (error) {
    console.error("Transaction error:", error);

    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        console.log("Transaction would revert");
    }

    if (error.reason) {
        console.log("Revert reason:", error.reason);
    }
}
```

#### 4. Frontend Loading Issues

**Problem**: Application not loading or connecting

**Debug Steps**:
1. Check browser console for errors
2. Verify contract address is correct
3. Confirm network configuration
4. Test with different browsers
5. Clear browser cache and MetaMask data

### Getting Help

- **Documentation**: Check official Zama docs
- **Community**: Join Zama Discord for support
- **GitHub**: Report issues in the repository
- **Testing**: Use testnet extensively before mainnet

### Emergency Procedures

#### Contract Issues
1. Pause contract operations (if pause functionality exists)
2. Contact users through official channels
3. Deploy fix to testnet first
4. Coordinate upgrade or migration plan

#### Frontend Issues
1. Revert to previous working version
2. Update DNS to point to backup deployment
3. Fix issues and redeploy
4. Monitor for additional problems

This deployment guide provides comprehensive instructions for deploying your FHEVM privacy learning application across different environments while maintaining security and reliability best practices.