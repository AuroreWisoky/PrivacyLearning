import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  
  console.log("🔍 Verifying Privacy Learning Contract...");
  console.log("📍 Contract Address:", contractAddress);
  
  // Contract ABI
  const contractABI = [
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

  try {
    // Connect to the contract
    const contract = new ethers.Contract(contractAddress, contractABI, ethers.provider);
    
    console.log("✅ Contract connected successfully");
    
    // Verify contract functions
    const totalModules = await contract.getTotalModules();
    console.log(`📚 Total modules: ${totalModules}`);
    
    // Get module information
    for (let i = 0; i < totalModules; i++) {
      const moduleInfo = await contract.getModuleInfo(i);
      console.log(`📖 Module ${i}: ${moduleInfo[0]} (${moduleInfo[1]} lessons, active: ${moduleInfo[2]})`);
    }
    
    console.log("\n🎉 Contract verification completed successfully!");
    console.log("🌐 Frontend will use this contract at:", contractAddress);
    
  } catch (error) {
    console.error("❌ Contract verification failed:", error.message);
    console.log("⚠️  Please ensure:");
    console.log("   1. The contract is deployed at the specified address");
    console.log("   2. You're connected to the correct network");
    console.log("   3. The contract ABI matches the deployed contract");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });