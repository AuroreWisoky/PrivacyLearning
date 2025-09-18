# Smart Contract Development Guide - FHEVM Privacy Learning

This guide explains the smart contract architecture and development process for the Privacy Learning platform using Fully Homomorphic Encryption.

## Table of Contents

1. [Contract Architecture](#contract-architecture)
2. [Core Components](#core-components)
3. [FHEVM Integration](#fhevm-integration)
4. [Development Process](#development-process)
5. [Testing Strategy](#testing-strategy)
6. [Security Considerations](#security-considerations)
7. [Deployment Guide](#deployment-guide)

## Contract Architecture

### Overview

The `PrivacyLearning.sol` contract implements a privacy-preserving online learning platform where:

- Student progress data is encrypted using FHE
- Learning achievements are verifiable without revealing details
- Public gamification features (streaks) coexist with private data
- Modular design allows easy extension

### Contract Structure

```
PrivacyLearning
├── Data Structures
│   ├── LearningModule
│   └── StudentProgress
├── Core Functions
│   ├── enrollStudent()
│   ├── completeLesson()
│   └── _updateProgress()
├── View Functions
│   ├── getMyTotalProgress()
│   ├── getMyModuleProgress()
│   └── isLessonCompleted()
└── Admin Functions
    ├── addModule()
    └── toggleModule()
```

## Core Components

### 1. Data Structures

#### LearningModule Struct
```solidity
struct LearningModule {
    string name;           // Module name (e.g., "Cryptography Basics")
    uint8 totalLessons;    // Number of lessons in module
    bool isActive;         // Whether module is available
}
```

**Purpose**: Defines the structure and metadata for learning modules.

**FHEVM Considerations**: Module metadata remains public as it doesn't reveal individual progress.

#### StudentProgress Struct
```solidity
struct StudentProgress {
    mapping(uint8 => mapping(uint8 => bool)) lessonCompleted; // moduleId => lessonId => completed
    mapping(uint8 => uint32) moduleProgress;                  // moduleId => progress percentage
    uint32 totalProgress;                                     // overall progress
    uint32 completedLessons;                                  // total completed lessons
    uint32 learningStreak;                                    // public streak for gamification
    uint256 lastActiveDay;                                    // for streak calculation
    bool isEnrolled;                                          // enrollment status
}
```

**Purpose**: Stores individual student progress data.

**Privacy Features**:
- `lessonCompleted`: In full FHEVM, would be `mapping(uint8 => mapping(uint8 => ebool))`
- `moduleProgress`: Calculated on encrypted data
- `learningStreak`: Kept public for gamification

### 2. Core Functions

#### Student Enrollment

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

**Key Features**:
- One-time enrollment per address
- Initializes all progress tracking variables
- Sets up day-based activity tracking for streaks
- Emits event for off-chain tracking

#### Lesson Completion

```solidity
function completeLesson(uint8 _moduleId, uint8 _lessonId, bool _completed) external onlyEnrolled {
    require(_moduleId < moduleCount, "Invalid module ID");
    require(_lessonId < LESSONS_PER_MODULE, "Invalid lesson ID");
    require(learningModules[_moduleId].isActive, "Module not active");

    // Store lesson completion (would be encrypted in full FHEVM)
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

**Key Features**:
- Validates input parameters
- Updates encrypted lesson completion status
- Calculates public learning streaks for gamification
- Triggers progress recalculation
- Emits events for transparency

#### Progress Calculation

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

**Key Features**:
- Performs calculations on (potentially) encrypted data
- Updates module-specific and overall progress
- Maintains accurate lesson completion counts
- Emits completion events for achievements

### 3. View Functions

#### Progress Retrieval

```solidity
function getMyTotalProgress() external view onlyEnrolled returns (uint32) {
    return studentProgress[msg.sender].totalProgress;
}

function getMyModuleProgress(uint8 _moduleId) external view onlyEnrolled returns (uint32) {
    require(_moduleId < moduleCount, "Invalid module ID");
    return studentProgress[msg.sender].moduleProgress[_moduleId];
}

function getMyCompletedLessons() external view onlyEnrolled returns (uint32) {
    return studentProgress[msg.sender].completedLessons;
}
```

**Privacy Features**:
- Only allows students to view their own progress
- Returns aggregated data rather than detailed lesson-by-lesson info
- In full FHEVM, would decrypt data only for the student

## FHEVM Integration

### Current Implementation vs Full FHEVM

#### Current Tutorial Version
```solidity
// Direct boolean storage
bool lessonCompleted = _completed;
studentProgress[msg.sender].lessonCompleted[_moduleId][_lessonId] = lessonCompleted;
```

#### Full FHEVM Version
```solidity
// Import FHEVM library
import "fhevm/lib/TFHE.sol";

// Encrypted boolean storage
ebool encryptedCompleted = TFHE.asEbool(_completed);
studentProgress[msg.sender].lessonCompleted[_moduleId][_lessonId] = encryptedCompleted;

// Encrypted calculations
euint32 completedCount = TFHE.asEuint32(0);
for (uint8 i = 0; i < LESSONS_PER_MODULE; i++) {
    completedCount = TFHE.add(completedCount, TFHE.asEuint32(
        TFHE.decrypt(studentProgress[msg.sender].lessonCompleted[_moduleId][i])
    ));
}
```

### FHEVM Data Types

- **`ebool`**: Encrypted boolean for lesson completion status
- **`euint32`**: Encrypted 32-bit unsigned integer for progress percentages
- **`euint8`**: Encrypted 8-bit unsigned integer for counts

### Encryption/Decryption Flow

1. **Input Encryption**: Frontend encrypts user input using FHEVM client library
2. **Computation**: Contract performs operations on encrypted data
3. **Storage**: Encrypted results stored on-chain
4. **Retrieval**: Only authorized users can decrypt their data

## Development Process

### 1. Environment Setup

```bash
# Install Hardhat and dependencies
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# For full FHEVM development
npm install fhevm

# Initialize Hardhat project
npx hardhat init
```

### 2. Contract Development Workflow

#### Step 1: Define Data Structures
```solidity
// Start with basic structures
struct LearningModule {
    string name;
    uint8 totalLessons;
    bool isActive;
}

// Add privacy considerations
struct StudentProgress {
    // In tutorial: bool, in FHEVM: ebool
    mapping(uint8 => mapping(uint8 => bool)) lessonCompleted;
    // Progress calculations on encrypted data
    mapping(uint8 => uint32) moduleProgress;
}
```

#### Step 2: Implement Core Logic
```solidity
// Focus on business logic first
function completeLesson(uint8 _moduleId, uint8 _lessonId, bool _completed) external {
    // Validation
    require(_moduleId < moduleCount, "Invalid module ID");

    // Core functionality
    studentProgress[msg.sender].lessonCompleted[_moduleId][_lessonId] = _completed;

    // Updates and events
    _updateProgress(_moduleId);
    emit LessonCompleted(msg.sender, _moduleId, _lessonId);
}
```

#### Step 3: Add Privacy Features
```solidity
// Replace with encrypted types for production
// bool -> ebool
// uint32 -> euint32
// Add TFHE operations for calculations
```

### 3. Testing Approach

#### Unit Tests
```javascript
describe("PrivacyLearning", function () {
    it("Should allow student enrollment", async function () {
        await privacyLearning.connect(student1).enrollStudent();
        expect(await privacyLearning.isStudentEnrolled(student1.address)).to.equal(true);
    });

    it("Should update progress correctly", async function () {
        await privacyLearning.connect(student1).enrollStudent();
        await privacyLearning.connect(student1).completeLesson(0, 0, true);
        expect(await privacyLearning.connect(student1).getMyModuleProgress(0)).to.equal(25);
    });
});
```

#### Integration Tests
```javascript
describe("Full User Journey", function () {
    it("Should complete full learning path", async function () {
        // Enroll student
        await privacyLearning.connect(student1).enrollStudent();

        // Complete all lessons in a module
        for (let i = 0; i < 4; i++) {
            await privacyLearning.connect(student1).completeLesson(0, i, true);
        }

        // Verify module completion
        expect(await privacyLearning.connect(student1).getMyModuleProgress(0)).to.equal(100);
    });
});
```

## Security Considerations

### 1. Access Control

```solidity
modifier onlyEnrolled() {
    require(studentProgress[msg.sender].isEnrolled, "Student not enrolled");
    _;
}

modifier onlyOwner() {
    require(msg.sender == owner, "Only owner can call this function");
    _;
}
```

### 2. Input Validation

```solidity
function completeLesson(uint8 _moduleId, uint8 _lessonId, bool _completed) external onlyEnrolled {
    require(_moduleId < moduleCount, "Invalid module ID");
    require(_lessonId < LESSONS_PER_MODULE, "Invalid lesson ID");
    require(learningModules[_moduleId].isActive, "Module not active");
    // ... rest of function
}
```

### 3. Privacy Protection

- **Data Segregation**: Students can only access their own progress
- **Encryption**: Sensitive data encrypted with FHE
- **Minimal Disclosure**: Only necessary data is made public
- **Event Privacy**: Events contain minimal identifying information

### 4. Economic Security

```solidity
// Prevent resource exhaustion
uint8 public constant LESSONS_PER_MODULE = 4;
uint8 public constant MAX_MODULES = 10;

// Owner controls
function addModule(string memory _name, uint8 _totalLessons) external onlyOwner {
    require(moduleCount < MAX_MODULES, "Maximum modules reached");
    // ... implementation
}
```

## Deployment Guide

### 1. Local Development

```bash
# Start Hardhat network
npx hardhat node

# Deploy contract
npx hardhat run scripts/deploy.js --network localhost
```

### 2. Testnet Deployment

```bash
# Set environment variables
export PRIVATE_KEY="your_private_key"

# Deploy to Zama testnet
npx hardhat run scripts/deploy.js --network zama
```

### 3. Verification

```bash
# Verify contract on explorer
npx hardhat verify --network zama DEPLOYED_CONTRACT_ADDRESS

# Test deployment
npx hardhat run scripts/test-deployment.js --network zama
```

### 4. Production Considerations

- **Gas Optimization**: Use `view` functions where possible
- **Upgrade Patterns**: Consider proxy patterns for upgradability
- **Monitoring**: Set up event monitoring for user actions
- **Backup**: Implement data export functionality

## Best Practices

### 1. Code Organization

```solidity
contract PrivacyLearning {
    // 1. State variables
    mapping(address => StudentProgress) private studentProgress;

    // 2. Events
    event StudentEnrolled(address indexed student);

    // 3. Modifiers
    modifier onlyEnrolled() { /* ... */ }

    // 4. Constructor
    constructor() { /* ... */ }

    // 5. External functions
    function enrollStudent() external { /* ... */ }

    // 6. Public functions
    function getModuleInfo(uint8 _moduleId) public view { /* ... */ }

    // 7. Internal functions
    function _updateProgress(uint8 _moduleId) internal { /* ... */ }

    // 8. Private functions
    function _initializeModules() private { /* ... */ }
}
```

### 2. Error Handling

```solidity
// Use descriptive error messages
require(_moduleId < moduleCount, "Invalid module ID");

// Consider custom errors for gas efficiency
error InvalidModuleId(uint8 moduleId);
error StudentNotEnrolled(address student);
```

### 3. Event Design

```solidity
// Index important fields for filtering
event LessonCompleted(
    address indexed student,
    uint8 indexed moduleId,
    uint8 lessonId
);

// Include relevant data for off-chain processing
event ProgressUpdated(
    address indexed student,
    uint32 totalProgress,
    uint32 completedLessons
);
```

### 4. Documentation

```solidity
/**
 * @title PrivacyLearning
 * @dev Implements a privacy-preserving online learning platform using FHE
 * @notice This contract allows students to track learning progress privately
 */

/**
 * @dev Complete a lesson and update progress
 * @param _moduleId The ID of the module (0-3)
 * @param _lessonId The ID of the lesson within the module (0-3)
 * @param _completed Whether the lesson was completed
 */
function completeLesson(uint8 _moduleId, uint8 _lessonId, bool _completed) external;
```

This smart contract guide provides the foundation for building privacy-preserving educational applications using FHEVM technology. The modular design allows for easy extension and the privacy features ensure student data remains confidential while still enabling meaningful interactions and progress tracking.