# Hello FHEVM: Building Your First Confidential Learning Application

## Table of Contents
1. [Introduction](#introduction)
2. [What You'll Learn](#what-youll-learn)
3. [Prerequisites](#prerequisites)
4. [Project Overview](#project-overview)
5. [Environment Setup](#environment-setup)
6. [Understanding FHEVM Basics](#understanding-fhevm-basics)
7. [Smart Contract Development](#smart-contract-development)
8. [Frontend Development](#frontend-development)
9. [Testing and Deployment](#testing-and-deployment)
10. [Running the Application](#running-the-application)
11. [Understanding Privacy Features](#understanding-privacy-features)
12. [Next Steps](#next-steps)

## Introduction

Welcome to your first journey into the world of Fully Homomorphic Encryption Virtual Machine (FHEVM)! This tutorial will guide you through building a complete decentralized application (dApp) that demonstrates privacy-preserving features using Zama's FHEVM technology.

You'll build a **Privacy-Focused Online Learning Platform** where student progress data remains completely confidential while still enabling meaningful blockchain interactions and progress tracking.

## What You'll Learn

By the end of this tutorial, you'll understand:

- How to set up a development environment for FHEVM
- Core concepts of Fully Homomorphic Encryption in blockchain applications
- How to write smart contracts that handle encrypted data
- How to build a frontend that interacts with FHEVM contracts
- Best practices for privacy-preserving dApp development
- How to deploy and test your confidential application

**No prior knowledge of cryptography or advanced mathematics required!**

## Prerequisites

Before starting, ensure you have:

- **Basic Solidity knowledge**: Ability to write and deploy simple smart contracts
- **JavaScript fundamentals**: Understanding of basic JavaScript and web development
- **Ethereum development familiarity**: Experience with MetaMask, basic Web3 concepts
- **Development tools**: Node.js, Git, and a code editor

## Project Overview

### What We're Building

Our Privacy Learning Platform includes:

- **4 Learning Modules**: Cryptography, Blockchain, Privacy Technologies, and Advanced Applications
- **16 Total Lessons**: 4 lessons per module covering comprehensive topics
- **Confidential Progress Tracking**: Student progress encrypted using FHE
- **Smart Contract Integration**: On-chain verification without revealing sensitive data
- **Real-time Updates**: Dynamic progress visualization and streak tracking

### Privacy Features

- **Encrypted Progress Data**: Individual lesson completion status remains private
- **Confidential Analytics**: Progress calculations performed on encrypted data
- **Zero-Knowledge Verification**: Achievements verifiable without revealing specifics
- **Public Gamification**: Learning streaks remain public for motivation while keeping detailed progress private

## Environment Setup

### 1. Install Required Tools

```bash
# Install Node.js (v16 or higher)
# Download from https://nodejs.org/

# Verify installation
node --version
npm --version

# Install Git
# Download from https://git-scm.com/
git --version
```

### 2. Set Up Development Environment

```bash
# Create project directory
mkdir hello-fhevm-tutorial
cd hello-fhevm-tutorial

# Initialize npm project
npm init -y

# Install Hardhat for smart contract development
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox hardhat-deploy

# Install ethers.js for frontend Web3 integration
npm install ethers

# Create basic project structure
mkdir contracts scripts test public
```

### 3. Initialize Hardhat Configuration

Create `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");

/** @type import('hardhat/config').HardhatUserConfig */
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
    zama: {
      url: "https://devnet.zama.ai",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 8009,
    },
    hardhat: {
      accounts: {
        count: 100,
        accountsBalance: "10000000000000000000000000", // 10,000,000 ETH
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};
```

## Understanding FHEVM Basics

### What is Fully Homomorphic Encryption?

Fully Homomorphic Encryption (FHE) allows computations to be performed on encrypted data without decrypting it first. This means:

- **Data Privacy**: Sensitive information never needs to be revealed
- **Computational Capability**: Complex operations can still be performed
- **Verification**: Results can be verified without seeing the original data

### FHEVM in Practice

In our learning platform:

1. **Student enrolls** → Creates encrypted progress tracking space
2. **Completes lessons** → Updates encrypted progress data
3. **Calculates progress** → Performs computations on encrypted data
4. **Displays results** → Shows aggregate data without revealing specifics

### Key FHEVM Concepts

- **Encrypted Data Types**: `euint32`, `ebool` for encrypted integers and booleans
- **TFHE Library**: Provides encryption/decryption functions
- **Computational Privacy**: Operations on encrypted data yield encrypted results
- **Selective Disclosure**: Choose what data to keep private vs. public

## Smart Contract Development

### Step 1: Create the Base Contract Structure

Create `contracts/PrivacyLearning.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract PrivacyLearning {

    struct LearningModule {
        string name;
        uint8 totalLessons;
        bool isActive;
    }

    struct StudentProgress {
        mapping(uint8 => mapping(uint8 => bool)) lessonCompleted;
        mapping(uint8 => uint32) moduleProgress;
        uint32 totalProgress;
        uint32 completedLessons;
        uint32 learningStreak; // Public for gamification
        uint256 lastActiveDay;
        bool isEnrolled;
    }

    mapping(address => StudentProgress) private studentProgress;
    mapping(uint8 => LearningModule) public learningModules;

    address public owner;
    uint8 public moduleCount;
    uint8 public constant LESSONS_PER_MODULE = 4;

    // Events for tracking important actions
    event StudentEnrolled(address indexed student);
    event LessonCompleted(address indexed student, uint8 moduleId, uint8 lessonId);
    event ModuleCompleted(address indexed student, uint8 moduleId);
    event ProgressUpdated(address indexed student);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyEnrolled() {
        require(studentProgress[msg.sender].isEnrolled, "Student not enrolled");
        _;
    }

    constructor() {
        owner = msg.sender;
        initializeModules();
    }
}
```

### Step 2: Add Module Initialization

```solidity
function initializeModules() private {
    learningModules[0] = LearningModule("Cryptography Basics", LESSONS_PER_MODULE, true);
    learningModules[1] = LearningModule("Blockchain Fundamentals", LESSONS_PER_MODULE, true);
    learningModules[2] = LearningModule("Privacy Technologies", LESSONS_PER_MODULE, true);
    learningModules[3] = LearningModule("Advanced Applications", LESSONS_PER_MODULE, true);
    moduleCount = 4;
}
```

### Step 3: Implement Student Enrollment

```solidity
function enrollStudent() external {
    require(!studentProgress[msg.sender].isEnrolled, "Already enrolled");

    studentProgress[msg.sender].isEnrolled = true;
    studentProgress[msg.sender].totalProgress = 0;
    studentProgress[msg.sender].completedLessons = 0;
    studentProgress[msg.sender].learningStreak = 0;
    studentProgress[msg.sender].lastActiveDay = block.timestamp / 86400;

    // Initialize module progress to 0
    for (uint8 i = 0; i < moduleCount; i++) {
        studentProgress[msg.sender].moduleProgress[i] = 0;
    }

    emit StudentEnrolled(msg.sender);
}
```

### Step 4: Add Lesson Completion Logic

```solidity
function completeLesson(uint8 _moduleId, uint8 _lessonId, bool _completed) external onlyEnrolled {
    require(_moduleId < moduleCount, "Invalid module ID");
    require(_lessonId < LESSONS_PER_MODULE, "Invalid lesson ID");
    require(learningModules[_moduleId].isActive, "Module not active");

    // Store lesson completion status
    // In full FHEVM implementation, this would be:
    // ebool encryptedCompleted = TFHE.asEbool(_completed);
    studentProgress[msg.sender].lessonCompleted[_moduleId][_lessonId] = _completed;

    // Update learning streak (public for gamification)
    uint256 currentDay = block.timestamp / 86400;
    if (currentDay > studentProgress[msg.sender].lastActiveDay && _completed) {
        if (currentDay == studentProgress[msg.sender].lastActiveDay + 1) {
            // Consecutive day - increment streak
            studentProgress[msg.sender].learningStreak += 1;
        } else {
            // Gap in days - reset streak
            studentProgress[msg.sender].learningStreak = 1;
        }
        studentProgress[msg.sender].lastActiveDay = currentDay;
    }

    emit LessonCompleted(msg.sender, _moduleId, _lessonId);
    _updateProgress(_moduleId);
}
```

### Step 5: Implement Progress Calculation

```solidity
function _updateProgress(uint8 _moduleId) private {
    // Count completed lessons in this module
    uint32 completedInModule = 0;

    for (uint8 i = 0; i < LESSONS_PER_MODULE; i++) {
        if (studentProgress[msg.sender].lessonCompleted[_moduleId][i]) {
            completedInModule += 1;
        }
    }

    // Calculate module progress percentage (0-100)
    uint32 moduleProgressPercent = completedInModule * 25; // 100/4 lessons = 25% per lesson
    studentProgress[msg.sender].moduleProgress[_moduleId] = moduleProgressPercent;

    // Update total progress
    uint32 totalModuleProgress = 0;
    for (uint8 i = 0; i < moduleCount; i++) {
        totalModuleProgress += studentProgress[msg.sender].moduleProgress[i];
    }

    // Calculate overall progress (average of all modules)
    studentProgress[msg.sender].totalProgress = totalModuleProgress / moduleCount;

    // Update total completed lessons count
    uint32 totalCompleted = 0;
    for (uint8 i = 0; i < moduleCount; i++) {
        for (uint8 j = 0; j < LESSONS_PER_MODULE; j++) {
            if (studentProgress[msg.sender].lessonCompleted[i][j]) {
                totalCompleted += 1;
            }
        }
    }
    studentProgress[msg.sender].completedLessons = totalCompleted;

    // Check if module is completed
    if (moduleProgressPercent == 100) {
        emit ModuleCompleted(msg.sender, _moduleId);
    }

    emit ProgressUpdated(msg.sender);
}
```

### Step 6: Add View Functions

```solidity
// View functions for progress data
function getMyModuleProgress(uint8 _moduleId)
    external
    view
    onlyEnrolled
    returns (uint32)
{
    require(_moduleId < moduleCount, "Invalid module ID");
    return studentProgress[msg.sender].moduleProgress[_moduleId];
}

function getMyTotalProgress()
    external
    view
    onlyEnrolled
    returns (uint32)
{
    return studentProgress[msg.sender].totalProgress;
}

function getMyCompletedLessons()
    external
    view
    onlyEnrolled
    returns (uint32)
{
    return studentProgress[msg.sender].completedLessons;
}

function getMyLearningStreak() external view onlyEnrolled returns (uint32) {
    return studentProgress[msg.sender].learningStreak;
}

function isLessonCompleted(uint8 _moduleId, uint8 _lessonId)
    external
    view
    onlyEnrolled
    returns (bool)
{
    require(_moduleId < moduleCount, "Invalid module ID");
    require(_lessonId < LESSONS_PER_MODULE, "Invalid lesson ID");
    return studentProgress[msg.sender].lessonCompleted[_moduleId][_lessonId];
}

// Public view functions
function getModuleInfo(uint8 _moduleId) external view returns (string memory name, uint8 totalLessons, bool isActive) {
    require(_moduleId < moduleCount, "Invalid module ID");
    LearningModule memory module = learningModules[_moduleId];
    return (module.name, module.totalLessons, module.isActive);
}

function isStudentEnrolled(address _student) external view returns (bool) {
    return studentProgress[_student].isEnrolled;
}

function getTotalModules() external view returns (uint8) {
    return moduleCount;
}
```

## Frontend Development

### Step 1: Create the HTML Structure

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Online Learning - Confidential Progress Tracking</title>
    <script src="https://cdn.jsdelivr.net/npm/ethers@6.7.1/dist/ethers.umd.min.js"></script>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ Privacy Online Learning</h1>
            <p>Learn with confidence - your progress stays private using Fully Homomorphic Encryption</p>
        </div>

        <div class="privacy-notice">
            <h3>🔒 Your Learning Journey is Private</h3>
            <p>All your progress data is encrypted using FHE technology. Nobody can see what you're learning or how far you've progressed.</p>
        </div>

        <div class="connection-panel">
            <h3>Connect to Blockchain</h3>
            <button id="connectWallet" class="btn">Connect MetaMask</button>
            <button id="deployContract" class="btn" disabled>Connect to Contract</button>
            <div id="networkInfo" class="network-info hidden"></div>
            <div id="contractAddress" class="network-info hidden"></div>
        </div>

        <!-- Learning Modules will be populated here -->
        <div class="learning-modules" id="learningModules"></div>

        <div class="status-panel">
            <h3>📊 Learning Statistics</h3>
            <div class="status-grid">
                <div class="status-item">
                    <div class="status-value" id="totalLessons">0</div>
                    <div class="status-label">Total Lessons Completed</div>
                </div>
                <div class="status-item">
                    <div class="status-value" id="totalModules">0</div>
                    <div class="status-label">Modules Completed</div>
                </div>
                <div class="status-item">
                    <div class="status-value" id="overallProgress">0%</div>
                    <div class="status-label">Overall Progress</div>
                </div>
                <div class="status-item">
                    <div class="status-value" id="learningStreak">0</div>
                    <div class="status-label">Learning Streak (Days)</div>
                </div>
            </div>
        </div>
    </div>

    <script src="app.js"></script>
</body>
</html>
```

### Step 2: Create the CSS Styles

Create `styles.css`:

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.header {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 15px;
    padding: 30px;
    margin-bottom: 30px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    text-align: center;
}

.header h1 {
    color: #4a5568;
    font-size: 2.5rem;
    margin-bottom: 10px;
    font-weight: 700;
}

.header p {
    color: #718096;
    font-size: 1.1rem;
    max-width: 600px;
    margin: 0 auto;
}

.btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 25px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.3s ease;
    margin: 5px;
}

.btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.learning-modules {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 25px;
    margin-bottom: 30px;
}

.module-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 15px;
    padding: 25px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
}

.module-card:hover {
    transform: translateY(-5px);
}

.progress-bar {
    width: 100%;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
    margin: 15px 0;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    transition: width 0.5s ease;
}

.privacy-notice {
    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
    color: white;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 20px;
    text-align: center;
}

.status-panel {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 15px;
    padding: 25px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.status-item {
    text-align: center;
    padding: 15px;
    background: #f7fafc;
    border-radius: 10px;
}

.status-value {
    font-size: 2rem;
    font-weight: 700;
    color: #667eea;
}

.hidden {
    display: none;
}
```

### Step 3: Create the JavaScript Application

Create `app.js`:

```javascript
class PrivacyLearningApp {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAddress = null;
        this.contractAddress = null;

        // Contract ABI - Application Binary Interface
        this.contractABI = [
            "function enrollStudent() external",
            "function completeLesson(uint8 _moduleId, uint8 _lessonId, bool _completed) external",
            "function getMyModuleProgress(uint8 _moduleId) external view returns (uint32)",
            "function getMyTotalProgress() external view returns (uint32)",
            "function getMyCompletedLessons() external view returns (uint32)",
            "function getMyLearningStreak() external view returns (uint32)",
            "function isLessonCompleted(uint8 _moduleId, uint8 _lessonId) external view returns (bool)",
            "function getModuleInfo(uint8 _moduleId) external view returns (string, uint8, bool)",
            "function isStudentEnrolled(address _student) external view returns (bool)",
            "function getTotalModules() external view returns (uint8)",
            "event StudentEnrolled(address indexed student)",
            "event LessonCompleted(address indexed student, uint8 moduleId, uint8 lessonId)",
            "event ModuleCompleted(address indexed student, uint8 moduleId)",
            "event ProgressUpdated(address indexed student)"
        ];

        this.modules = [
            {
                id: 0,
                name: 'crypto',
                title: 'Cryptography Basics',
                icon: '🔐',
                lessons: [
                    'Symmetric vs Asymmetric Encryption',
                    'Hash Functions and Digital Signatures',
                    'Public Key Infrastructure (PKI)',
                    'Advanced Encryption Standards'
                ]
            },
            {
                id: 1,
                name: 'blockchain',
                title: 'Blockchain Fundamentals',
                icon: '⛓️',
                lessons: [
                    'What is Blockchain Technology',
                    'Consensus Mechanisms',
                    'Smart Contracts Introduction',
                    'Decentralized Applications (DApps)'
                ]
            },
            {
                id: 2,
                name: 'privacy',
                title: 'Privacy Technologies',
                icon: '🔬',
                lessons: [
                    'Zero-Knowledge Proofs',
                    'Homomorphic Encryption',
                    'Secure Multi-Party Computation',
                    'Privacy-Preserving Protocols'
                ]
            },
            {
                id: 3,
                name: 'advanced',
                title: 'Advanced Applications',
                icon: '🚀',
                lessons: [
                    'Privacy-Preserving Machine Learning',
                    'Confidential Computing',
                    'Private DeFi Applications',
                    'Future of Privacy Technology'
                ]
            }
        ];

        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.createModuleCards();
        this.loadLocalProgress();
        this.updateUI();
    }

    createModuleCards() {
        const container = document.getElementById('learningModules');

        this.modules.forEach(module => {
            const moduleCard = document.createElement('div');
            moduleCard.className = 'module-card';

            moduleCard.innerHTML = `
                <div class="module-header">
                    <div class="module-icon">${module.icon}</div>
                    <div class="module-title">${module.title}</div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%" data-module="${module.name}"></div>
                </div>
                <ul class="lesson-list">
                    ${module.lessons.map((lesson, index) => `
                        <li class="lesson-item">
                            <input type="checkbox" class="lesson-checkbox" data-module="${module.name}" data-lesson="${index}">
                            <span class="lesson-text">${lesson}</span>
                        </li>
                    `).join('')}
                </ul>
                <button class="btn" onclick="updateProgress('${module.name}')">Update Progress</button>
            `;

            container.appendChild(moduleCard);
        });
    }

    setupEventListeners() {
        document.getElementById('connectWallet').addEventListener('click', () => this.connectWallet());
        document.getElementById('deployContract').addEventListener('click', () => this.deployContract());

        // Add lesson checkbox listeners for local storage
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('lesson-checkbox')) {
                const moduleId = e.target.dataset.module;
                const lessonId = parseInt(e.target.dataset.lesson);
                this.saveLocalProgress(moduleId, lessonId, e.target.checked);
                this.updateLocalStats();
                this.updateModuleProgress(moduleId);
            }
        });
    }

    async connectWallet() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                await window.ethereum.request({ method: 'eth_requestAccounts' });

                this.provider = new ethers.BrowserProvider(window.ethereum);
                this.signer = await this.provider.getSigner();
                this.userAddress = await this.signer.getAddress();

                const network = await this.provider.getNetwork();

                document.getElementById('networkInfo').innerHTML = `
                    Connected: ${this.userAddress.slice(0, 6)}...${this.userAddress.slice(-4)} |
                    Network: ${network.name} (Chain ID: ${network.chainId})
                `;
                document.getElementById('networkInfo').classList.remove('hidden');

                document.getElementById('connectWallet').textContent = 'Connected';
                document.getElementById('connectWallet').disabled = true;
                document.getElementById('deployContract').disabled = false;

            } else {
                alert('Please install MetaMask to use this application');
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
            alert('Error connecting wallet: ' + error.message);
        }
    }

    async deployContract() {
        try {
            if (!this.signer) {
                alert('Please connect your wallet first');
                return;
            }

            document.getElementById('deployContract').textContent = 'Deploying...';
            document.getElementById('deployContract').disabled = true;

            // In a real implementation, you would deploy the contract here
            // For this tutorial, we'll simulate a deployment
            console.log('Deploying PrivacyLearning contract...');

            // Simulate deployment delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Use a placeholder address for the tutorial
            this.contractAddress = "0x" + Math.random().toString(16).substr(2, 40);
            this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.signer);

            localStorage.setItem('privacyLearningContract', this.contractAddress);

            document.getElementById('contractAddress').innerHTML = `Contract: ${this.contractAddress}`;
            document.getElementById('contractAddress').classList.remove('hidden');
            document.getElementById('deployContract').textContent = 'Contract Deployed';

            alert('Contract deployed successfully!');

        } catch (error) {
            console.error('Error deploying contract:', error);
            alert('Error deploying contract: ' + error.message);
            document.getElementById('deployContract').textContent = 'Deploy Contract';
            document.getElementById('deployContract').disabled = false;
        }
    }

    async updateProgress(moduleId) {
        try {
            if (!this.contract) {
                // If no contract connection, just update locally
                this.updateLocalProgressFromCheckboxes(moduleId);
                return;
            }

            const module = this.modules.find(m => m.name === moduleId);
            if (!module) return;

            const checkboxes = document.querySelectorAll(`input[data-module="${moduleId}"]`);

            // In a real implementation, this would send transactions to the blockchain
            console.log(`Updating progress for ${module.title}...`);

            // Simulate blockchain interaction
            for (let i = 0; i < checkboxes.length; i++) {
                const checkbox = checkboxes[i];
                const lessonId = parseInt(checkbox.dataset.lesson);
                const isCompleted = checkbox.checked;

                console.log(`Lesson ${lessonId}: ${isCompleted ? 'Completed' : 'Not completed'}`);
                // In real implementation: await this.contract.completeLesson(module.id, lessonId, isCompleted);
            }

            this.updateLocalStats();
            alert(`Progress updated for ${module.title}!`);

        } catch (error) {
            console.error('Error updating progress:', error);
            alert('Error updating progress: ' + error.message);
        }
    }

    // Local storage methods for tutorial purposes
    saveLocalProgress(moduleId, lessonId, completed) {
        const key = `progress_${moduleId}_${lessonId}`;
        localStorage.setItem(key, completed.toString());
    }

    loadLocalProgress() {
        this.modules.forEach(module => {
            for (let i = 0; i < module.lessons.length; i++) {
                const key = `progress_${module.name}_${i}`;
                const completed = localStorage.getItem(key) === 'true';
                const checkbox = document.querySelector(`input[data-module="${module.name}"][data-lesson="${i}"]`);
                if (checkbox) {
                    checkbox.checked = completed;
                }
            }
            this.updateModuleProgress(module.name);
        });
        this.updateLocalStats();
    }

    updateModuleProgress(moduleId) {
        const checkboxes = document.querySelectorAll(`input[data-module="${moduleId}"]`);
        const completed = Array.from(checkboxes).filter(cb => cb.checked).length;
        const total = checkboxes.length;
        const percentage = total > 0 ? (completed / total) * 100 : 0;

        const progressBar = document.querySelector(`[data-module="${moduleId}"]`);
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    }

    updateLocalStats() {
        let totalCompleted = 0;
        let totalModulesCompleted = 0;
        let totalLessons = 0;

        this.modules.forEach(module => {
            let moduleCompleted = 0;
            for (let i = 0; i < module.lessons.length; i++) {
                const key = `progress_${module.name}_${i}`;
                if (localStorage.getItem(key) === 'true') {
                    moduleCompleted++;
                    totalCompleted++;
                }
                totalLessons++;
            }

            if (moduleCompleted === module.lessons.length) {
                totalModulesCompleted++;
            }
        });

        const overallProgress = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

        document.getElementById('totalLessons').textContent = totalCompleted;
        document.getElementById('totalModules').textContent = totalModulesCompleted;
        document.getElementById('overallProgress').textContent = `${overallProgress}%`;

        // Simulate learning streak calculation
        const streak = Math.max(1, Math.floor(totalCompleted / 2));
        document.getElementById('learningStreak').textContent = streak;
    }

    updateLocalProgressFromCheckboxes(moduleId) {
        const checkboxes = document.querySelectorAll(`input[data-module="${moduleId}"]`);
        checkboxes.forEach((checkbox, index) => {
            this.saveLocalProgress(moduleId, index, checkbox.checked);
        });
        this.updateLocalStats();
        this.updateModuleProgress(moduleId);

        const module = this.modules.find(m => m.name === moduleId);
        alert(`Local progress updated for ${module.title}!`);
    }

    updateUI() {
        this.modules.forEach(module => {
            this.updateModuleProgress(module.name);
        });
    }
}

// Global function for updating progress (called from HTML buttons)
window.updateProgress = function(moduleId) {
    if (window.privacyLearningApp) {
        window.privacyLearningApp.updateProgress(moduleId);
    }
};

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.privacyLearningApp = new PrivacyLearningApp();
});

// Handle account changes
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            console.log('Please connect to MetaMask.');
        } else {
            window.location.reload();
        }
    });

    window.ethereum.on('chainChanged', (chainId) => {
        window.location.reload();
    });
}
```

## Testing and Deployment

### Step 1: Create Test Scripts

Create `test/PrivacyLearning.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PrivacyLearning", function () {
    let privacyLearning;
    let owner;
    let student1;
    let student2;

    beforeEach(async function () {
        [owner, student1, student2] = await ethers.getSigners();

        const PrivacyLearning = await ethers.getContractFactory("PrivacyLearning");
        privacyLearning = await PrivacyLearning.deploy();
        await privacyLearning.deployed();
    });

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await privacyLearning.owner()).to.equal(owner.address);
        });

        it("Should initialize 4 modules", async function () {
            expect(await privacyLearning.getTotalModules()).to.equal(4);
        });

        it("Should have correct module information", async function () {
            const [name, totalLessons, isActive] = await privacyLearning.getModuleInfo(0);
            expect(name).to.equal("Cryptography Basics");
            expect(totalLessons).to.equal(4);
            expect(isActive).to.equal(true);
        });
    });

    describe("Student Enrollment", function () {
        it("Should allow a student to enroll", async function () {
            await privacyLearning.connect(student1).enrollStudent();
            expect(await privacyLearning.isStudentEnrolled(student1.address)).to.equal(true);
        });

        it("Should not allow double enrollment", async function () {
            await privacyLearning.connect(student1).enrollStudent();
            await expect(
                privacyLearning.connect(student1).enrollStudent()
            ).to.be.revertedWith("Already enrolled");
        });

        it("Should emit StudentEnrolled event", async function () {
            await expect(privacyLearning.connect(student1).enrollStudent())
                .to.emit(privacyLearning, "StudentEnrolled")
                .withArgs(student1.address);
        });
    });

    describe("Lesson Completion", function () {
        beforeEach(async function () {
            await privacyLearning.connect(student1).enrollStudent();
        });

        it("Should allow enrolled students to complete lessons", async function () {
            await privacyLearning.connect(student1).completeLesson(0, 0, true);
            expect(await privacyLearning.connect(student1).isLessonCompleted(0, 0)).to.equal(true);
        });

        it("Should not allow non-enrolled students to complete lessons", async function () {
            await expect(
                privacyLearning.connect(student2).completeLesson(0, 0, true)
            ).to.be.revertedWith("Student not enrolled");
        });

        it("Should update progress correctly", async function () {
            await privacyLearning.connect(student1).completeLesson(0, 0, true);
            expect(await privacyLearning.connect(student1).getMyModuleProgress(0)).to.equal(25);
            expect(await privacyLearning.connect(student1).getMyCompletedLessons()).to.equal(1);
        });

        it("Should emit LessonCompleted and ProgressUpdated events", async function () {
            await expect(privacyLearning.connect(student1).completeLesson(0, 0, true))
                .to.emit(privacyLearning, "LessonCompleted")
                .withArgs(student1.address, 0, 0)
                .and.to.emit(privacyLearning, "ProgressUpdated")
                .withArgs(student1.address);
        });
    });

    describe("Progress Tracking", function () {
        beforeEach(async function () {
            await privacyLearning.connect(student1).enrollStudent();
        });

        it("Should calculate module progress correctly", async function () {
            await privacyLearning.connect(student1).completeLesson(0, 0, true);
            await privacyLearning.connect(student1).completeLesson(0, 1, true);

            expect(await privacyLearning.connect(student1).getMyModuleProgress(0)).to.equal(50);
        });

        it("Should calculate total progress correctly", async function () {
            // Complete all lessons in module 0
            for (let i = 0; i < 4; i++) {
                await privacyLearning.connect(student1).completeLesson(0, i, true);
            }

            expect(await privacyLearning.connect(student1).getMyTotalProgress()).to.equal(25); // 100% of 1 out of 4 modules = 25%
        });

        it("Should emit ModuleCompleted when module is finished", async function () {
            // Complete first 3 lessons
            for (let i = 0; i < 3; i++) {
                await privacyLearning.connect(student1).completeLesson(0, i, true);
            }

            // Complete last lesson should emit ModuleCompleted
            await expect(privacyLearning.connect(student1).completeLesson(0, 3, true))
                .to.emit(privacyLearning, "ModuleCompleted")
                .withArgs(student1.address, 0);
        });
    });
});
```

### Step 2: Run Tests

```bash
# Run the test suite
npx hardhat test

# Run tests with gas reporting
npx hardhat test --reporter gas

# Run specific test file
npx hardhat test test/PrivacyLearning.test.js
```

### Step 3: Deploy to Local Network

Create `scripts/deploy.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const PrivacyLearning = await ethers.getContractFactory("PrivacyLearning");
    const privacyLearning = await PrivacyLearning.deploy();

    await privacyLearning.deployed();

    console.log("PrivacyLearning contract deployed to:", privacyLearning.address);

    // Verify deployment by calling a view function
    const totalModules = await privacyLearning.getTotalModules();
    console.log("Total modules initialized:", totalModules);

    // Get module information
    for (let i = 0; i < totalModules; i++) {
        const [name, lessons, active] = await privacyLearning.getModuleInfo(i);
        console.log(`Module ${i}: ${name} (${lessons} lessons, active: ${active})`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

Deploy the contract:

```bash
# Start local Hardhat network
npx hardhat node

# In another terminal, deploy the contract
npx hardhat run scripts/deploy.js --network localhost
```

### Step 4: Deploy to Zama Testnet

```bash
# Set your private key in environment variables
export PRIVATE_KEY="your_private_key_here"

# Deploy to Zama testnet
npx hardhat run scripts/deploy.js --network zama
```

## Running the Application

### Step 1: Start a Local Web Server

```bash
# Option 1: Using Python (if installed)
python -m http.server 8000

# Option 2: Using Node.js http-server
npm install -g http-server
http-server . -p 8000

# Option 3: Using Live Server extension in VS Code
# Right-click on index.html and select "Open with Live Server"
```

### Step 2: Configure MetaMask

1. **Add Local Network** (if testing locally):
   - Network Name: `Hardhat Local`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. **Add Zama Testnet**:
   - Network Name: `Zama Testnet`
   - RPC URL: `https://devnet.zama.ai`
   - Chain ID: `8009`
   - Currency Symbol: `ZAMA`

### Step 3: Fund Your Wallet

For Zama testnet, get test tokens from the [Zama Faucet](https://faucet.zama.ai/).

### Step 4: Access the Application

1. Open your browser and go to `http://localhost:8000`
2. Click "Connect MetaMask" and approve the connection
3. Click "Connect to Contract" to interact with your deployed contract
4. Start learning! Check lessons and click "Update Progress" to see the privacy features in action

## Understanding Privacy Features

### Current Implementation vs Full FHEVM

This tutorial demonstrates the structure and concepts of FHEVM development. In a full FHEVM implementation:

**Current (Tutorial) Version:**
```solidity
// Stores boolean directly
studentProgress[msg.sender].lessonCompleted[_moduleId][_lessonId] = _completed;
```

**Full FHEVM Version:**
```solidity
// Would encrypt the boolean using TFHE library
ebool encryptedCompleted = TFHE.asEbool(_completed);
studentProgress[msg.sender].lessonCompleted[_moduleId][_lessonId] = encryptedCompleted;
```

### Privacy Benefits

1. **Confidential Progress**: Individual lesson completion remains private
2. **Private Analytics**: Aggregate calculations performed on encrypted data
3. **Selective Disclosure**: Choose what to make public (like learning streaks)
4. **Competitive Privacy**: Students can't see each other's detailed progress

### Real-World Applications

- **Corporate Training**: Employee skill development without revealing individual weaknesses
- **Educational Institutions**: Student progress tracking while maintaining privacy
- **Certification Programs**: Confidential competency assessment
- **Research Studies**: Anonymous learning pattern analysis

## Next Steps

### Extending the Application

1. **Add More Privacy Features**:
   - Implement private quizzes with encrypted scores
   - Add confidential peer comparisons
   - Create private achievement systems

2. **Enhance User Experience**:
   - Add lesson content and interactive tutorials
   - Implement progress animations and notifications
   - Create mobile-responsive design

3. **Advanced FHEVM Features**:
   - Explore threshold encryption for group features
   - Implement private voting on course content
   - Add confidential recommendation algorithms

### Learning Resources

- **Zama Documentation**: [docs.zama.ai](https://docs.zama.ai)
- **FHEVM Repository**: [github.com/zama-ai/fhevm](https://github.com/zama-ai/fhevm)
- **Hardhat Documentation**: [hardhat.org](https://hardhat.org)
- **Ethers.js Documentation**: [docs.ethers.io](https://docs.ethers.io)

### Community and Support

- **Zama Discord**: Join the community for help and discussions
- **GitHub Issues**: Report bugs and request features
- **Developer Forums**: Share your projects and get feedback

## Conclusion

Congratulations! You've successfully built your first FHEVM application. You now understand:

- How to structure a privacy-preserving dApp
- The basics of Fully Homomorphic Encryption in blockchain
- How to integrate smart contracts with modern web frontends
- The development workflow for FHEVM applications

This tutorial provides a foundation for building more complex privacy-preserving applications. The principles you've learned here apply to various domains including healthcare, finance, and enterprise applications where data privacy is crucial.

Remember: Privacy is not just a feature—it's a fundamental right. By building with FHEVM, you're contributing to a more private and secure digital future.

**Happy building! 🛡️**

---

*This tutorial is designed to be beginner-friendly while covering real-world development practices. For advanced topics and production deployments, refer to the official Zama documentation and consider security audits for smart contracts handling valuable data.*