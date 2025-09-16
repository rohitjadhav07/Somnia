const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🌱 Seeding Flash Liquidity Layer with mock data...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Seeding with account:", deployer.address);

  // Load deployment info
  const deploymentPath = path.join(__dirname, "../deployments/somnia.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("Deployment file not found. Run 'npm run deploy' first.");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contracts = deployment.contracts;

  // Get contract instances
  const registry = await ethers.getContractAt("LiquidityPoolRegistry", contracts.LiquidityPoolRegistry);
  const flashModule = await ethers.getContractAt("FlashBorrowModule", contracts.FlashBorrowModule);
  const router = await ethers.getContractAt("LiquidityRouter", contracts.LiquidityRouter);

  console.log("\n🪙 Deploying mock tokens...");
  
  // Deploy mock tokens
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  
  const tokens = [
    { name: "Mock USDC", symbol: "mUSDC", decimals: 6, supply: ethers.parseUnits("1000000", 6) },
    { name: "Mock USDT", symbol: "mUSDT", decimals: 6, supply: ethers.parseUnits("1000000", 6) },
    { name: "Mock WETH", symbol: "mWETH", decimals: 18, supply: ethers.parseUnits("10000", 18) },
    { name: "Mock WBTC", symbol: "mWBTC", decimals: 8, supply: ethers.parseUnits("100", 8) },
  ];

  const deployedTokens = {};
  
  for (const token of tokens) {
    const mockToken = await MockERC20.deploy(
      token.name,
      token.symbol,
      token.decimals,
      token.supply
    );
    await mockToken.waitForDeployment();
    const tokenAddress = await mockToken.getAddress();
    deployedTokens[token.symbol] = tokenAddress;
    console.log(`✅ ${token.name} (${token.symbol}) deployed to:`, tokenAddress);
  }

  console.log("\n🏊 Deploying mock liquidity pools...");
  
  // Deploy mock pools
  const MockLiquidityPool = await ethers.getContractFactory("MockLiquidityPool");
  
  const pools = [
    { token0: "mUSDC", token1: "mUSDT", fee: 30 }, // 0.3%
    { token0: "mUSDC", token1: "mWETH", fee: 300 }, // 3%
    { token0: "mWETH", token1: "mWBTC", fee: 300 }, // 3%
    { token0: "mUSDT", token1: "mWETH", fee: 300 }, // 3%
  ];

  const deployedPools = {};

  for (const pool of pools) {
    const mockPool = await MockLiquidityPool.deploy(
      deployedTokens[pool.token0],
      deployedTokens[pool.token1]
    );
    await mockPool.waitForDeployment();
    const poolAddress = await mockPool.getAddress();
    deployedPools[`${pool.token0}-${pool.token1}`] = poolAddress;
    console.log(`✅ ${pool.token0}/${pool.token1} pool deployed to:`, poolAddress);

    // Register pool in registry
    await registry.registerPool(poolAddress, pool.fee);
    console.log(`📋 Registered ${pool.token0}/${pool.token1} pool with ${pool.fee/100}% fee`);

    // Authorize router for this pool
    await registry.authorizeRouter(contracts.LiquidityRouter, poolAddress);
    console.log(`🔐 Authorized router for ${pool.token0}/${pool.token1} pool`);
  }

  console.log("\n💰 Adding liquidity to pools...");
  
  // Add liquidity to pools
  const liquidityAmounts = {
    "mUSDC-mUSDT": [ethers.parseUnits("100000", 6), ethers.parseUnits("100000", 6)],
    "mUSDC-mWETH": [ethers.parseUnits("100000", 6), ethers.parseUnits("50", 18)],
    "mWETH-mWBTC": [ethers.parseUnits("100", 18), ethers.parseUnits("5", 8)],
    "mUSDT-mWETH": [ethers.parseUnits("100000", 6), ethers.parseUnits("50", 18)],
  };

  for (const [poolKey, amounts] of Object.entries(liquidityAmounts)) {
    const poolAddress = deployedPools[poolKey];
    const pool = await ethers.getContractAt("MockLiquidityPool", poolAddress);
    
    const [token0Symbol, token1Symbol] = poolKey.split("-");
    const token0Address = deployedTokens[token0Symbol];
    const token1Address = deployedTokens[token1Symbol];
    
    const token0 = await ethers.getContractAt("MockERC20", token0Address);
    const token1 = await ethers.getContractAt("MockERC20", token1Address);

    // Approve tokens
    await token0.approve(poolAddress, amounts[0]);
    await token1.approve(poolAddress, amounts[1]);

    // Add liquidity
    await pool.addLiquidity(amounts[0], amounts[1]);
    console.log(`💧 Added liquidity to ${poolKey} pool`);
  }

  console.log("\n⚡ Setting up flash loan module...");
  
  // Add supported tokens to flash module
  for (const [symbol, address] of Object.entries(deployedTokens)) {
    await flashModule.addSupportedToken(address);
    console.log(`✅ Added ${symbol} as supported flash loan token`);
  }

  // Deposit some liquidity to flash module for flash loans
  const flashLiquidityAmounts = {
    "mUSDC": ethers.parseUnits("50000", 6),
    "mUSDT": ethers.parseUnits("50000", 6),
    "mWETH": ethers.parseUnits("25", 18),
    "mWBTC": ethers.parseUnits("2", 8),
  };

  for (const [symbol, amount] of Object.entries(flashLiquidityAmounts)) {
    const tokenAddress = deployedTokens[symbol];
    const token = await ethers.getContractAt("MockERC20", tokenAddress);
    
    await token.approve(contracts.FlashBorrowModule, amount);
    await flashModule.depositLiquidity(tokenAddress, amount);
    console.log(`💰 Deposited ${symbol} liquidity for flash loans`);
  }

  // Update deployment file with seed data (convert BigInt to string)
  const serializableLiquidityAmounts = {};
  for (const [key, amounts] of Object.entries(liquidityAmounts)) {
    serializableLiquidityAmounts[key] = amounts.map(amount => amount.toString());
  }
  
  const serializableFlashLiquidityAmounts = {};
  for (const [key, amount] of Object.entries(flashLiquidityAmounts)) {
    serializableFlashLiquidityAmounts[key] = amount.toString();
  }

  deployment.seedData = {
    tokens: deployedTokens,
    pools: deployedPools,
    liquidityAmounts: serializableLiquidityAmounts,
    flashLiquidityAmounts: serializableFlashLiquidityAmounts,
    seededAt: new Date().toISOString()
  };

  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));

  // Update frontend config with token addresses
  const frontendConfigPath = path.join(__dirname, "../src/config/contracts.json");
  const frontendConfig = JSON.parse(fs.readFileSync(frontendConfigPath, "utf8"));
  frontendConfig.tokens = deployedTokens;
  frontendConfig.pools = deployedPools;
  
  fs.writeFileSync(frontendConfigPath, JSON.stringify(frontendConfig, null, 2));

  console.log("\n🎉 Seeding completed successfully!");
  console.log("📄 Updated deployment info with seed data");
  console.log("⚙️  Updated frontend config with token addresses");
  
  console.log("\n📊 Summary:");
  console.log(`Tokens deployed: ${Object.keys(deployedTokens).length}`);
  console.log(`Pools deployed: ${Object.keys(deployedPools).length}`);
  console.log(`Flash loan tokens: ${Object.keys(flashLiquidityAmounts).length}`);
  
  console.log("\n🔗 Ready for testing!");
  console.log("You can now start the frontend and test swaps and flash loans.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });