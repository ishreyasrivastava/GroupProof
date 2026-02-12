const hre = require("hardhat");

async function main() {
  console.log("Deploying GroupProof contract...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "MATIC");
  
  const GroupProof = await hre.ethers.getContractFactory("GroupProof");
  const groupProof = await GroupProof.deploy();
  
  await groupProof.waitForDeployment();
  
  const address = await groupProof.getAddress();
  console.log("GroupProof deployed to:", address);
  
  // Wait for block confirmations
  console.log("Waiting for block confirmations...");
  await groupProof.deploymentTransaction().wait(5);
  
  console.log("\n========================================");
  console.log("Deployment successful!");
  console.log("Contract address:", address);
  console.log("Network:", hre.network.name);
  console.log("========================================\n");
  
  // Output for dashboard config
  console.log("Add to dashboard .env:");
  console.log(`VITE_CONTRACT_ADDRESS=${address}`);
  
  return address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
