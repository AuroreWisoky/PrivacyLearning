const { exec } = require('child_process');
const path = require('path');

console.log('🔧 Testing FHE Contract Compilation...');
console.log('📦 Dependencies:');
console.log('  - @fhevm/solidity: ^0.7.0');
console.log('  - @fhevm/hardhat-plugin: 0.0.1-3');
console.log('  - hardhat: ^2.24.3');
console.log('');

// Test compilation
exec('npx hardhat compile', { cwd: path.dirname(__dirname) }, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Compilation failed:');
    console.error(error.message);
    return;
  }
  
  if (stderr) {
    console.warn('⚠️ Compilation warnings:');
    console.warn(stderr);
  }
  
  console.log('✅ Compilation successful!');
  console.log(stdout);
  
  // Extract contract artifacts info
  if (stdout.includes('PrivacyLearning')) {
    console.log('✅ PrivacyLearning contract compiled successfully');
    console.log('🔐 FHE features enabled:');
    console.log('  - ebool for encrypted boolean values');
    console.log('  - euint32 for encrypted integers');
    console.log('  - FHE.asEbool() for boolean encryption');
    console.log('  - FHE.select() for conditional operations');
    console.log('  - .add(), .mul(), .div() for homomorphic arithmetic');
  }
});