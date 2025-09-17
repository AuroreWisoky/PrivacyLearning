// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract PrivacyLearning {
    
    struct LearningModule {
        string name;
        uint8 totalLessons;
        bool isActive;
    }

    struct StudentProgress {
        mapping(uint8 => mapping(uint8 => bool)) lessonCompleted; // moduleId => lessonId => completed
        mapping(uint8 => uint32) moduleProgress; // moduleId => progress percentage  
        uint32 totalProgress; // overall progress
        uint32 completedLessons; // total completed lessons
        uint32 learningStreak; // public streak for gamification
        uint256 lastActiveDay;
        bool isEnrolled;
    }

    mapping(address => StudentProgress) private studentProgress;
    mapping(uint8 => LearningModule) public learningModules;
    
    address public owner;
    uint8 public moduleCount;
    uint8 public constant LESSONS_PER_MODULE = 4;
    
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

    function initializeModules() private {
        learningModules[0] = LearningModule("Cryptography Basics", LESSONS_PER_MODULE, true);
        learningModules[1] = LearningModule("Blockchain Fundamentals", LESSONS_PER_MODULE, true);
        learningModules[2] = LearningModule("Privacy Technologies", LESSONS_PER_MODULE, true);
        learningModules[3] = LearningModule("Advanced Applications", LESSONS_PER_MODULE, true);
        moduleCount = 4;
    }

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

    function completeLesson(uint8 _moduleId, uint8 _lessonId, bool _completed) external onlyEnrolled {
        require(_moduleId < moduleCount, "Invalid module ID");
        require(_lessonId < LESSONS_PER_MODULE, "Invalid lesson ID");
        require(learningModules[_moduleId].isActive, "Module not active");

        // Frontend sends boolean, contract stores it
        // In FHE version: ebool encryptedCompleted = TFHE.asEbool(_completed);
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

    // Public view functions for contract information
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

    // Owner functions
    function addModule(string memory _name, uint8 _totalLessons) external onlyOwner {
        require(moduleCount < 255, "Maximum modules reached");
        learningModules[moduleCount] = LearningModule(_name, _totalLessons, true);
        moduleCount++;
    }

    function toggleModule(uint8 _moduleId) external onlyOwner {
        require(_moduleId < moduleCount, "Invalid module ID");
        learningModules[_moduleId].isActive = !learningModules[_moduleId].isActive;
    }

    // Emergency function
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}