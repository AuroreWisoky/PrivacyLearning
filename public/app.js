// Privacy Learning DApp - Real Blockchain Implementation
class PrivacyLearningApp {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAddress = null;
        this.contractAddress = null;
        
        // Privacy Learning Contract ABI - Production Ready
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

        // Deployed contract address
        this.deployedContractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
        
        // Real contract bytecode placeholder - would be generated from actual Solidity compilation
        this.contractBytecode = "0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550610123565b6040518060400160405280601381526020017f43727970746f6772617068792042617369637300000000000000000000000000815250600160008081526020019081526020016000206000820151816000019081611234919061034d565b506020820151816001015f6101000a81548160ff021916908360ff1602179055509050506040518060400160405280601781526020017f426c6f636b636861696e2046756e64616d656e74616c73000000000000000000815250600160006001815260200190815260200160002060008201518160000190816112b1919061034d565b506020820151816001015f6101000a81548160ff021916908360ff16021790555090505060405180604001604052806013815260200100...";

        this.modules = [
            { id: 0, name: 'crypto', title: 'Cryptography Basics', lessons: 4 },
            { id: 1, name: 'blockchain', title: 'Blockchain Fundamentals', lessons: 4 },
            { id: 2, name: 'privacy', title: 'Privacy Technologies', lessons: 4 },
            { id: 3, name: 'advanced', title: 'Advanced Applications', lessons: 4 }
        ];

        this.init();
    }

    async init() {
        await this.setupEventListeners();
        await this.loadLocalProgress();
        this.updateUI();
    }

    setupEventListeners() {
        document.getElementById('connectWallet').addEventListener('click', () => this.connectWallet());
        document.getElementById('deployContract').addEventListener('click', () => this.deployContract());
        
        // Add lesson checkbox listeners
        document.querySelectorAll('.lesson-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const moduleId = e.target.dataset.module;
                const lessonId = parseInt(e.target.dataset.lesson);
                this.saveLocalProgress(moduleId, lessonId, e.target.checked);
                this.updateLocalStats();
            });
        });
    }

    async connectWallet() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                // Request account access
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                
                this.provider = new ethers.BrowserProvider(window.ethereum);
                this.signer = await this.provider.getSigner();
                this.userAddress = await this.signer.getAddress();
                
                // Get network info
                const network = await this.provider.getNetwork();
                
                document.getElementById('networkInfo').innerHTML = `
                    Connected: ${this.userAddress.slice(0, 6)}...${this.userAddress.slice(-4)} | 
                    Network: ${network.name} (Chain ID: ${network.chainId})
                `;
                document.getElementById('networkInfo').classList.remove('hidden');
                
                document.getElementById('connectWallet').textContent = 'Connected';
                document.getElementById('connectWallet').disabled = true;
                document.getElementById('deployContract').disabled = false;
                
                // Use deployed contract address first, then check localStorage
                let contractAddress = this.deployedContractAddress;
                if (!contractAddress) {
                    contractAddress = localStorage.getItem('privacyLearningContract');
                }
                
                if (contractAddress) {
                    this.contractAddress = contractAddress;
                    this.contract = new ethers.Contract(contractAddress, this.contractABI, this.signer);
                    document.getElementById('contractAddress').innerHTML = `Contract: ${contractAddress}`;
                    document.getElementById('contractAddress').classList.remove('hidden');
                    document.getElementById('deployContract').textContent = 'Use Deployed Contract';
                    document.getElementById('deployContract').disabled = true;
                    
                    await this.loadBlockchainProgress();
                }
                
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

            document.getElementById('deployContract').textContent = 'Connecting...';
            document.getElementById('deployContract').disabled = true;

            // Connect to deployed contract
            console.log('Connecting to PrivacyLearning contract...');
            this.contractAddress = this.deployedContractAddress;
            this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.signer);
            
            // Verify contract is deployed by calling a view function
            try {
                const totalModules = await this.contract.getTotalModules();
                console.log(`Contract verified. Total modules: ${totalModules}`);
            } catch (error) {
                throw new Error(`Contract not found at ${this.contractAddress}`);
            }
            
            localStorage.setItem('privacyLearningContract', this.contractAddress);

            document.getElementById('contractAddress').innerHTML = `Contract: ${this.contractAddress}`;
            document.getElementById('contractAddress').classList.remove('hidden');
            document.getElementById('deployContract').textContent = 'Contract Connected';
            
            // Auto-enroll the student
            await this.enrollStudent();
            
            alert('Connected to contract successfully! You have been automatically enrolled.');
            
        } catch (error) {
            console.error('Error connecting to contract:', error);
            alert('Error connecting to contract: ' + error.message);
            document.getElementById('deployContract').textContent = 'Connect to Contract';
            document.getElementById('deployContract').disabled = false;
        }
    }

    async enrollStudent() {
        try {
            if (!this.contract) {
                alert('Please deploy the contract first');
                return;
            }

            console.log('Enrolling student...');
            const tx = await this.contract.enrollStudent();
            console.log('Enrollment transaction:', tx.hash);
            
            // Wait for transaction to be mined
            const receipt = await tx.wait();
            console.log('Student enrolled successfully, block:', receipt.blockNumber);
            
        } catch (error) {
            console.error('Error enrolling student:', error);
            // Don't show alert for enrollment error in auto-enroll scenarios
            if (error.message.includes('Already enrolled')) {
                console.log('Student is already enrolled');
                return;
            }
            alert('Error enrolling student: ' + error.message);
        }
    }

    async ensureStudentEnrolled() {
        try {
            if (!this.contract || !this.userAddress) {
                return false;
            }

            // Check if student is already enrolled
            const isEnrolled = await this.contract.isStudentEnrolled(this.userAddress);
            
            if (!isEnrolled) {
                console.log('Student not enrolled, enrolling now...');
                await this.enrollStudent();
                return true;
            }
            
            console.log('Student is already enrolled');
            return true;
            
        } catch (error) {
            console.error('Error checking/ensuring enrollment:', error);
            return false;
        }
    }

    async updateProgress(moduleId) {
        try {
            if (!this.contract) {
                alert('Please deploy the contract first');
                return;
            }

            // Check if student is enrolled, if not, enroll first
            await this.ensureStudentEnrolled();

            const module = this.modules.find(m => m.name === moduleId);
            if (!module) return;

            const checkboxes = document.querySelectorAll(`input[data-module="${moduleId}"]`);
            
            // Update all lessons in the module
            const updatePromises = [];
            for (let i = 0; i < checkboxes.length; i++) {
                const checkbox = checkboxes[i];
                const lessonId = parseInt(checkbox.dataset.lesson);
                const isCompleted = checkbox.checked;
                
                console.log(`Updating lesson ${lessonId} in module ${module.id}: ${isCompleted}`);
                
                // Frontend sends boolean directly, contract handles FHE encryption
                const txPromise = this.contract.completeLesson(module.id, lessonId, isCompleted)
                    .then(tx => tx.wait())
                    .then(receipt => {
                        console.log(`Lesson ${lessonId} updated in block ${receipt.blockNumber}`);
                        return receipt;
                    })
                    .catch(error => {
                        console.error(`Error updating lesson ${lessonId}:`, error);
                        throw error;
                    });
                
                updatePromises.push(txPromise);
            }

            // Wait for all transactions to complete
            await Promise.all(updatePromises);
            
            // Load updated progress from blockchain
            await this.loadBlockchainProgress();
            alert(`Progress updated for ${module.title}!`);
            
        } catch (error) {
            console.error('Error updating progress:', error);
            alert('Error updating progress: ' + error.message);
        }
    }

    updateLocalProgressFromCheckboxes(moduleId) {
        const checkboxes = document.querySelectorAll(`input[data-module="${moduleId}"]`);
        checkboxes.forEach((checkbox, index) => {
            this.saveLocalProgress(moduleId, index, checkbox.checked);
        });
        this.updateLocalStats();
        this.updateModuleProgress(moduleId);
        alert(`Local progress updated for ${moduleId}!`);
    }

    async loadBlockchainProgress() {
        try {
            if (!this.contract) return;

            // Ensure student is enrolled before trying to load progress
            const enrolled = await this.ensureStudentEnrolled();
            if (!enrolled) {
                console.log('Could not ensure student enrollment, using local progress');
                this.updateLocalStats();
                return;
            }

            // Load learning streak (public data for gamification)
            const learningStreak = await this.contract.getMyLearningStreak();
            document.getElementById('learningStreak').textContent = learningStreak;

            // Load progress data
            const totalProgress = await this.contract.getMyTotalProgress();
            const completedLessons = await this.contract.getMyCompletedLessons();
            
            document.getElementById('overallProgress').textContent = `${totalProgress}%`;
            document.getElementById('totalLessons').textContent = completedLessons;
            
            console.log('Blockchain progress loaded');

        } catch (error) {
            console.error('Error loading blockchain progress:', error);
            // Fallback to local progress if blockchain call fails
            this.updateLocalStats();
        }
    }

    saveLocalProgress(moduleId, lessonId, completed) {
        const key = `progress_${moduleId}_${lessonId}`;
        localStorage.setItem(key, completed.toString());
    }

    loadLocalProgress() {
        this.modules.forEach(module => {
            for (let i = 0; i < module.lessons; i++) {
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
            for (let i = 0; i < module.lessons; i++) {
                const key = `progress_${module.name}_${i}`;
                if (localStorage.getItem(key) === 'true') {
                    moduleCompleted++;
                    totalCompleted++;
                }
                totalLessons++;
            }
            
            if (moduleCompleted === module.lessons) {
                totalModulesCompleted++;
            }
        });

        const overallProgress = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;
        
        document.getElementById('totalLessons').textContent = totalCompleted;
        document.getElementById('totalModules').textContent = totalModulesCompleted;
        document.getElementById('overallProgress').textContent = `${overallProgress}%`;
        
        // Simulate learning streak (could be enhanced with real date tracking)
        const streak = Math.max(1, Math.floor(totalCompleted / 2));
        document.getElementById('learningStreak').textContent = streak;
    }

    updateUI() {
        // Update progress bars for all modules
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