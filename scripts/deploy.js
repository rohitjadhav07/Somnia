const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Flash Liquidity Layer to Somnia Network...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const deployedContracts = {};

  // Deploy LiquidityPoolRegistry
  console.log("\n📋 Deploying LiquidityPoolRegistry...");
  const LiquidityPoolRegistry = await ethers.getContractFactory("LiquidityPoolRegistry");
  const registry = await LiquidityPoolRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  
  // Initialize the contract
  await registry.initialize(deployer.address, 100); // feeRecipient, protocolFee (1%)
  console.log("✅ LiquidityPoolRegistry deployed to:", registryAddress);
  deployedContracts.LiquidityPoolRegistry = registryAddress;

  // Deploy FlashBorrowModule
  console.log("\n⚡ Deploying FlashBorrowModule...");
  const FlashBorrowModule = await ethers.getContractFactory("FlashBorrowModule");
  const flashModule = await FlashBorrowModule.deploy();
  await flashModule.waitForDeployment();
  const flashModuleAddress = await flashModule.getAddress();
  
  // Initialize the contract
  await flashModule.initialize(registryAddress, 50); // registry, flashLoanFee (0.5%)
  console.log("✅ FlashBorrowModule deployed to:", flashModuleAddress);
  deployedContracts.FlashBorrowModule = flashModuleAddress;

  // Deploy LiquidityRouter
  console.log("\n🔄 Deploying LiquidityRouter...");
  const LiquidityRouter = await ethers.getContractFactory("LiquidityRouter");
  const router = await LiquidityRouter.deploy();
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  
  // Initialize the contract
  await router.initialize(registryAddress, flashModuleAddress, 25); // registry, flashModule, routerFee (0.25%)
  console.log("✅ LiquidityRouter deployed to:", routerAddress);
  deployedContracts.LiquidityRouter = routerAddress;

  // Authorize router in registry
  console.log("\n🔐 Setting up permissions...");
  // Note: In a real deployment, you'd authorize the router for specific pools
  // For now, we'll just log that this step is needed
  console.log("⚠️  Remember to authorize router for pools after registration");

  // Save deployment addresses
  const deploymentInfo = {
    network: "somnia",
    chainId: 50312,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: deployedContracts,
    gasUsed: {
      // These would be filled in a real deployment
      registry: "TBD",
      flashModule: "TBD", 
      router: "TBD"
    }
  };

  const deploymentPath = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentPath, "somnia.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Generate frontend config
  const frontendConfig = {
    contracts: {
      LiquidityPoolRegistry: {
        address: registryAddress,
        abi: "LiquidityPoolRegistry"
      },
      FlashBorrowModule: {
        address: flashModuleAddress,
        abi: "FlashBorrowModule"
      },
      LiquidityRouter: {
        address: routerAddress,
        abi: "LiquidityRouter"
      }
    },
    network: {
      name: "Somnia Testnet",
      chainId: 50312,
      rpcUrl: process.env.SOMNIA_RPC_URL || "https://dream-rpc.somnia.network",
      blockExplorer: "https://somnia-testnet.blockscout.com"
    }
  };

  fs.writeFileSync(
    path.join(__dirname, "../src/config/contracts.json"),
    JSON.stringify(frontendConfig, null, 2)
  );

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📄 Deployment info saved to deployments/somnia.json");
  console.log("⚙️  Frontend config saved to src/config/contracts.json");
  
  console.log("\n📋 Contract Addresses:");
  console.log("LiquidityPoolRegistry:", registryAddress);
  console.log("FlashBorrowModule:", flashModuleAddress);
  console.log("LiquidityRouter:", routerAddress);

  console.log("\n🔗 Next steps:");
  console.log("1. Run 'npm run seed' to deploy mock pools");
  console.log("2. Run 'npm run verify' to verify contracts");
  console.log("3. Start the frontend with 'npm run dev'");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });