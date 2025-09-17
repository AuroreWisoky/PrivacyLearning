import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  console.log("Deploying PrivacyLearning contract...");

  // Get the contract factory
  const PrivacyLearning = await ethers.getContractFactory("PrivacyLearning");

  // Deploy the contract
  console.log("Deployment in progress...");
  const privacyLearning = await PrivacyLearning.deploy();
  
  // Wait for deployment to complete
  await privacyLearning.waitForDeployment();

  const contractAddress = await privacyLearning.getAddress();
  console.log("PrivacyLearning deployed to:", contractAddress);

  // Verify the deployment
  console.log("Verifying deployment...");
  const moduleCount = await privacyLearning.getTotalModules();
  console.log("Total modules initialized:", moduleCount.toString());

  // Get module info for verification
  for (let i = 0; i < moduleCount; i++) {
    const moduleInfo = await privacyLearning.getModuleInfo(i);
    console.log(`Module ${i}: ${moduleInfo[0]} (${moduleInfo[1]} lessons, active: ${moduleInfo[2]})`);
  }

  console.log("\nDeployment completed successfully!");
  console.log("Contract address:", contractAddress);
  console.log("Save this address to use in your frontend application.");

  return contractAddress;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then((address) => {
    console.log("Deployment script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });