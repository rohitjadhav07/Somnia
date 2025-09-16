const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Flash Liquidity Layer locally...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const deployedContracts = {};

  // Deploy LiquidityPoolRegistry
  console.log("\n📋 Deploying LiquidityPoolRegistry...");
  const LiquidityPoolRegistry = await ethers.getContractFactory("LiquidityPoolRegistry");
  const registry = await upgrades.deployProxy(
    LiquidityPoolRegistry,
    [deployer.address, 100], // feeRecipient, protocolFee (1%)
    { initializer: "initialize" }
  );
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✅ LiquidityPoolRegistry deployed to:", registryAddress);
  deployedContracts.LiquidityPoolRegistry = registryAddress;

  // Deploy FlashBorrowModule
  console.log("\n⚡ Deploying FlashBorrowModule...");
  const FlashBorrowModule = await ethers.getContractFactory("FlashBorrowModule");
  const flashModule = await upgrades.deployProxy(
    FlashBorrowModule,
    [registryAddress, 50], // registry, flashLoanFee (0.5%)
    { initializer: "initialize" }
  );
  await flashModule.waitForDeployment();
  const flashModuleAddress = await flashModule.getAddress();
  console.log("✅ FlashBorrowModule deployed to:", flashModuleAddress);
  deployedContracts.FlashBorrowModule = flashModuleAddress;

  // Deploy LiquidityRouter
  console.log("\n🔄 Deploying LiquidityRouter...");
  const LiquidityRouter = await ethers.getContractFactory("LiquidityRouter");
  const router = await upgrades.deployProxy(
    LiquidityRouter,
    [registryAddress, flashModuleAddress, 25], // registry, flashModule, routerFee (0.25%)
    { initializer: "initialize" }
  );
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("✅ LiquidityRouter deployed to:", routerAddress);
  deployedContracts.LiquidityRouter = routerAddress;

  // Save deployment addresses
  const deploymentInfo = {
    network: "localhost",
    chainId: 31337,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: deployedContracts,
  };

  const deploymentPath = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentPath, "localhost.json"),
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
      name: "Localhost",
      chainId: 31337,
      rpcUrl: "http://localhost:8545",
      blockExplorer: "http://localhost:8545"
    }
  };

  const srcConfigPath = path.join(__dirname, "../src/config");
  if (!fs.existsSync(srcConfigPath)) {
    fs.mkdirSync(srcConfigPath, { recursive: true });
  }

  fs.writeFileSync(
    path.join(srcConfigPath, "contracts.json"),
    JSON.stringify(frontendConfig, null, 2)
  );

  console.log("\n🎉 Local deployment completed successfully!");
  console.log("📄 Deployment info saved to deployments/localhost.json");
  console.log("⚙️  Frontend config saved to src/config/contracts.json");
  
  console.log("\n📋 Contract Addresses:");
  console.log("LiquidityPoolRegistry:", registryAddress);
  console.log("FlashBorrowModule:", flashModuleAddress);
  console.log("LiquidityRouter:", routerAddress);

  console.log("\n🔗 Next steps:");
  console.log("1. Run 'npm run seed:local' to deploy mock pools");
  console.log("2. Start the frontend with 'npm run dev'");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });